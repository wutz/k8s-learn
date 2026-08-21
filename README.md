# k8s-learn

交互式 Kubernetes 学习站 — 内容源自 [k8s-in-action](https://github.com/wutz/k8s-in-action) 实战手册，基于 TanStack Start 构建，部署于 Cloudflare Workers。

## 功能

- 📚 全量导入 k8s-in-action 的 9 大模块课程（构建期解析 Markdown → 高亮 HTML）
- 🗺️ 学习路径：基础主线 → 存储 / AI / 观测 / 数据库等专题路径
- ✅ 学习进度追踪（Cloudflare D1 持久化，匿名身份）
- 📝 每课测验（服务端判分）
- 🔍 全文搜索（中文 bigram 分词）

## 开发

```bash
pnpm install
pnpm content:build   # 解析参考库生成课程内容（需本地存在 ../scclabs/k8s-in-action）
pnpm db:migrate:local
pnpm dev             # http://localhost:3000
```

## 部署

```bash
pnpm run deploy              # build + wrangler deploy
pnpm db:migrate:remote       # schema 变更时
```

预览地址：<https://k8s-learn.wutz.workers.dev>

## 结构

```
scripts/          内容管线（参考库 Markdown → public/content/ 产物）
content-src/      手写内容：学习路径、模块元数据、测验题库
public/content/   生成的课程产物（已提交，部署不依赖参考库）
src/routes/       TanStack Router 文件路由
src/server/       服务端：D1 进度存储、身份 cookie、判分
migrations/       D1 schema 迁移
```
