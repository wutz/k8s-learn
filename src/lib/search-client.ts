/**
 * 全文搜索 — minisearch + CJK bigram 分词。
 * 索引文档从 /content/search-docs.json 懒加载，首次搜索时构建（~180 文档，毫秒级）。
 */
import MiniSearch from "minisearch";

export interface SearchDoc {
  id: string;
  moduleId: string;
  title: string;
  headings: string;
  text: string;
}

/** latin 按词、CJK 按 bigram（单字兜底） */
export function cjkTokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const raw of text.toLowerCase().split(/[\s\-—·,.，。:：;；!！?？()（）\[\]{}"'`|/\\]+/)) {
    if (!raw) continue;
    const cjkRuns = raw.match(/[一-鿿]+/g);
    const latin = raw.replace(/[一-鿿]/g, " ").trim();
    if (latin) tokens.push(latin);
    if (cjkRuns) {
      for (const run of cjkRuns) {
        if (run.length === 1) {
          tokens.push(run);
          continue;
        }
        for (let i = 0; i < run.length - 1; i++) {
          tokens.push(run.slice(i, i + 2));
        }
      }
    }
  }
  return tokens;
}

let indexPromise: Promise<MiniSearch<SearchDoc>> | null = null;

async function loadIndex(): Promise<MiniSearch<SearchDoc>> {
  const res = await fetch("/content/search-docs.json");
  const docs: SearchDoc[] = await res.json();
  const index = new MiniSearch<SearchDoc>({
    fields: ["title", "headings", "text"],
    storeFields: ["id", "title", "moduleId"],
    tokenize: cjkTokenize,
    searchOptions: {
      boost: { title: 5, headings: 2 },
      prefix: true,
      fuzzy: 0.1,
    },
  });
  index.addAll(docs);
  return index;
}

export async function searchLessons(query: string): Promise<SearchDoc[]> {
  const q = query.trim();
  if (!q) return [];
  indexPromise ??= loadIndex();
  const index = await indexPromise;
  return index.search(q).slice(0, 30) as unknown as SearchDoc[];
}
