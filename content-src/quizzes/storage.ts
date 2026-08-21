import type { Quiz } from "../types";

export const storageQuizzes: Quiz[] = [
  {
    id: "quiz-storage-local",
    lessonId: "storage/local-storage",
    title: "本地存储",
    questions: [
      {
        type: "single",
        prompt: "使用节点本地盘的 PV，最主要的代价是？",
        options: [
          { id: "a", text: "性能比网络存储差" },
          { id: "b", text: "数据与节点绑定：Pod 漂移到其他节点后无法访问原数据" },
          { id: "c", text: "不支持文件系统" },
          { id: "d", text: "必须使用 ext4" },
        ],
        answer: "b",
        explanation:
          "本地盘 I/O 性能最好，但拓扑受限；通常配合 nodeSelector/亲和性或对数据可丢失的场景（缓存、临时计算）使用。",
      },
    ],
  },
  {
    id: "quiz-storage-snapshot",
    lessonId: "storage/volumesnapshots",
    title: "卷快照",
    questions: [
      {
        type: "order",
        prompt: "K8s 卷快照体系中的组件按「发起 → 执行」的关系排列：",
        items: [
          "VolumeSnapshot（用户声明）",
          "VolumeSnapshotClass（指定驱动与参数）",
          "snapshot-controller / CSI snapshotter",
          "存储后端创建快照",
        ],
        explanation:
          "用户创建 VolumeSnapshot 并引用 VolumeSnapshotClass；控制器协调 CSI 驱动在后端生成快照。",
      },
      {
        type: "truefalse",
        prompt: "VolumeSnapshotContent 对应快照的实际后端资源，类似 PV 之于 PVC。",
        answer: true,
        explanation: "快照体系是 PVC/PV 的镜像设计：Snapshot/SnapshotClass 是命名空间侧声明，Content 是集群侧实际资源。",
      },
    ],
  },
  {
    id: "quiz-storage-cephadm-1",
    lessonId: "storage/cephadm/1-deploy-ceph-cluster",
    title: "Cephadm 部署 Ceph 集群",
    questions: [
      {
        type: "single",
        prompt: "cephadm 引导（bootstrap）集群的作用是？",
        options: [
          { id: "a", text: "只安装 Ceph CLI 工具" },
          { id: "b", text: "在首个节点上拉起最小监控域（monitor + manager），形成可管理的集群种子" },
          { id: "c", text: "直接完成 OSD 全部部署" },
          { id: "d", text: "把 Ceph 转为 systemd 裸进程运行" },
        ],
        answer: "b",
        explanation:
          "bootstrap 先建立 mon/mgr 最小集群并生成 SSH 密钥与配置，之后通过 ceph orch 把其余主机纳入编排、扩容 OSD。",
      },
      {
        type: "multiple",
        prompt: "规划 Ceph 集群时，下列哪些做法正确？",
        options: [
          { id: "a", text: "mon 至少 3 个以保证仲裁" },
          { id: "b", text: "OSD 尽量均匀分布在各主机与故障域上" },
          { id: "c", text: "所有 OSD 用同一块系统盘即可" },
          { id: "d", text: "部署前确认节点间时间同步" },
        ],
        answers: ["a", "b", "d"],
        explanation:
          "mon 需要 odd 数量保证 quorum；OSD 均衡分布避免热点；独立盘与 NTP 同步都是部署前提。",
      },
    ],
  },
  {
    id: "quiz-storage-gpfs-concept",
    lessonId: "storage/gpfs/day-0-concept",
    title: "GPFS 核心概念",
    questions: [
      {
        type: "single",
        prompt: "GPFS（Spectrum Scale / ECE）属于哪类存储？",
        options: [
          { id: "a", text: "块存储" },
          { id: "b", text: "并行分布式文件系统" },
          { id: "c", text: "对象存储网关" },
          { id: "d", text: "数据库" },
        ],
        answer: "b",
        explanation:
          "GPFS 是高性能并行文件系统，多节点可并发挂载同一文件系统，常见于 HPC 与 AI 场景。",
      },
      {
        type: "fill",
        prompt: "GPFS 集群中提供存储服务的侧称为 owning cluster，客户端挂载侧称为 ______ cluster。",
        accepts: ["accessing", "accessing cluster", "访问"],
        explanation: "owning cluster 拥有 NSD/文件系统；accessing cluster 远程挂载使用。",
      },
    ],
  },
];
