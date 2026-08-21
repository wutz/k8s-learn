/**
 * 测验判分 — 仅被 server function handler 引用（客户端构建时随 handler 一起剥离）。
 */
import answersJson from "../content/generated/quiz-answers.json";
import quizzesJson from "../content/generated/quizzes.server.json";
import type { Quiz } from "../../content-src/types";

const ANSWERS = answersJson as Record<string, Record<string, unknown>[]>;
const QUIZ_SOURCE = quizzesJson as unknown as Quiz[];

export interface QuizResponse {
  single?: string;
  multiple?: string[];
  truefalse?: boolean;
  order?: string[];
  fill?: string;
}

export interface GradeResult {
  score: number; // 0-100
  correctCount: number;
  total: number;
  perQuestion: { correct: boolean; explanation?: string }[];
}

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function gradeQuiz(
  quizId: string,
  responses: QuizResponse[],
): GradeResult | null {
  const quiz = QUIZ_SOURCE.find((q) => q.id === quizId);
  const answers = ANSWERS[quizId];
  if (!quiz || !answers) return null;

  const perQuestion: { correct: boolean; explanation?: string }[] = [];
  let correctCount = 0;

  quiz.questions.forEach((question, i) => {
    const ans = answers[i] ?? {};
    const resp = responses[i] ?? {};
    let correct = false;

    switch (question.type) {
      case "single":
        correct = resp.single === (ans.answer as string);
        break;
      case "multiple": {
        const expected = (ans.answers as string[]) ?? [];
        const got = [...(resp.multiple ?? [])].sort();
        correct =
          expected.length === got.length && expected.every((v, j) => v === got[j]);
        break;
      }
      case "truefalse":
        correct = resp.truefalse === (ans.answer as boolean);
        break;
      case "order": {
        const expected = (ans.items as string[]) ?? [];
        const got = resp.order ?? [];
        correct =
          expected.length === got.length && expected.every((v, j) => v === got[j]);
        break;
      }
      case "fill": {
        const accepts = (ans.accepts as string[]) ?? [];
        const caseSensitive = (ans.caseSensitive as boolean) ?? false;
        const got = normalize(resp.fill ?? "");
        correct = accepts.some((a) =>
          caseSensitive
            ? normalize(a) === got
            : normalize(a).toLowerCase() === got.toLowerCase(),
        );
        break;
      }
    }

    if (correct) correctCount++;
    perQuestion.push({ correct, explanation: question.explanation });
  });

  return {
    score: Math.round((correctCount / quiz.questions.length) * 100),
    correctCount,
    total: quiz.questions.length,
    perQuestion,
  };
}
