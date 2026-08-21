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
});

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
