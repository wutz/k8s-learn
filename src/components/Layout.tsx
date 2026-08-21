import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { K8sLogo } from "./K8sLogo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/", label: "首页" },
  { to: "/paths", label: "学习路径" },
  { to: "/modules", label: "课程模块" },
  { to: "/progress", label: "我的进度" },
] as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <K8sLogo className="h-6 w-6 text-k8s-bright" />
            <span>
              k8s<span className="text-k8s-bright">-learn</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-k8s-soft text-k8s-bright"
                      : "text-body hover:bg-canvas-soft-2 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/search"
              className="ml-2 rounded-sm border border-hairline px-3 py-1.5 text-sm text-body transition-colors hover:border-hairline-strong hover:text-ink"
            >
              <span className="mr-1.5" aria-hidden>
                ⌕
              </span>
              搜索
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-mute md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            k8s-learn · 内容源自{" "}
            <a
              href="https://github.com/wutz/k8s-in-action"
              target="_blank"
              rel="noreferrer"
              className="text-link hover:underline"
            >
              k8s-in-action
            </a>{" "}
            实战手册
          </p>
          <p className="font-mono text-xs">TanStack Start × Cloudflare Workers</p>
        </div>
      </footer>
    </div>
  );
}
