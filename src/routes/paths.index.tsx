import { createFileRoute, Link } from "@tanstack/react-router";
import { manifest } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ProgressRing } from "../components/ProgressBar";

export const Route = createFileRoute("/paths/")({
  component: PathsIndex,
});

function PathsIndex() {
  const { states } = useProgress();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">学习路径</h1>
      <p className="mt-2 text-body">按主题组织的有序课程序列，跨模块串联实战知识。</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {manifest.paths.map((path) => {
          const done = path.lessonIds.filter(
            (id) => states.get(id)?.status === "completed",
          ).length;
          return (
            <Link
              key={path.id}
              to="/paths/$pathId"
              params={{ pathId: path.id }}
              className="flex items-start gap-5 rounded-lg border border-hairline bg-canvas p-6 transition-colors hover:border-k8s/50"
            >
              <ProgressRing value={(done / path.lessonIds.length) * 100} size={56} />
              <div>
                <p className="text-lg font-medium">{path.title}</p>
                <p className="mt-1.5 text-sm text-body">{path.description}</p>
                <p className="mt-3 font-mono text-xs text-mute">
                  {path.lessonIds.length} 课 · 已完成 {done}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
