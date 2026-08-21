import type { Quiz } from "../types";

export const k8sQuizzes: Quiz[] = [
  {
    id: "quiz-k8s-kubespray",
    lessonId: "k8s/kubespray",
    title: "Kubespray 部署要点",
    questions: [
      {
        type: "single",
        prompt: "Kubespray 部署 K8s 集群时，集群清单（inventory）通常定义在哪类文件中？",
        options: [
          { id: "a", text: "inventory/<集群名>/hosts.ini，按 kube_control_plane / kube_node 等分组" },
          { id: "b", text: "kustomization.yaml 中的 nodes 字段" },
          { id: "c", text: "helmwave.yml 中的 releases 列表" },
          { id: "d", text: "cluster.json 清单文件" },
        ],
        answer: "a",
        explanation:
          "Kubespray 使用 Ansible inventory（hosts.ini）管理节点分组，control plane 与 worker 由不同组区分。",
      },
      {
        type: "multiple",
        prompt: "部署前规划 etcd 所在节点磁盘时，应关注哪些方面？",
        options: [
          { id: "a", text: "磁盘写入延迟（etcd 对 fsync 延迟敏感）" },
          { id: "b", text: "使用 SSD/NVMe 等低延迟介质" },
          { id: "c", text: "etcd 与大容量数据服务共享同一块盘以节省资源" },
          { id: "d", text: "提前做磁盘性能基准验证" },
        ],
        answers: ["a", "b", "d"],
        explanation:
          "etcd 强依赖写入延迟；参考库专门提供 etcd-disk-performance 验证步骤。与高负载服务共享磁盘是典型反模式。",
      },
      {
        type: "truefalse",
        prompt: "Kubespray 升级小版本（如 2.30→2.31）前，应先评估配置变更影响再操作。",
        answer: true,
        explanation: "参考库为 2.30→2.31 专门整理了升级影响评估与检查清单。",
      },
    ],
  },
  {
    id: "quiz-k8s-client",
    lessonId: "k8s/client",
    title: "kubectl 与客户端工具",
    questions: [
      {
        type: "order",
        prompt: "将 kubectl 排障命令按「由粗到细」的典型顺序排列：",
        items: [
          "kubectl get pods -n default",
          "kubectl describe pod my-pod -n default",
          "kubectl logs my-pod -n default --previous",
          "kubectl exec -it my-pod -n default -- sh",
        ],
        explanation:
          "先看状态（get）→ 看事件与配置（describe）→ 看日志（logs，崩溃时用 --previous）→ 最后进容器（exec）。",
      },
      {
        type: "fill",
        prompt: "kubectl 的配置文件默认位于 ______（写完整路径）。",
        accepts: ["~/.kube/config", "$HOME/.kube/config", "/root/.kube/config"],
        explanation: "kubectl 默认读取 ~/.kube/config，可用 KUBECONFIG 环境变量覆盖。",
      },
      {
        type: "truefalse",
        prompt: "helm 与 kubectl 一样直接操作集群，无需本地渲染即可把 chart 原样发给 API Server。",
        answer: false,
        explanation: "helm 在本地渲染模板生成 manifest 后再提交；helmwave 则先 build 生成渲染产物再 up。",
      },
    ],
  },
  {
    id: "quiz-k8s-rbac",
    lessonId: "k8s/sa-management",
    title: "ServiceAccount 与 RBAC",
    questions: [
      {
        type: "single",
        prompt: "要给一个 Pod 内的进程授予「只读 ConfigMap」权限，最合理的做法是？",
        options: [
          { id: "a", text: "创建 Role + RoleBinding，绑定到专用 ServiceAccount，Pod spec 引用该 SA" },
          { id: "b", text: "直接把 admin ClusterRole 绑定到 default SA" },
          { id: "c", text: "在容器内硬编 kubeconfig 管理员证书" },
          { id: "d", text: "给 namespace 加标签即可，无需 RBAC" },
        ],
        answer: "a",
        explanation:
          "最小权限原则：Role（命名空间内）+ RoleBinding + 专用 SA，避免使用 default SA 或过大的 ClusterRole。",
      },
      {
        type: "single",
        prompt: "Role 与 ClusterRole 的核心区别是？",
        options: [
          { id: "a", text: "Role 只能授 Pod 权限，ClusterRole 授所有资源" },
          { id: "b", text: "Role 作用于单个命名空间，ClusterRole 是集群级（也可经 RoleBinding 在命名空间内复用）" },
          { id: "c", text: "ClusterRole 只能绑定给 ServiceAccount" },
          { id: "d", text: "两者只是名字不同，作用域完全一样" },
        ],
        answer: "b",
        explanation:
          "Role 是命名空间作用域；ClusterRole 是集群作用域，但可通过 RoleBinding 在单个命名空间内引用它实现复用。",
      },
    ],
  },
];
