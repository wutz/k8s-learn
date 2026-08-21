import path from "node:path";
import type { ModuleId } from "../content-src/types";

/** 参考库位置（只读，绝不修改） */
export const REF_REPO = path.resolve(
  process.env.REF_REPO ?? "/Users/wutz/Projects/scclabs/k8s-in-action",
);

/** 产物输出目录 */
export const OUT_ROOT = path.resolve(import.meta.dirname, "..");
export const PUBLIC_CONTENT = path.join(OUT_ROOT, "public", "content");
export const GENERATED = path.join(OUT_ROOT, "src", "content", "generated");

/** GitHub 源码链接（非 md 文件与未收录文档的跳转目标） */
export const GITHUB_BASE = "https://github.com/wutz/k8s-in-action";

/** 排除的 vendored / 缓存目录（相对参考库根） */
export const EXCLUDES: RegExp[] = [
  /^ai\/kubeflow\/community-distribution\//,
  /^o11y\/logs\/loki\/charts\//,
  /^ai\/llm\/vllm-sts\//,
  /(^|\/)\.helmwave\//,
  /^k8s\/kubespray\/kubespray-2\.3\d*\/inventory\//,
  /(^|\/)\./, // 隐藏目录（.arch、.images 等）
];

/** 模块顺序（主学习线在前，附加模块在后） */
export const MODULE_ORDER: ModuleId[] = [
  "k8s",
  "base",
  "network",
  "storage",
  "ai",
  "repo",
  "o11y",
  "compute",
  "db",
  "addons",
  "os",
  "security",
];
