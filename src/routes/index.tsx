import { createFileRoute, Link } from "@tanstack/react-router";
import { manifest } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ProgressRing } from "../components/ProgressBar";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { states, resumeLessonId } = useProgress();

  const totalLessons = manifest.modules.reduce((n, m) => n + m.lessons.length, 0);
  const completed = [...states.values()].filter((s) => s.status === "completed").length;

  const resumeLesson = resumeLessonId
    ? manifest.modules.flatMap((m) => m.lessons).find((l) => l.id === resumeLessonId)
    : null;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 300px at 20% -10%, rgba(50,108,229,.35), transparent), radial-gradient(500px 260px at 80% 0%, rgba(0,223,216,.18), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <p className="mb-4 inline-block rounded-full bg-k8s-soft px-3 py-1 font-mono text-xs text-k8s-bright">
            基于 k8s-in-action 实战手册 · {totalLessons} 篇课程
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            在实战手册里
            <span className="text-k8s-bright">学会 Kubernetes</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-body">
            从集群规划到 AI 平台建设的完整学习路径：阅读课程、完成测验、追踪进度。
            内容来自生产环境的部署实践，而非纸上谈兵。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/paths/$pathId"
              params={{ pathId: "foundation" }}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-85"
            >
              开始基础主线
            </Link>
            <Link
              to="/modules"
              className="rounded-full border border-hairline-strong px-5 py-2.5 text-sm font-medium transition-colors hover:bg-canvas-soft-2"
            >
              浏览全部模块
            </Link>
            {completed > 0 && (
              <span className="ml-1 text-sm text-mute">
                已完成 {completed}/{totalLessons} 课
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 继续学习 */}
      {resumeLesson && (
        <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
          <Link
            to="/lessons/$"
            params={{ _splat: resumeLesson.id }}
            className="group flex items-center justify-between rounded-lg border border-hairline bg-canvas-soft p-5 transition-colors hover:border-k8s/50"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-mute">继续学习</p>
              <p className="mt-1.5 font-medium group-hover:text-k8s-bright">{resumeLesson.title}</p>
            </div>
            <span className="text-k8s-bright opacity-60 transition-opacity group-hover:opacity-100">→</span>
          </Link>
        </section>
      )}

      {/* 学习路径 */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">学习路径</h2>
          <Link to="/paths" className="text-sm text-link hover:underline">
            全部路径 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.paths.map((path) => {
            const done = path.lessonIds.filter(
              (id) => states.get(id)?.status === "completed",
            ).length;
            return (
              <PathCard key={path.id} pathId={path.id} done={done} />
            );
          })}
        </div>
      </section>

      {/* 模块速览 */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">课程模块</h2>
          <Link to="/modules" className="text-sm text-link hover:underline">
            全部模块 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.modules.slice(0, 9).map((mod) => (
            <Link
              key={mod.id}
              to="/modules/$moduleId"
              params={{ moduleId: mod.id }}
              className="rounded-md border border-hairline bg-canvas p-4 transition-colors hover:border-hairline-strong"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{mod.title}</p>
                <span className="font-mono text-xs text-mute">{mod.lessons.length} 课</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-body">{mod.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PathCard({ pathId, done }: { pathId: string; done: number }) {
  const path = manifest.paths.find((p) => p.id === pathId)!;
  const pct = (done / path.lessonIds.length) * 100;
  return (
    <Link
      to="/paths/$pathId"
      params={{ pathId }}
      className="flex items-start gap-4 rounded-lg border border-hairline bg-canvas p-5 transition-colors hover:border-k8s/50"
    >
      <ProgressRing value={pct} />
      <div className="min-w-0">
        <p className="font-medium">{path.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-body">{path.description}</p>
        <p className="mt-2 font-mono text-xs text-mute">
          {done}/{path.lessonIds.length} 已完成
        </p>
      </div>
    </Link>
  );
}
