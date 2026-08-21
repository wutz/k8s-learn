/**
 * 课程正文渲染：拉取静态 HTML → 注入 → 增强代码复制按钮与 mermaid。
 */
import { useEffect, useRef, useState } from "react";
import { lessonBodyUrl } from "../lib/content";

export function LessonBody({
  lesson,
  onReady,
}: {
  lesson: { id: string; contentHash: string };
  onReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(lessonBodyUrl(lesson))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(async (html) => {
        if (!alive) return;
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = html;
        enhanceCodeBlocks(el);
        await renderMermaid(el);
        if (alive) {
          setState("ready");
          onReady?.();
        }
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [lesson.id, lesson.contentHash]);

  return (
    <div className="relative">
      {state === "loading" && (
        <div className="space-y-3 py-8" aria-busy>
          {[92, 100, 78, 96, 64].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-canvas-soft-2"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}
      {state === "error" && (
        <p className="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error">
          课程内容加载失败，请刷新重试。
        </p>
      )}
      <div
        ref={containerRef}
        className={`lesson-prose prose prose-neutral dark:prose-invert max-w-none transition-opacity ${
          state === "ready" ? "opacity-100" : "h-0 overflow-hidden opacity-0"
        }`}
      />
    </div>
  );
}

/** 代码块：加复制按钮 */
function enhanceCodeBlocks(root: HTMLElement) {
  for (const pre of Array.from(root.querySelectorAll("pre"))) {
    if (pre.querySelector(".code-copy")) continue;
    const btn = document.createElement("button");
    btn.className = "code-copy";
    btn.textContent = "复制";
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code")?.textContent ?? "";
      void navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "已复制";
        setTimeout(() => (btn.textContent = "复制"), 1500);
      });
    });
    pre.appendChild(btn);
  }
}

let mermaidModule: Promise<typeof import("mermaid").default> | null = null;

async function renderMermaid(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll(".mermaid-block"));
  if (!blocks.length) return;

  mermaidModule ??= import("mermaid").then((m) => {
    m.default.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: document.documentElement.classList.contains("light") ? "neutral" : "dark",
      fontFamily: "inherit",
    });
    return m.default;
  });
  const mermaid = await mermaidModule;

  let i = 0;
  for (const block of blocks) {
    const src = block.querySelector(".mermaid-src")?.textContent ?? "";
    if (!src.trim()) continue;
    try {
      const { svg } = await mermaid.render(`k8l-mmd-${Date.now()}-${i++}`, src);
      block.innerHTML = svg;
    } catch {
      // 渲染失败保留源码
      block.classList.add("text-body", "font-mono", "text-xs", "whitespace-pre-wrap");
    }
  }
}
