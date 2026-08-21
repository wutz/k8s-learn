import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import appCss from "../styles/app.css?url";
import { Layout } from "../components/Layout";
import { ProgressProvider } from "../lib/progress-client";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { lang: "zh-CN" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
    scripts: [
      // 主题预设：默认暗色，亮色用户提前设置避免闪烁
      {
        children: `try{if(localStorage.getItem('k8l-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-mute">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">页面不存在</h1>
      <p className="text-body">课程可能已改名，去目录里找找。</p>
      <div className="mt-2 flex gap-3">
        <a
          href="/"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary hover:opacity-85"
        >
          回首页
        </a>
        <a
          href="/modules"
          className="rounded-full border border-hairline-strong px-5 py-2 text-sm font-medium hover:bg-canvas-soft-2"
        >
          浏览模块
        </a>
      </div>
    </div>
  );
}

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1 } },
      }),
  );

  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ProgressProvider>
            <Layout>
              <Outlet />
            </Layout>
          </ProgressProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
