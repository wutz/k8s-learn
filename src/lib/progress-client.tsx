/**
 * 学习进度客户端状态 — 挂载时拉取一次，乐观更新。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  getMyProgress,
  markLessonComplete,
  savePosition,
  type MyProgress,
} from "../server/progress";

interface ProgressContextValue {
  ready: boolean;
  /** lessonId → 状态 */
  states: Map<string, LessonState>;
  isCompleted: (lessonId: string) => boolean;
  toggleComplete: (lessonId: string) => void;
  /** 防抖保存阅读位置 */
  savePositionDebounced: (lessonId: string, percent: number) => void;
  resumeLessonId: string | null;
}

export interface LessonState {
  status: "in_progress" | "completed";
  bestScore: number | null;
  attempts: number;
  lastPosition: number | null;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery<MyProgress>({
    queryKey: ["myProgress"],
    queryFn: () => getMyProgress(),
    staleTime: 30_000,
  });

  const [optimistic, setOptimistic] = useState<Map<string, LessonState>>(new Map());

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["myProgress"] });
  }, [queryClient]);

  const completeMutation = useMutation({
    mutationFn: (vars: { lessonId: string; done: boolean }) =>
      markLessonComplete({ data: vars }),
    onMutate: (vars) => {
      setOptimistic((prev) => {
        const next = new Map(prev);
        const old = next.get(vars.lessonId);
        next.set(vars.lessonId, {
          status: vars.done ? "completed" : "in_progress",
          bestScore: old?.bestScore ?? null,
          attempts: old?.attempts ?? 0,
          lastPosition: old?.lastPosition ?? null,
        });
        return next;
      });
    },
    onSettled: invalidate,
  });

  const states = useMemo(() => {
    const map = new Map<string, LessonState>();
    for (const row of data?.lessons ?? []) {
      map.set(row.lesson_id, {
        status: row.status,
        bestScore: row.best_score,
        attempts: row.attempts,
        lastPosition: row.last_position,
      });
    }
    for (const [k, v] of optimistic) {
      const existing = map.get(k);
      map.set(k, {
        ...v,
        bestScore: v.bestScore ?? existing?.bestScore ?? null,
        attempts: v.attempts || existing?.attempts || 0,
      });
    }
    return map;
  }, [data, optimistic]);

  // 乐观状态在服务端数据回来后清除
  useEffect(() => {
    if (!data) return;
    setOptimistic((prev) => (prev.size ? new Map() : prev));
  }, [data]);

  const isCompleted = useCallback(
    (lessonId: string) => states.get(lessonId)?.status === "completed",
    [states],
  );

  const toggleComplete = useCallback(
    (lessonId: string) => {
      const done = states.get(lessonId)?.status !== "completed";
      completeMutation.mutate({ lessonId, done });
    },
    [states, completeMutation],
  );

  // 阅读位置防抖（15s 或百分比变化 ≥5 时才真正发请求）
  const posRef = useRef<{ lessonId: string; percent: number; timer?: ReturnType<typeof setTimeout> } | null>(null);
  const savePositionDebounced = useCallback(
    (lessonId: string, percent: number) => {
      const ref = posRef.current;
      if (ref && ref.lessonId === lessonId && Math.abs(percent - ref.percent) < 5) return;
      if (ref?.timer) clearTimeout(ref.timer);
      posRef.current = { lessonId, percent };
      posRef.current.timer = setTimeout(() => {
        void savePosition({ data: { lessonId, percent } });
      }, 3000);
    },
    [],
  );

  const value: ProgressContextValue = {
    ready: !isPending,
    states,
    isCompleted,
    toggleComplete,
    savePositionDebounced,
    resumeLessonId: data?.resumeLessonId ?? null,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress 必须在 ProgressProvider 内使用");
  return ctx;
}
