import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { getLesson, getModule } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { LessonBody } from "../components/LessonBody";
import { ConstructionBadge } from "../components/ConstructionBadge";
import { QuizRunner } from "../components/QuizRunner";
import { recordVisit } from "../server/progress";

export const Route = createFileRoute("/lessons/$")({
  loader: ({ params }) => {
    const lesson = getLesson(params._splat ?? "");
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.lesson.title} · k8s-learn` },
          { name: "description", content: loaderData.lesson.description ?? loaderData.lesson.title },
        ]
      : [],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lesson } = Route.useLoaderData();
  const mod = getModule(lesson.moduleId);
  const { isCompleted, toggleComplete, savePositionDebounced, states } = useProgress();

  const articleRef = useRef<HTMLDivElement>(null);

  // 访问打点（一次性）
  useEffect(() => {
    void recordVisit({ data: { lessonId: lesson.id } });
  }, [lesson.id]);

  // 恢复上次阅读位置（正文渲染完成后执行一次）
  const restoredRef = useRef(false);
  const restorePosition = useCallback(() => {
    if (restoredRef.current) return;
    const pos = states.get(lesson.id)?.lastPosition;
    if (pos == null || pos <= 0 || pos >= 95) return;
    restoredRef.current = true;
    const target = document.documentElement.scrollHeight * (pos / 100);
    window.scrollTo({ top: target - window.innerHeight / 2 });
  }, [lesson.id, states]);

  // 阅读位置追踪
  const onScroll = useCallback(() => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const pct = Math.round((window.scrollY / total) * 100);
    savePositionDebounced(lesson.id, pct);
  }, [lesson.id, savePositionDebounced]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const completed = isCompleted(lesson.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-mute">
        <Link to="/modules" className="hover:text-link">
          模块
        </Link>
        <span>/</span>
        {mod && (
          <>
            <Link to="/modules/$moduleId" params={{ moduleId: mod.id }} className="hover:text-link">
              {mod.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-body">{lesson.title}</span>
      </nav>

      <header className="mb-8 border-b border-hairline pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {lesson.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-mute">
              <span>{lesson.readingMinutes} 分钟</span>
              {lesson.underConstruction && <ConstructionBadge />}
              <a
                href={`https://github.com/wutz/k8s-in-action/blob/main/${lesson.sourcePath}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-link"
              >
                源文件 ↗
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleComplete(lesson.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              completed
                ? "bg-k8s-soft text-k8s-bright"
                : "bg-primary text-on-primary hover:opacity-85"
            }`}
          >
            {completed ? "✓ 已完成" : "标记完成"}
          </button>
        </div>
      </header>

      <div className="flex gap-10">
        <article className="min-w-0 flex-1" ref={articleRef}>
          <LessonBody lesson={lesson} onReady={restorePosition} />

          {/* 测验区 */}
          {lesson.quizIds.length > 0 && (
            <section id="quiz" className="mt-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">课后测验</h2>
              <QuizRunner quizIds={lesson.quizIds} lessonId={lesson.id} />
            </section>
          )}

          {/* 上下课导航 */}
          <nav className="mt-14 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
            {lesson.prevId ? (
              <PrevNextLink id={lesson.prevId} label="上一课" />
            ) : (
              <span />
            )}
            {lesson.nextId && (
              <PrevNextLink id={lesson.nextId} label="下一课" align="right" />
            )}
          </nav>
        </article>

        {/* TOC 侧栏 */}
        {lesson.sections.length > 0 && (
          <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto xl:block">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-mute">
              本页目录
            </p>
            <ul className="space-y-1.5 text-sm">
              {lesson.sections.map((s) => (
                <li key={s.id} className={s.level === 3 ? "pl-3" : ""}>
                  <a
                    href={`#${s.id}`}
                    className="block truncate text-body transition-colors hover:text-k8s-bright"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function PrevNextLink({
  id,
  label,
  align = "left",
}: {
  id: string;
  label: string;
  align?: "left" | "right";
}) {
  const lesson = getLesson(id);
  if (!lesson) return null;
  return (
    <Link
      to="/lessons/$"
      params={{ _splat: id }}
      className={`group rounded-md border border-hairline p-4 transition-colors hover:border-k8s/50 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <span className="font-mono text-xs text-mute">{label}</span>
      <span className="mt-1 block truncate font-medium group-hover:text-k8s-bright">
        {align === "left" ? "← " : ""}
        {lesson.title}
        {align === "right" ? " →" : ""}
      </span>
    </Link>
  );
}

