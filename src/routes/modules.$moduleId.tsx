import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getModule } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ProgressBar } from "../components/ProgressBar";
import { ConstructionBadge } from "../components/ConstructionBadge";

export const Route = createFileRoute("/modules/$moduleId")({
  component: ModuleDetail,
});

function ModuleDetail() {
  const { moduleId } = Route.useParams();
  const mod = getModule(moduleId);
  if (!mod) throw notFound();

  const { isCompleted, states } = useProgress();
  const done = mod.lessons.filter(
    (l) => !l.underConstruction && isCompleted(l.id),
  ).length;
  const active = mod.lessons.filter((l) => !l.underConstruction).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Link to="/modules" className="font-mono text-xs text-mute hover:text-link">
        ← 全部模块
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{mod.title}</h1>
          <p className="mt-2 max-w-2xl text-body">{mod.description}</p>
        </div>
        <span className="font-mono text-sm text-mute">
          {done}/{active} 已完成
        </span>
      </div>
      <div className="mt-5">
        <ProgressBar value={active ? (done / active) * 100 : 0} />
      </div>

      <ol className="mt-10 divide-y divide-hairline border-y border-hairline">
        {mod.lessons.map((lesson) => {
          const completed = isCompleted(lesson.id);
          const pos = states.get(lesson.id)?.lastPosition;
          return (
            <li key={lesson.id}>
              <Link
                to="/lessons/$"
                params={{ _splat: lesson.id }}
                className="group flex items-center gap-4 py-3.5"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    completed
                      ? "bg-k8s text-white"
                      : "border border-hairline-strong text-transparent group-hover:border-k8s"
                  }`}
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate font-medium group-hover:text-k8s-bright ${
                      completed ? "text-body" : ""
                    }`}
                  >
                    {lesson.title}
                  </span>
                  {pos != null && pos > 0 && !completed && (
                    <span className="font-mono text-xs text-mute">读到 {pos}%</span>
                  )}
                </span>
                {lesson.quizIds.length > 0 && (
                  <span className="shrink-0 rounded-full bg-canvas-soft-2 px-2 py-0.5 font-mono text-xs text-body">
                    测验 ×{lesson.quizIds.length}
                  </span>
                )}
                {lesson.underConstruction && <ConstructionBadge />}
                <span className="hidden shrink-0 font-mono text-xs text-mute sm:block">
                  {lesson.readingMinutes} 分钟
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
