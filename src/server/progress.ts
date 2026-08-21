/**
 * 学习进度 server functions — 全部走 D1。
 */
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { getUserId } from "./identity.server";
import { gradeQuiz, type QuizResponse } from "./grading.server";

export interface LessonStateRow {
  lesson_id: string;
  status: "in_progress" | "completed";
  best_score: number | null;
  attempts: number;
  last_position: number | null;
  updated_at: number;
}

export interface MyProgress {
  lessons: LessonStateRow[];
  resumeLessonId: string | null;
}

/** 当前用户全部课程状态 + 续学位置 */
export const getMyProgress = createServerFn({ method: "GET" }).handler(
  async (): Promise<MyProgress> => {
    const userId = await getUserId();
    const db = env.DB;
    const [states, resume] = await Promise.all([
      db
        .prepare(
          `SELECT lesson_id, status, best_score, attempts, last_position, updated_at
           FROM lesson_state WHERE user_id = ?`,
        )
        .bind(userId)
        .all<LessonStateRow>(),
      db
        .prepare(`SELECT lesson_id FROM resume_point WHERE user_id = ?`)
        .bind(userId)
        .first<{ lesson_id: string }>(),
    ]);
    return {
      lessons: states.results ?? [],
      resumeLessonId: resume?.lesson_id ?? null,
    };
  },
);

const toggleSchema = z.object({
  lessonId: z.string().min(1).max(200),
  done: z.boolean(),
});

/** 标记/取消课程完成 */
export const markLessonComplete = createServerFn({ method: "POST" })
  .validator(toggleSchema)
  .handler(async ({ data }) => {
    const userId = await getUserId();
    const db = env.DB;
    const status = data.done ? "completed" : "in_progress";
    await db
      .prepare(
        `INSERT INTO lesson_state (user_id, lesson_id, status, updated_at)
         VALUES (?, ?, ?, unixepoch())
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
      )
      .bind(userId, data.lessonId, status)
      .run();
    await db
      .prepare(
        `INSERT INTO progress_events (user_id, lesson_id, event_type) VALUES (?, ?, ?)`,
      )
      .bind(userId, data.lessonId, data.done ? "complete" : "uncomplete")
      .run();
    if (data.done) {
      await touchResume(db, userId, data.lessonId);
    }
    return { ok: true as const };
  });

const positionSchema = z.object({
  lessonId: z.string().min(1).max(200),
  /** 0-100 的阅读百分比 */
  percent: z.number().int().min(0).max(100),
});

/** 保存阅读位置（客户端防抖调用） */
export const savePosition = createServerFn({ method: "POST" })
  .validator(positionSchema)
  .handler(async ({ data }) => {
    const userId = await getUserId();
    const db = env.DB;
    await db
      .prepare(
        `INSERT INTO lesson_state (user_id, lesson_id, status, last_position, updated_at)
         VALUES (?, ?, 'in_progress', ?, unixepoch())
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET
           last_position = excluded.last_position, updated_at = excluded.updated_at`,
      )
      .bind(userId, data.lessonId, data.percent)
      .run();
    await touchResume(db, userId, data.lessonId);
    return { ok: true as const };
  });

/** 记录一次访问（进入课程页时） */
export const recordVisit = createServerFn({ method: "POST" })
  .validator(z.object({ lessonId: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const userId = await getUserId();
    await env.DB
      .prepare(
        `INSERT INTO progress_events (user_id, lesson_id, event_type) VALUES (?, ?, 'visit')`,
      )
      .bind(userId, data.lessonId)
      .run();
    return { ok: true as const };
  });

const submitQuizSchema = z.object({
  quizId: z.string().min(1).max(200),
  lessonId: z.string().min(1).max(200),
  responses: z.array(
    z.object({
      single: z.string().optional(),
      multiple: z.array(z.string()).optional(),
      truefalse: z.boolean().optional(),
      order: z.array(z.string()).optional(),
      fill: z.string().optional(),
    }),
  ),
});

export interface SubmitQuizResult {
  score: number;
  correctCount: number;
  total: number;
  perQuestion: { correct: boolean; explanation?: string }[];
}

/** 提交测验 — 服务端判分，记录尝试次数与最高分 */
export const submitQuiz = createServerFn({ method: "POST" })
  .validator(submitQuizSchema)
  .handler(async ({ data }): Promise<SubmitQuizResult> => {
    const result = gradeQuiz(data.quizId, data.responses as QuizResponse[]);
    if (!result) throw new Error(`未知测验: ${data.quizId}`);

    const userId = await getUserId();
    const db = env.DB;
    await db
      .prepare(
        `INSERT INTO lesson_state (user_id, lesson_id, status, best_score, attempts, updated_at)
         VALUES (?, ?, 'in_progress', ?, 1, unixepoch())
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET
           best_score = MAX(COALESCE(lesson_state.best_score, -1), excluded.best_score),
           attempts = lesson_state.attempts + 1,
           updated_at = excluded.updated_at`,
      )
      .bind(userId, data.lessonId, result.score)
      .run();
    await db
      .prepare(
        `INSERT INTO progress_events (user_id, lesson_id, event_type, payload)
         VALUES (?, ?, 'quiz_attempt', ?)`,
      )
      .bind(userId, data.lessonId, JSON.stringify({ score: result.score }))
      .run();

    return result;
  });

async function touchResume(
  db: D1Database,
  userId: string,
  lessonId: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO resume_point (user_id, lesson_id, updated_at)
       VALUES (?, ?, unixepoch())
       ON CONFLICT (user_id) DO UPDATE SET lesson_id = excluded.lesson_id, updated_at = excluded.updated_at`,
    )
    .bind(userId, lessonId)
    .run();
}
