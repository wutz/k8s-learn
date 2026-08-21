import type { ModuleId } from "./types";

/** 模块中文元数据（管线读取，写入 manifest） */
export const MODULES_META: Record<ModuleId, { title: string; description: string }> = {
  k8s: {
    title: "K8s 集群部署",
    description: "集群规划、etcd 磁盘验证、kubespray 自动化部署、客户端工具与日常运维 FAQ。",
  },
  base: {
    title: "基础服务",
    description: "节点特性发现（NFD）、镜像 P2P 分发（Spegel）、节点内核调优等集群底座。",
  },
  network: {
    title: "网络",
    description: "Cilium CNI、MetalLB、Ingress 与 Gateway API、Istio 服务网格、证书管理。",
  },
  storage: {
    title: "存储",
    description: "本地盘、CSI 驱动、Ceph / GPFS / Weka / VAST 等块、文件与对象存储接入。",
  },
  ai: {
    title: "AI 平台",
    description: "GPU Operator、分布式训练（Kueue / Volcano）、LLM 推理（vLLM / SGLang）、NCCL 调优。",
  },
  repo: {
    title: "镜像与仓库",
    description: "容器镜像仓库（Registry / Harbor）、PyPI 与 Conda 镜像、P2P 加速。",
  },
  o11y: {
    title: "可观测性",
    description: "VictoriaMetrics 指标、Loki / VictoriaLogs 日志、K8s 事件采集。",
  },
  compute: {
    title: "计算服务",
    description: "vCluster 虚拟集群、Kamaji 托管控制面、KubeVirt 虚拟机（部分内容施工中）。",
  },
  db: {
    title: "数据库",
    description: "Redis、TiKV、KubeBlocks 数据库管理、FoundationDB 等有状态服务。",
  },
  addons: {
    title: "附加组件",
    description: "metrics-server、kamaji 系列等集群辅助组件。",
  },
  os: {
    title: "操作系统",
    description: "主机层准备：系统配置、BIOS 设置、keepalived 高可用。",
  },
  security: {
    title: "安全",
    description: "网络策略等集群安全实践。",
  },
};
