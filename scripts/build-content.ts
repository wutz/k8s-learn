/**
 * 内容管线：解析参考库 Markdown → 生成课程产物。
 *
 * 产物（全部提交进 git，部署不依赖参考库）：
 *   public/content/lessons/<module>/<slug>.html   课程正文（构建期 Shiki 高亮）
 *   public/content/images/<hash>-<name>           被引用的图片
 *   src/content/generated/manifest.json           课程清单（打包导入）
 *   src/content/generated/quizzes.client.json     测验题面（无答案）
 *   src/content/generated/quiz-answers.json       测验答案（仅服务端引用）
 *   scripts/content-report.json                   构建报告（验收门）
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { visit } from "unist-util-visit";
import type { Root, RootContent } from "mdast";
import type { Element, Root as HastRoot } from "hast";

import {
  REF_REPO,
  PUBLIC_CONTENT,
  GENERATED,
  GITHUB_BASE,
  EXCLUDES,
  MODULE_ORDER,
} from "./content.config.js";
import { MODULES_META } from "../content-src/modules.meta.js";
import { LEARNING_PATHS } from "../content-src/paths.js";
import { QUIZZES } from "../content-src/quizzes/index.js";
import type {
  ContentManifest,
  LearningPath,
  LessonMeta,
  ModuleId,
  Quiz,
  TocSection,
} from "../content-src/types.js";
import { normalizeFences, extractPlainText, readingMinutes } from "./normalize.js";

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

interface LessonRecord {
  id: string;
  moduleId: ModuleId;
  /** 参考库内相对路径（posix） */
  sourcePath: string;
  absPath: string;
  title: string;
  description?: string;
  underConstruction: boolean;
  hasMermaid: boolean;
  readingMinutes: number;
  sections: TocSection[];
  contentHash: string;
}

interface Report {
  generatedAt: string;
  refRepo: string;
  discoveredFiles: number;
  lessons: number;
  skillDuplicatesSkipped: number;
  imagesCopied: number;
  fenceFixes: number;
  quizzes: number;
  paths: number;
  warnings: string[];
  errors: string[];
}

const report: Report = {
  generatedAt: new Date().toISOString(),
  refRepo: REF_REPO,
  discoveredFiles: 0,
  lessons: 0,
  skillDuplicatesSkipped: 0,
  imagesCopied: 0,
  fenceFixes: 0,
  quizzes: 0,
  paths: 0,
  warnings: [],
  errors: [],
};

function warn(msg: string) {
  report.warnings.push(msg);
}
function error(msg: string) {
  report.errors.push(msg);
}

/* ------------------------------------------------------------------ */
/* 1. 发现与分类                                                        */
/* ------------------------------------------------------------------ */

function walkMd(dir: string, base = ""): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (EXCLUDES.some((re) => re.test(rel))) continue;
    if (entry.isDirectory()) {
      results.push(...walkMd(path.join(dir, entry.name), rel));
    } else if (/\.(md|markdown)$/i.test(entry.name)) {
      results.push(rel);
    }
  }
  return results;
}

