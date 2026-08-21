# k8s-learn

交互式 Kubernetes 学习站 — 内容源自 [k8s-in-action](https://github.com/wutz/k8s-in-action) 实战手册，基于 TanStack Start 构建，部署于 Cloudflare Workers。

**在线访问**：<https://k8s-learn.wutz.workers.dev>

## 功能

- 📚 **181 篇课程**：全量导入 k8s-in-action 的 12 个模块，构建期解析 Markdown → Shiki 双主题高亮 HTML（明暗自适应）
- 🗺️ **8 条学习路径**：基础主线、Ceph / GPFS 存储实战、AI 平台、可观测性、数据库上 K8s 等
- ✅ **学习进度追踪**：课程完成标记、阅读位置记忆与恢复、续学指引（Cloudflare D1 持久化，匿名签名 cookie 身份）
- 📝 **22 组课后测验**：单选 / 多选 / 判断 / 命令排序 / 填空五种题型，服务端判分，答案不下发到浏览器
- 🔍 **全文搜索**：客户端 minisearch + 中文 bigram 分词，中英文均可检索
- 🌓 暗色 / 亮色主题切换（默认暗色）

## 开发

```bash
pnpm install
pnpm content:build   # 解析参考库生成课程内容（需本地存在 ../scclabs/k8s-in-action）
pnpm db:migrate:local
pnpm dev             # http://localhost:3000
```

> 注意：部署脚本用 `pnpm run deploy`（`pnpm deploy` 是 pnpm 内置命令）。

## 部署

```bash
pnpm run deploy              # build + wrangler deploy
pnpm db:migrate:remote       # schema 变更时
```

推送到 main 后 GitHub Actions 会自动构建部署（需配置 `CLOUDFLARE_API_TOKEN` secret）。

## 结构

```
scripts/          内容管线（参考库 Markdown → public/content/ 产物）
content-src/      手写内容：学习路径、模块元数据、测验题库
public/content/   生成的课程产物（已提交，部署不依赖参考库在场）
src/routes/       TanStack Router 文件路由
src/server/       服务端：D1 进度存储、身份 cookie、测验判分
migrations/       D1 schema 迁移
.github/workflows/deploy.yml   CI 自动部署
```

## 内容管线要点

- SKILL.md 与同级 README.md 按 sha256 去重
- 引用块内缩进代码栅栏自动归一化（cephadm 等文档的历史格式问题）
- 内部链接改写为课程路由；失效链接与图片回退到 GitHub
- `[施工中]` 标记的课程显示 badge 且不计入完成度
- 构建报告 `scripts/content-report.json` 作为验收门（有错误即退出非零）
