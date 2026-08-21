import { createFileRoute, Link } from "@tanstack/react-router";
import { manifest } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ProgressBar } from "../components/ProgressBar";

export const Route = createFileRoute("/modules/")({
  component: ModulesIndex,
  head: () => ({
    meta: [{ title: "课程模块 · k8s-learn" }],
  }),
});

function ModulesIndex() {
  const { isCompleted } = useProgress();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">课程模块</h1>
      <p className="mt-2 text-body">
        参考库的 12 个模块，从集群部署到 AI 平台的全栈实践。
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {manifest.modules.map((mod) => {
          const active = mod.lessons.filter((l) => !l.underConstruction);
          const done = active.filter((l) => isCompleted(l.id)).length;
          return (
            <Link
              key={mod.id}
              to="/modules/$moduleId"
              params={{ moduleId: mod.id }}
              className="flex flex-col rounded-lg border border-hairline bg-canvas p-5 transition-colors hover:border-k8s/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-medium">{mod.title}</p>
                <span className="font-mono text-xs text-mute">{mod.lessons.length} 课</span>
              </div>
              <p className="mt-1.5 line-clamp-2 flex-none text-sm text-body">
                {mod.description}
              </p>
              <div className="mt-auto pt-4">
                <ProgressBar value={active.length ? (done / active.length) * 100 : 0} />
                <p className="mt-2 font-mono text-xs text-mute">
                  {done}/{active.length} 已完成
                  {active.length < mod.lessons.length &&
                    ` · ${mod.lessons.length - active.length} 课施工中`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
