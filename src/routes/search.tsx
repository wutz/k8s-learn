import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { searchLessons, type SearchDoc } from "../lib/search-client";
import { manifest } from "../lib/content";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [{ title: "搜索 · k8s-learn" }],
  }),
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      void searchLessons(q).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">搜索课程</h1>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索标题、章节或正文，如 ingress / 存储 / kueue…"
        autoFocus
        className="mt-6 h-12 w-full rounded-sm border border-hairline bg-canvas px-4 text-base outline-none transition-colors placeholder:text-mute focus:border-k8s"
      />

      {loading && results === null && (
        <p className="mt-8 text-sm text-mute" aria-busy>
          正在加载搜索索引…
        </p>
      )}

      {results !== null && (
        <>
          <p className="mt-6 font-mono text-xs text-mute">
            {results.length ? `${results.length} 条结果` : "无结果"}
          </p>
          <ul className="mt-4 divide-y divide-hairline">
            {results.map((doc) => {
              const mod = manifest.modules.find((m) => m.id === doc.moduleId);
              return (
                <li key={doc.id}>
                  <Link
                    to="/lessons/$"
                    params={{ _splat: doc.id }}
                    className="group block py-3.5"
                  >
                    <p className="font-medium group-hover:text-k8s-bright">{doc.title}</p>
                    <p className="mt-0.5 font-mono text-xs text-mute">
                      {mod?.title} · {doc.id}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
