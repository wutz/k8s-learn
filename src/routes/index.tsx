import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6">
      <p className="font-mono text-xs tracking-widest text-mute uppercase">
        k8s-learn · scaffold check
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">
        TanStack Start + Cloudflare Workers
      </h1>
      <p className="text-body">
        骨架已就绪。内容管线与课程页面将在后续阶段接入。
      </p>
    </main>
  );
}