function sha256(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function discover(): Promise<{
  lessons: LessonRecord[];
  bySourcePath: Map<string, LessonRecord>;
  byDir: Map<string, LessonRecord>;
}> {
  const files = walkMd(REF_REPO);
  report.discoveredFiles = files.length;

  interface Raw {
    sourcePath: string;
    absPath: string;
    kind: "readme" | "standalone" | "skill";
  }
  const raws: Raw[] = [];

  for (const rel of files) {
    if (rel === "README.md") continue; // 参考库根索引，学习路径已手工策展
    const kind = /(^|\/)readme\.md$/i.test(rel)
      ? "readme"
      : /(^|\/)skill\.md$/i.test(rel)
        ? "skill"
        : "standalone";
    raws.push({ sourcePath: rel, absPath: path.join(REF_REPO, rel), kind });
  }

  // SKILL.md 与同级 README.md 去重（按内容 hash）
  const readmeByDir = new Map<string, Raw>();
  for (const r of raws) {
    if (r.kind === "readme") {
      readmeByDir.set(path.posix.dirname(r.sourcePath), r);
    }
  }

  const kept: Raw[] = [];
  for (const r of raws) {
    if (r.kind === "skill") {
      const sibling = readmeByDir.get(path.posix.dirname(r.sourcePath));
      if (sibling && sha256(fs.readFileSync(r.absPath)) === sha256(fs.readFileSync(sibling.absPath))) {
        report.skillDuplicatesSkipped++;
        continue;
      }
      warn(`SKILL.md 未与同级 README 去重，按独立课程收录: ${r.sourcePath}`);
    }
    kept.push(r);
  }

  // 生成 id：去扩展名；README 折叠为目录名；无同级 README 的 SKILL.md 直接用目录名
  const records: LessonRecord[] = kept.map((r) => {
    let noExt = r.sourcePath.replace(/\.(md|markdown)$/i, "");
    if (/(^|\/)readme$/i.test(noExt)) noExt = noExt.replace(/(^|\/)readme$/i, "");
    else if (
      /(^|\/)skill$/i.test(noExt) &&
      !readmeByDir.has(path.posix.dirname(r.sourcePath))
    ) {
      noExt = noExt.replace(/(^|\/)skill$/i, "");
    }
    const moduleId = noExt.split("/")[0] as ModuleId;
    return {
      id: noExt,
      moduleId,
      sourcePath: r.sourcePath,
      absPath: r.absPath,
      title: "",
      underConstruction: false,
      hasMermaid: false,
      readingMinutes: 1,
      sections: [],
      contentHash: "",
    };
  });

  // 排序键：目录内 README 优先，其余按路径字母序
  const sortKey = (l: LessonRecord) => {
    const dir = path.posix.dirname(l.sourcePath);
    const base = path.posix.basename(l.sourcePath);
    const dirKey = /(^\.|^$)/.test(dir) ? "" : dir;
    return `${dirKey}/` + (/^readme\.md$/i.test(base) ? "" : base);
  };
  records.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const bySourcePath = new Map(records.map((r) => [r.sourcePath, r]));
  const byDir = new Map<string, LessonRecord>();
  for (const r of records) {
    if (/(^|\/)readme\.md$/i.test(r.sourcePath)) {
      byDir.set(path.posix.dirname(r.sourcePath), r);
    }
  }

  return { lessons: records, bySourcePath, byDir };
}

/* ------------------------------------------------------------------ */
/* 2. 解析与渲染                                                        */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 从 markdown 提取首个 H1 标题（跳过栅栏内内容） */
function firstH1(md: string): string | null {
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^#\s+(.+)/.test(line)) {
      return line.replace(/^#\s+/, "").trim();
    }
  }
  return null;
}

function prettifyFallback(id: string): string {
  const last = id.split("/").pop() ?? id;
  return last.replace(/[-_]/g, " ");
}

