import type { Quiz } from "../types";

export const baseQuizzes: Quiz[] = [
  {
    id: "quiz-base-spegel",
    lessonId: "base/spegel",
    title: "Spegel 镜像 P2P 分发",
    questions: [
      {
        type: "single",
        prompt: "Spegel 加速镜像拉取的核心原理是？",
        options: [
          { id: "a", text: "把镜像压缩后存入对象存储" },
          { id: "b", text: "节点间 P2P 分发：已拉取过该镜像的节点作为其他节点的拉取源" },
          { id: "c", text: "在集群外部署更大的中央 Registry" },
          { id: "d", text: "通过 CDN 缓存 Docker Hub" },
        ],
        answer: "b",
        explanation:
          "Spegel 是无状态镜像 P2P 方案：每个节点既是客户端也是源，镜像层已在某节点存在时其他节点直接从它拉取，减轻中心 Registry 压力。",
      },
      {
        type: "truefalse",
        prompt: "Spegel 作为「无状态」方案，不需要额外的分布式存储组件即可工作。",
        answer: true,
        explanation: "它复用节点本地 containerd 已有的镜像内容做分发，无需自建存储。",
      },
    ],
  },
  {
    id: "quiz-base-nfd",
    lessonId: "base/nfd",
    title: "Node Feature Discovery",
    questions: [
      {
        type: "single",
        prompt: "NFD（Node Feature Discovery）的主要作用是？",
        options: [
          { id: "a", text: "自动扩缩容节点数量" },
          { id: "b", text: "发现并上报节点硬件特征（CPU 型号、GPU、PCI 设备等）为标签/扩展资源，供调度使用" },
          { id: "c", text: "监控节点磁盘 IO" },
          { id: "d", text: "管理节点内核升级" },
        ],
        answer: "b",
        explanation:
          "NFD 探测节点 CPU 特性、内存、PCI/GPU 等并打标签，让调度器或 nodeSelector 能按硬件特征调度。",
      },
      {
        type: "fill",
        prompt: "想让 Pod 只调度到带某种硬件特征的节点上，通常在 spec 里配合 ______ 字段引用 NFD 打出的标签。",
        accepts: ["nodeSelector", "nodeAffinity", "affinity"],
        explanation: "nodeSelector / nodeAffinity 都可以基于 NFD 标签做筛选。",
      },
    ],
  },
];
