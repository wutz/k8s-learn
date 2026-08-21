import { createFileRoute, Link } from "@tanstack/react-router";
import { manifest } from "../lib/content";
import { useProgress } from "../lib/progress-client";
import { ProgressBar } from "../components/ProgressBar";

export const Route = createFileRoute("/progress")({
  component: ProgressDashboard,
  head: () => ({
    meta: [{ title: "我的进度 · k8s-learn" }],
  }),
});

function ProgressDashboard() {
  const { ready, states, resumeLessonId } = useProgress();

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6" aria-busy>
        <div className="h-8 w-48 animate-pulse rounded bg-canvas-soft-2" />
      </div>
    );
  }

  const allLessons = manifest.modules.flatMap((m) => m.lessons);
  const active = allLessons.filter((l) => !l.underConstruction);
  const completed = active.filter((l) => states.get(l.id)?.status === "completed");
  const quizAttempts = [...states.entries()]
    .filter(([, s]) => s.attempts > 0)
    .map(([lessonId, s]) => ({ lessonId, bestScore: s.bestScore, attempts: s.attempts }));
  const avgScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((n, s) => n + (s.bestScore ?? 0), 0) / quizAttempts.length,
        )
      : null;

  const resume = resumeLessonId
    ? allLessons.find((l) => l.id === resumeLessonId)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">我的进度</h1>

      {/* 总览 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="已完成课程" value={`${completed.length} / ${active.length}`} />
        <Stat
          label="总体完成度"
          value={`${active.length ? Math.round((completed.length / active.length) * 100) : 0}%`}
        />
        <Stat
          label="测验平均分"
          value={avgScore != null ? `${avgScore} 分` : "—"}
          hint={`${quizAttempts.length} 课有测验记录`}
        />
      </div>

      {/* 继续学习 */}
      {resume && (
        <Link
          to="/lessons/$"
          params={{ _splat: resume.id }}
          className="group mt-6 flex items-center justify-between rounded-lg border border-k8s/40 bg-k8s-soft p-5"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-k8s-bright">
              继续学习
            </p>
            <p className="mt-1 font-medium group-hover:text-k8s-bright">{resume.title}</p>
          </div>
          <span className="text-k8s-bright">→</span>
        </Link>
      )}

      {/* 模块进度 */}
      <section className="mt-12">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">模块进度</h2>
        <div className="space-y-5">
          {manifest.modules.map((mod) => {
            const activeLessons = mod.lessons.filter((l) => !l.underConstruction);
            if (!activeLessons.length) return null;
            const done = activeLessons.filter((l) => states.get(l.id)?.status === "completed").length;
            return (
              <div key={mod.id}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <Link
                    to="/modules/$moduleId"
                    params={{ moduleId: mod.id }}
                    className="font-medium hover:text-k8s-bright"
                  >
                    {mod.title}
                  </Link>
                  <span className="font-mono text-xs text-mute">
                    {done}/{activeLessons.length}
                  </span>
                </div>
                <ProgressBar value={(done / activeLessons.length) * 100} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 测验成绩 */}
      {quizAttempts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">测验成绩</h2>
          <div className="overflow-hidden rounded-lg border border-hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-canvas-soft font-mono text-xs uppercase tracking-wider text-mute">
                  <th className="px-4 py-2.5 text-left">课程</th>
                  <th className="px-4 py-2.5 text-right">最高分</th>
                  <th className="px-4 py-2.5 text-right">尝试次数</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.map(({ lessonId, bestScore, attempts }) => {
                  const lesson = allLessons.find((l) => l.id === lessonId);
                  return (
                    <tr key={lessonId} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-2.5">
                        <Link
                          to="/lessons/$"
                          params={{ _splat: lessonId }}
                          className="hover:text-k8s-bright"
                        >
                          {lesson?.title ?? lessonId}
                        </Link>
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono ${
                          (bestScore ?? 0) >= 80 ? "text-success" : "text-warning"
                        }`}
                      >
                        {bestScore}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-mute">
                        {attempts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {completed.length === 0 && quizAttempts.length === 0 && (
        <p className="mt-10 rounded-lg border border-hairline bg-canvas-soft p-8 text-center text-body">
          还没有学习记录 — 从{" "}
          <Link to="/paths/$pathId" params={{ pathId: "foundation" }} className="text-link hover:underline">
            基础主线
          </Link>{" "}
          开始吧。
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-mute">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}