/** 清理标题中的 markdown 语法：[text](url)→text、去粗体/代码记号 */
function cleanTitle(t: string): string {
  return t
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface RenderCtx {
  fileDir: string; // posix 相对路径
  bySourcePath: Map<string, LessonRecord>;
  byDir: Map<string, LessonRecord>;
  sections: TocSection[];
  hasMermaid: boolean;
}

/** 链接改写：内部 md/目录链接 → 课程路由；其余文件 → GitHub blob */
function remarkRewriteLinks(ctx: RenderCtx) {
  return () => {
    return (tree: Root) => {
      /* mdast 树 */
      visit(tree, "link", (node) => {
        const url: string = node.url;
        if (/^(https?:|mailto:|#|\/\/)/.test(url)) return;

        const [rawPath, anchor = ""] = url.split("#");
        if (!rawPath) return; // 纯锚点

        const joined = path.posix.normalize(
          path.posix.join(ctx.fileDir === "." ? "" : ctx.fileDir, decodeURIComponent(rawPath)),
        );
        const anchorSuffix = anchor ? `#${anchor}` : "";

        // 目录链接
        const dirLesson =
          ctx.byDir.get(joined.replace(/\/$/, "")) ?? ctx.byDir.get(joined);
        if (dirLesson) {
          node.url = `/lessons/${dirLesson.id}${anchorSuffix}`;
          return;
        }

        // markdown 文件链接
        if (/\.(md|markdown)$/i.test(joined)) {
          const target = ctx.bySourcePath.get(joined);
          if (target) {
            node.url = `/lessons/${target.id}${anchorSuffix}`;
            return;
          }
          warn(`链接指向未收录文档，改指 GitHub: ${joined}（来自 ${ctx.fileDir}）`);
          node.url = `${GITHUB_BASE}/blob/main/${joined}${anchorSuffix}`;
          return;
        }

        // 其它文件（yaml/sh/…）→ GitHub
        node.url = `${GITHUB_BASE}/blob/main/${joined}`;
      });

      visit(tree, "image", (node) => {
        const url: string = node.url;
        if (/^(https?:|data:|\/\/)/.test(url)) return;
        const joined = path.posix.normalize(
          path.posix.join(ctx.fileDir === "." ? "" : ctx.fileDir, decodeURIComponent(url)),
        );
        const abs = path.join(REF_REPO, joined);
        if (!fs.existsSync(abs)) {
          warn(`图片不存在: ${joined}（来自 ${ctx.fileDir}）`);
          return;
        }
        const hash8 = sha256(joined).slice(0, 8);
        const base = path.posix.basename(joined);
        const outName = `${hash8}-${base}`;
        const outAbs = path.join(PUBLIC_CONTENT, "images", outName);
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.copyFileSync(abs, outAbs);
        report.imagesCopied++;
        node.url = `/content/images/${outName}`;
      });

      // mermaid 代码块 → 原始 HTML 占位（客户端懒渲染）
      visit(tree, "code", (node, index, parent) => {
        if ((node as { lang?: string }).lang !== "mermaid") return;
        ctx.hasMermaid = true;
        const html: RootContent = {
          type: "html",
          value: `<div class="mermaid-block"><pre class="mermaid-src">${escapeHtml(
            String((node as { value?: string }).value ?? ""),
          )}</pre></div>`,
        };
        if (parent && index != null) parent.children[index] = html;
      });
    };
  };
}

/** 收集 h2/h3 到 TOC（在 rehype-slug 之后运行） */
function rehypeCollectToc(sections: TocSection[]) {
  return () => {
    return (tree: HastRoot) => {
      visit(tree, "element", (node: Element) => {
        const tag = node.tagName;
        if (tag !== "h2" && tag !== "h3") return;
        const id = node.properties?.id;
        if (typeof id !== "string") return;
        sections.push({
          id,
          title: elementText(node),
          level: tag === "h2" ? 2 : 3,
        });
      });
    };
  };
}

function elementText(node: Element): string {
  let out = "";
  visit(node, "text", (n: { value: string }) => {
    out += n.value;
  });
  return out.trim();
}

/** 原始 HTML 中的 <img src> 改写 */
function rehypeFixRawImages(ctx: RenderCtx) {
  return () => {
    return (tree: HastRoot) => {
      visit(tree, "element", (node: Element) => {
        if (node.tagName !== "img") return;
        const src = node.properties?.src;
        if (typeof src !== "string" || /^(https?:|data:|\/\/|\/)/.test(src)) return;
        const joined = path.posix.normalize(
          path.posix.join(ctx.fileDir === "." ? "" : ctx.fileDir, decodeURIComponent(src)),
        );
        const abs = path.join(REF_REPO, joined);
        if (!fs.existsSync(abs)) {
          warn(`HTML 图片不存在: ${joined}`);
          return;
        }
        const hash8 = sha256(joined).slice(0, 8);
        const outName = `${hash8}-${path.posix.basename(joined)}`;
        const outAbs = path.join(PUBLIC_CONTENT, "images", outName);
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.copyFileSync(abs, outAbs);
        report.imagesCopied++;
        node.properties.src = `/content/images/${outName}`;
      });
    };
  };
}

async function renderLesson(rec: LessonRecord, maps: {
  bySourcePath: Map<string, LessonRecord>;
  byDir: Map<string, LessonRecord>;
}): Promise<{ html: string; searchText: string }> {
  const raw = fs.readFileSync(rec.absPath, "utf8");
  rec.contentHash = sha256(raw).slice(0, 8);

  const { text: normalized, fixes } = normalizeFences(raw);
  report.fenceFixes += fixes;

  const parsed = matter(normalized);
  const fm = parsed.data as Record<string, unknown>;

  const h1 = firstH1(parsed.content);
  rec.title = cleanTitle(
    (typeof fm.name === "string" && fm.name.trim()) ||
      (typeof fm.title === "string" && fm.title.trim()) ||
      h1 ||
      prettifyFallback(rec.id),
  );
  rec.description = typeof fm.description === "string" ? fm.description : undefined;

  const head = parsed.content.slice(0, 600);
  rec.underConstruction = /施工中/.test(`${rec.title}\n${head}`);

  const plain = extractPlainText(parsed.content);
  rec.readingMinutes = readingMinutes(plain);

  const ctx: RenderCtx = {
    fileDir: path.posix.dirname(rec.sourcePath),
    bySourcePath: maps.bySourcePath,
    byDir: maps.byDir,
    sections: rec.sections,
    hasMermaid: false,
  };

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRewriteLinks(ctx))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { class: "heading-anchor", ariaHidden: true, tabIndex: -1 },
      content: { type: "text", value: "#" },
    } as never)
    .use(rehypeCollectToc(rec.sections))
    .use(rehypeFixRawImages(ctx))
    .use(
      rehypeShiki as never,
      {
        themes: { light: "github-light", dark: "one-dark-pro" },
        defaultColor: false,
      } as never,
    )
    .use(rehypeStringify, { allowDangerousHtml: true });

  const html = String(await processor.process(parsed.content));
  rec.hasMermaid = ctx.hasMermaid;

  return { html, searchText: plain.slice(0, 3000) };
}

