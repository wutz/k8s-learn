import type { Quiz } from "../types";

export const servicesQuizzes: Quiz[] = [
  {
    id: "quiz-o11y-vm",
    lessonId: "o11y/vm",
    title: "VictoriaMetrics",
    questions: [
      {
        type: "single",
        prompt: "VictoriaMetrics 相对 Prometheus 的定位是？",
        options: [
          { id: "a", text: "兼容 PromQL 生态、面向长期存储与更高压缩比/更低资源占用的时序数据库" },
          { id: "b", text: "日志系统" },
          { id: "c", text: "链路追踪系统" },
          { id: "d", text: "K8s 发行版" },
        ],
        answer: "a",
        explanation:
          "VM 兼容 Prometheus 指标协议与 PromQL（含 vmagent/vminsert 等组件），主打高压缩长期存储，常作为 Prometheus 的远端存储或替代。",
      },
      {
        type: "truefalse",
        prompt: "vmagent 可以抓取（scrape）指标并远程写入 VictoriaMetrics。",
        answer: true,
        explanation: "vmagent 是采集代理，支持 prometheus 抓取配置与 remote write 协议。",
      },
    ],
  },
  {
    id: "quiz-repo-harbor",
    lessonId: "repo/harbor",
    title: "Harbor 镜像仓库",
    questions: [
      {
        type: "multiple",
        prompt: "相比单机 Docker Registry，Harbor 额外提供哪些企业能力？",
        options: [
          { id: "a", text: "Web 控制台与多项目管理" },
          { id: "b", text: "镜像漏洞扫描" },
          { id: "c", text: "内容信任/签名与复制规则" },
          { id: "d", text: "自动编译容器镜像" },
        ],
        answers: ["a", "b", "c"],
        explanation:
          "Harbor 在 Registry 之上提供 RBAC 项目管理、Trivy 扫描、签名与跨仓复制等；不负责构建镜像。",
      },
      {
        type: "single",
        prompt: "参考库中 Harbor 通过什么方式对外暴露服务？",
        options: [
          { id: "a", text: "NodePort 固定端口" },
          { id: "b", text: "Istio Ingress / 网关 + TLS" },
          { id: "c", text: "hostNetwork 直接监听 443" },
          { id: "d", text: "仅集群内访问" },
        ],
        answer: "b",
        explanation: "文档标题即「Harbor 镜像仓库（Istio Ingress）」，走网关统一入口与证书管理。",
      },
    ],
  },
  {
    id: "quiz-repo-registry",
    lessonId: "repo/registry",
    title: "Docker Registry",
    questions: [
      {
        type: "single",
        prompt: "自建 registry 使用自签证书时，节点侧需要做什么？",
        options: [
          { id: "a", text: "什么都不用做" },
          { id: "b", text: "把 CA 证书放入 containerd/docker 的信任目录（如 /etc/containerd/certs.d/<host>/ca.crt）" },
          { id: "c", text: "必须改用 HTTP 明文" },
          { id: "d", text: "只能购买公共证书" },
        ],
        answer: "b",
        explanation:
          "容器运行时需信任 registry 的 CA；参考库提供 gen-cert.sh 与对应 containerd 配置说明。",
      },
    ],
  },
  {
    id: "quiz-db-kubeblocks-day0",
    lessonId: "db/kubeblocks/kbcli-0.9.3/day-0-kubeblocks",
    title: "KubeBlocks 简介",
    questions: [
      {
        type: "single",
        prompt: "KubeBlocks 的定位是？",
        options: [
          { id: "a", text: "一个数据库引擎" },
          { id: "b", text: "基于 K8s 的数据库管理平台：以统一方式管理 MySQL/PostgreSQL/Redis 等多种引擎的生命周期" },
          { id: "c", text: "备份软件" },
          { id: "d", text: "SQL 审计工具" },
        ],
        answer: "b",
        explanation:
          "KubeBlocks 用统一的 CRD/Operator 抽象管理多种数据库引擎的部署、扩缩容、监控与备份。",
      },
      {
        type: "fill",
        prompt: "KubeBlocks 的命令行工具叫 ______（小写）。",
        accepts: ["kbcli"],
        explanation: "kbcli 用于安装 KubeBlocks、创建与管理数据库集群。",
      },
    ],
  },
  {
    id: "quiz-db-redis",
    lessonId: "db/redis",
    title: "Redis 上 K8s",
    questions: [
      {
        type: "single",
        prompt: "在 K8s 中运行单机 Redis，持久化数据应使用？",
        options: [
          { id: "a", text: "emptyDir" },
          { id: "b", text: "PVC（RWO）挂载到 StatefulSet" },
          { id: "c", text: "hostPath 随意写" },
          { id: "d", text: "ConfigMap 存 RDB 文件" },
        ],
        answer: "b",
        explanation:
          "StatefulSet + PVC 提供稳定存储与身份；emptyDir 重启丢数据，hostPath 绑定节点不利于漂移。",
      },
      {
        type: "truefalse",
        prompt: "Redis 开启 AOF 后，数据安全性通常优于仅使用 RDB 快照。",
        answer: true,
        explanation: "AOF 追加写命令日志，最多丢失秒级数据；RDB 是间隔快照，窗口内故障会丢更多。",
      },
    ],
  },
];
