import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getLesson, getPath } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ConstructionBadge } from "../components/ConstructionBadge";

export const Route = createFileRoute("/paths/$pathId")({
  component: PathDetail,
});

function PathDetail() {
  const { pathId } = Route.useParams();
  const path = getPath(pathId);
  if (!path) throw notFound();

  const { isCompleted } = useProgress();
  const active = path.lessonIds.filter((id) => {
    const lesson = getLesson(id);
    return lesson && !lesson.underConstruction && isCompleted(id);
  });
  const total = path.lessonIds.length;
  const pct = total ? (active.length / total) * 100 : 0;

  let lastDone = true;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Link to="/paths" className="font-mono text-xs text-mute hover:text-link">
        ← 全部路径
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{path.title}</h1>
      <p className="mt-2 max-w-2xl text-body">{path.description}</p>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-soft-2">
          <div
            className="h-full rounded-full bg-k8s transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-sm text-body">
          {active.length}/{total}
        </span>
      </div>

      <ol className="mt-10 space-y-1">
        {path.lessonIds.map((lessonId, i) => {
          const lesson = getLesson(lessonId);
          if (!lesson) return null;
          const done = !lesson.underConstruction && isCompleted(lessonId);
          const locked = false; // 不强制顺序，仅展示推荐序列
          void locked;
          const wasLastDone = lastDone;
          lastDone = done;
          return (
            <li key={lessonId}>
              <Link
                to="/lessons/$"
                params={{ _splat: lessonId }}
                className={`group flex items-center gap-4 rounded-md border px-4 py-3 transition-colors ${
                  done
                    ? "border-transparent bg-k8s-soft"
                    : "border-hairline bg-canvas hover:border-k8s/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    done
                      ? "bg-k8s text-white"
                      : "border border-hairline-strong text-mute group-hover:border-k8s group-hover:text-k8s-bright"
                  }`}
                  aria-label={done ? "已完成" : `第 ${i + 1} 课`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium group-hover:text-k8s-bright">
                    {lesson.title}
                  </span>
                  <span className="block truncate font-mono text-xs text-mute">
                    {lesson.sourcePath}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-mute">
                  {lesson.readingMinutes} 分钟
                </span>
                {lesson.underConstruction && <ConstructionBadge />}
                {!done && wasLastDone && (
                  <span className="hidden shrink-0 rounded-full bg-k8s px-2 py-0.5 text-xs text-white sm:block">
                    建议下一课
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
