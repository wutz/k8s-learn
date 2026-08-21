/**
 * Markdown 源文本归一化 — 在解析前修复参考库中的已知格式问题。
 */

/**
 * 修复「缩进/引用上下文中的代码栅栏」：
 * storage/cephadm 等文档存在被空格缩进或 `>` 引用前缀包裹的代码栅栏，
 * 直接解析会渲染成嵌套代码块。这里把栅栏行统一还原到列 0，
 * 并剥掉栅栏内部行上同样的缩进/引用前缀（保留相对缩进）。
 */
export function normalizeFences(src: string): { text: string; fixes: number } {
  const lines = src.split("\n");
  const out: string[] = [];
  let fixes = 0;

  // 栅栏状态
  let inFence = false;
  let fenceMarker = "```";
  let stripPrefix = ""; // 打开栅栏时的前缀（缩进 + 引用符），内部行需剥掉

  const FENCE_RE = /^(\s*)((?:>\s?)*)(`{3,}|~{3,})(.*)$/;

  for (const line of lines) {
    const m = line.match(FENCE_RE);

    if (!inFence && m) {
      const [, indent, quote, marker, info] = m;
      inFence = true;
      fenceMarker = marker[0].repeat(3);
      stripPrefix = indent + quote;
      fixes++;
      out.push(marker + info);
      continue;
    }

    if (inFence) {
      // 关闭栅栏：剥前缀后以同标记开头（允许更长）
      const stripped = stripFencePrefix(line, stripPrefix);
      const closeMatch = stripped.match(/^(`{3,}|~{3,})\s*$/);
      if (closeMatch && closeMatch[1][0] === fenceMarker[0]) {
        inFence = false;
        out.push(closeMatch[1]);
        continue;
      }
      out.push(stripped);
      continue;
    }

    out.push(line);
  }

  return { text: out.join("\n"), fixes };
}

function stripFencePrefix(line: string, prefix: string): string {
  if (prefix === "") return line;
  if (line.startsWith(prefix)) return line.slice(prefix.length);
  // 宽松匹配：逐字符消费空格与 '>'
  let rest = line;
  let consumed = 0;
  for (const ch of prefix) {
    if (ch === " " || ch === "\t") {
      while (rest[consumed] === " " || rest[consumed] === "\t") consumed++;
    } else if (ch === ">") {
      if (rest[consumed] === ">") consumed++;
      if (rest[consumed] === " ") consumed++;
    } else {
      break;
    }
  }
  return rest.slice(consumed);
}

/** 提取纯文本（去代码栅栏、去 HTML 标签、压空白）— 供搜索索引与字数统计 */
export function extractPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 阅读时长（分钟）：中文按字、英文按词估算 */
export function readingMinutes(plainText: string): number {
  const cjkChars = (plainText.match(/[一-鿿]/g) ?? []).length;
  const latinWords = (plainText.match(/[a-zA-Z]+/g) ?? []).length;
  return Math.max(1, Math.round(cjkChars / 350 + latinWords / 200));
}
