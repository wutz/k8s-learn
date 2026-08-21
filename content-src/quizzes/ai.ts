import type { Quiz } from "../types";

export const aiQuizzes: Quiz[] = [
  {
    id: "quiz-ai-gpu-operator",
    lessonId: "ai/gpu-operator",
    title: "GPU Operator",
    questions: [
      {
        type: "single",
        prompt: "GPU Operator 的核心价值是？",
        options: [
          { id: "a", text: "把驱动、container toolkit、设备插件等以 Kubernetes 原生方式自动化部署与运维" },
          { id: "b", text: "提升单卡算力" },
          { id: "c", text: "替代调度器分配 GPU" },
          { id: "d", text: "压缩模型体积" },
        ],
        answer: "a",
        explanation:
          "GPU Operator 将 NVIDIA 驱动、nvidia container toolkit、device plugin、DCGM exporter 等打包为集群组件自动管理。",
      },
      {
        type: "truefalse",
        prompt: "使用 GPU Operator 管理驱动时，节点主机上不应再单独预装 NVIDIA 驱动（避免冲突）。",
        answer: true,
        explanation: "operator 容器化部署驱动；宿主机已装驱动会与之冲突，需按文档处理。",
      },
    ],
  },
  {
    id: "quiz-ai-kueue",
    lessonId: "ai/kueue",
    title: "Kueue 队列管理",
    questions: [
      {
        type: "single",
        prompt: "Kueue 的 Gang 调度判断发生在哪一层？",
        options: [
          { id: "a", text: "调度层：scheduler 对整组 Pod 统一评估" },
          { id: "b", text: "准入层：资源不足时 Job 保持 suspended，一个 Pod 都不创建" },
          { id: "c", text: "网络层" },
          { id: "d", text: "存储层" },
        ],
        answer: "b",
        explanation:
          "Kueue 在准入层做 Gang 判断——配额不够就不放行（零 Pod）；这是它与 Volcano（调度层整组评估）的一句话差异。",
      },
      {
        type: "fill",
        prompt: "Kueue 中声明「谁可以用多少资源」的配额对象叫 ______，工作负载提交到的队列对象叫 LocalQueue。",
        accepts: ["ClusterQueue", "clusterqueue"],
        explanation: "ClusterQueue 定义资源配额池；LocalQueue 是命名空间内指向 ClusterQueue 的提交入口。",
      },
      {
        type: "truefalse",
        prompt: "与 Volcano 共存时，应让 Kueue 的 webhook 只处理明确标记的 Job 类资源，避免拦截普通 Pod。",
        answer: true,
        explanation:
          "参考库必读章节：Kueue mutating webhook 若包含 pod/deployment 会把未标记 Pod 注入 suspended 并覆盖 schedulerName，破坏 Volcano 调度。",
      },
    ],
  },
  {
    id: "quiz-ai-volcano",
    lessonId: "ai/volcano",
    title: "Volcano 批调度",
    questions: [
      {
        type: "single",
        prompt: "Volcano 与 Kueue 在 Gang Scheduling 上的关键差异是？",
        options: [
          { id: "a", text: "Volcano 在调度层做整组评估（Pod 已创建，scheduler 整组判断）；Kueue 在准入层（资源不够零 Pod）" },
          { id: "b", text: "Volcano 不支持 Gang Scheduling" },
          { id: "c", text: "Kueue 需要 GPU 而 Volcano 不需要" },
          { id: "d", text: "两者完全相同" },
        ],
        answer: "a",
        explanation:
          "这正是参考库给出的一句话差异：Volcano 调度层 vs Kueue 准入层。",
      },
      {
        type: "single",
        prompt: "安装 Volcano 后查看队列，为什么文档强调用 kubectl get q 而不是 kubectl get queue？",
        options: [
          { id: "a", text: "queue 更长，容易打错" },
          { id: "b", text: "get queue 可能解析到 Kueue 的 LocalQueue CRD，产生混淆" },
          { id: "c", text: "Volcano 没有队列概念" },
          { id: "d", text: "q 是唯一合法缩写" },
        ],
        answer: "b",
        explanation:
          "两个系统都有名为 queue 的资源短名；用 q 或全名 queues.scheduling.volcano.sh 明确指向 Volcano。",
      },
    ],
  },
  {
    id: "quiz-ai-scheduling-comparison",
    lessonId: "ai/scheduling-comparison",
    title: "批处理调度选型",
    questions: [
      {
        type: "multiple",
        prompt: "选型批处理/Gang 调度方案时，下列哪些是合理的考量维度？",
        options: [
          { id: "a", text: "是否需要队列配额与多租户公平性" },
          { id: "b", text: "训练框架生态（MPI/PyTorch/Ray）的集成方式" },
          { id: "c", text: "与已有组件（如 Kueue webhook）的共存冲突" },
          { id: "d", text: "GPU 型号品牌" },
        ],
        answers: ["a", "b", "c"],
        explanation:
          "调度选型围绕配额/公平性、生态集成与共存关系展开；GPU 型号本身不是调度器选型决定因素。",
      },
      {
        type: "single",
        prompt: "希望「资源不足时任务排队等待、绝不部分启动」，且偏好纯准入控制不动 kube-scheduler，更适合选？",
        options: [
          { id: "a", text: "Kueue" },
          { id: "b", text: "Volcano" },
          { id: "c", text: "NodeLocalDNS" },
          { id: "d", text: "MetalLB" },
        ],
        answer: "a",
        explanation: "Kueue 的 suspended 准入模型天然满足「零 Pod 排队」语义，且复用默认调度器。",
      },
    ],
  },
];