/* ------------------------------------------------------------------ */
/* 3. 主流程                                                            */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(`▶ 参考库: ${REF_REPO}`);
  if (!fs.existsSync(REF_REPO)) {
    console.error(`✗ 参考库不存在`);
    process.exit(1);
  }

  // 清空旧产物
  fs.rmSync(path.join(PUBLIC_CONTENT, "lessons"), { recursive: true, force: true });
  fs.rmSync(path.join(PUBLIC_CONTENT, "images"), { recursive: true, force: true });
  fs.rmSync(GENERATED, { recursive: true, force: true });
  fs.mkdirSync(GENERATED, { recursive: true });

  const { lessons, bySourcePath, byDir } = await discover();
  console.log(`▶ 发现 ${report.discoveredFiles} 个 md，收录 ${lessons.length} 课（跳过 ${report.skillDuplicatesSkipped} 个重复 SKILL.md）`);

  const searchDocs: { id: string; moduleId: string; title: string; headings: string; text: string }[] = [];

  for (const rec of lessons) {
    try {
      const { html, searchText } = await renderLesson(rec, { bySourcePath, byDir });
      const outAbs = path.join(PUBLIC_CONTENT, "lessons", `${rec.id}.html`);
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      fs.writeFileSync(outAbs, html);
      searchDocs.push({
        id: rec.id,
        moduleId: rec.moduleId,
        title: rec.title,
        headings: rec.sections.map((s) => s.title).join(" "),
        text: searchText,
      });
    } catch (e) {
      error(`渲染失败 ${rec.sourcePath}: ${(e as Error).message}`);
    }
  }
  console.log(`▶ 渲染完成：${lessons.length - report.errors.length} 成功，复制图片 ${report.imagesCopied} 张`);

  /* ---- 测验 ---- */
  const validQuizzes: Quiz[] = [];
  const seenQuizIds = new Set<string>();
  for (const quiz of QUIZZES) {
    if (seenQuizIds.has(quiz.id)) {
      error(`测验 id 重复: ${quiz.id}`);
      continue;
    }
    seenQuizIds.add(quiz.id);
    if (!bySourcePath.size || !lessonExists(lessons, quiz.lessonId)) {
      error(`测验 ${quiz.id} 指向不存在的课程: ${quiz.lessonId}`);
      continue;
    }
    validQuizzes.push(quiz);
  }
  report.quizzes = validQuizzes.length;

  // 客户端题面（剥离答案字段）
  const clientQuizzes = validQuizzes.map((q) => ({
    id: q.id,
    lessonId: q.lessonId,
    title: q.title,
    questions: q.questions.map(stripAnswer),
  }));
  fs.writeFileSync(
    path.join(GENERATED, "quizzes.client.json"),
    JSON.stringify(clientQuizzes, null, 2),
  );

  // 服务端答案（仅 src/server 引用）
  const answers: Record<string, unknown[]> = {};
  for (const q of validQuizzes) {
    answers[q.id] = q.questions.map((question) => {
      switch (question.type) {
        case "single":
          return { answer: question.answer };
        case "multiple":
          return { answers: [...question.answers].sort() };
        case "truefalse":
          return { answer: question.answer };
        case "order":
          return { items: question.items };
        case "fill":
          return { accepts: question.accepts, caseSensitive: question.caseSensitive ?? false };
      }
    });
  }
  fs.writeFileSync(path.join(GENERATED, "quiz-answers.json"), JSON.stringify(answers, null, 2));

  // 断言：客户端产物不含答案字段
  const clientStr = JSON.stringify(clientQuizzes);
  for (const field of ['"answer"', '"answers"', '"accepts"', '"items"']) {
    if (clientStr.includes(field)) {
      error(`quizzes.client.json 泄漏答案字段 ${field}`);
    }
  }

  /* ---- 学习路径 ---- */
  const validPaths: LearningPath[] = [];
  for (const p of LEARNING_PATHS) {
    const bad = p.lessonIds.filter((id) => !lessonExists(lessons, id));
    if (bad.length) {
      error(`路径 ${p.id} 含未知课程: ${bad.join(", ")}`);
    }
    validPaths.push(p);
  }
  report.paths = validPaths.length;

  /* ---- manifest ---- */
  const moduleLessons = new Map<ModuleId, LessonMeta[]>();
  for (const rec of lessons) {
    const list = moduleLessons.get(rec.moduleId) ?? [];
    const quizIds = validQuizzes.filter((q) => q.lessonId === rec.id).map((q) => q.id);
    list.push({
      id: rec.id,
      moduleId: rec.moduleId,
      title: rec.title,
      description: rec.description,
      readingMinutes: rec.readingMinutes,
      underConstruction: rec.underConstruction,
      hasMermaid: rec.hasMermaid,
      sections: rec.sections,
      quizIds,
      prevId: null,
      nextId: null,
      sourcePath: rec.sourcePath,
      contentHash: rec.contentHash,
    });
    moduleLessons.set(rec.moduleId, list);
  }

  const modules = MODULE_ORDER.filter((m) => moduleLessons.has(m)).map((id, i) => {
    const list = moduleLessons.get(id)!;
    list.forEach((l, idx) => {
      l.prevId = idx > 0 ? list[idx - 1].id : null;
      l.nextId = idx < list.length - 1 ? list[idx + 1].id : null;
    });
    return {
      id,
      title: MODULES_META[id].title,
      description: MODULES_META[id].description,
      order: i,
      lessons: list,
    };
  });

  // 未归类模块检查
  for (const mid of moduleLessons.keys()) {
    if (!MODULE_ORDER.includes(mid)) {
      error(`模块 ${mid} 不在 MODULE_ORDER 中，其 ${moduleLessons.get(mid)!.length} 课未入 manifest`);
    }
  }

  const manifest: ContentManifest = {
    version: 1,
    generatedAt: report.generatedAt,
    modules,
    paths: validPaths,
    quizzes: validQuizzes.map((q) => ({
      id: q.id,
      lessonId: q.lessonId,
      title: q.title,
      questionCount: q.questions.length,
    })),
  };
  fs.writeFileSync(path.join(GENERATED, "manifest.json"), JSON.stringify(manifest, null, 2));

  /* ---- 搜索文档 ---- */
  fs.writeFileSync(
    path.join(GENERATED, "search-docs.json"),
    JSON.stringify(searchDocs, null, 2),
  );

  /* ---- 报告 ---- */
  fs.writeFileSync(path.join(import.meta.dirname, "content-report.json"), JSON.stringify(report, null, 2));

  console.log(`▶ 测验 ${validQuizzes.length} 组 · 路径 ${validPaths.length} 条 · 警告 ${report.warnings.length} · 错误 ${report.errors.length}`);
  if (report.errors.length) {
    console.error(`✗ 存在错误，详见 scripts/content-report.json`);
    process.exit(1);
  }
  console.log(`✓ 内容构建完成`);
}

function lessonExists(lessons: LessonRecord[], id: string): boolean {
  return lessons.some((l) => l.id === id);
}

function stripAnswer(q: Quiz["questions"][number]) {
  switch (q.type) {
    case "single":
      return { type: q.type, prompt: q.prompt, options: q.options };
    case "multiple":
      return { type: q.type, prompt: q.prompt, options: q.options };
    case "truefalse":
      return { type: q.type, prompt: q.prompt };
    case "order":
      return { type: q.type, prompt: q.prompt, items: shuffle(q.items, q.prompt) };
    case "fill":
      return { type: q.type, prompt: q.prompt };
  }
}

/** 确定性打乱（order 题）：以 prompt 为种子，保证多次构建产物稳定 */
function shuffle(items: string[], seedText: string): string[] {
  let seed = [...seedText].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
