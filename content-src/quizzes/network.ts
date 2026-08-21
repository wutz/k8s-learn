import type { Quiz } from "../types";

export const networkQuizzes: Quiz[] = [
  {
    id: "quiz-network-cilium",
    lessonId: "network/cilium",
    title: "Cilium CNI",
    questions: [
      {
        type: "single",
        prompt: "Cilium 的数据平面基于什么技术？",
        options: [
          { id: "a", text: "Open vSwitch" },
          { id: "b", text: "eBPF" },
          { id: "c", text: "IPVS" },
          { id: "d", text: "SR-IOV" },
        ],
        answer: "b",
        explanation:
          "Cilium 基于 eBPF 数据平面，提供 CNI、Service 与 NetworkPolicy 等能力，支持三到七层策略。",
      },
      {
        type: "single",
        prompt: "文档中 Cilium 的 k8sServiceHost 推荐配置为 127.0.0.1（Kubespray 集群），原因是？",
        options: [
          { id: "a", text: "减少 DNS 查询次数" },
          { id: "b", text: "走节点本地 nginx 代理直连 API Server，天然高可用且避免 ClusterIP/iptables 竞态" },
          { id: "c", text: "127.0.0.1 加密性更好" },
          { id: "d", text: "绕过 kube-proxy 的负载均衡" },
        ],
        answer: "b",
        explanation:
          "Kubespray 在节点本地部署 nginx 代理 API Server；直连本地地址避免 init 容器经 ClusterIP 访问时的 iptables 竞态，且天然 HA。",
      },
      {
        type: "multiple",
        prompt: "部署 Cilium 前需要检查/修改哪些项？",
        options: [
          { id: "a", text: "宿主机是否占用路由表 200/202/2004/2005" },
          { id: "b", text: "Pod CIDR 配置（clusterPoolIPv4PodCIDRList）" },
          { id: "c", text: "bpf.enableTCX 设为 false 以规避已知 bug" },
          { id: "d", text: "必须先卸载 kube-proxy" },
        ],
        answers: ["a", "b", "c"],
        explanation:
          "参考库明确列出路由表占用、Pod CIDR、enableTCX 三处检查；Cilium 可以与 kube-proxy 共存，并非必须卸载。",
      },
      {
        type: "truefalse",
        prompt: "Pod CIDR 用尽扩容地址段时，可以直接修改已有地址段为更大的网段。",
        answer: false,
        explanation: "不能改原有段，应在 clusterPoolIPv4PodCIDRList 中新增地址段，并重启 cilium-operator。",
      },
    ],
  },
  {
    id: "quiz-network-ingress",
    lessonId: "network/istio/ingress",
    title: "Kubernetes Ingress",
    questions: [
      {
        type: "single",
        prompt: "Ingress 资源本身能直接生效吗？",
        options: [
          { id: "a", text: "能，API Server 会自动配置负载均衡" },
          { id: "b", text: "不能，需要集群中运行 Ingress Controller 来监听并实现规则" },
          { id: "c", text: "只有 NodePort 类型的 Ingress 能生效" },
          { id: "d", text: "取决于 Pod 数量" },
        ],
        answer: "b",
        explanation:
          "Ingress 只是规则声明，必须有 Ingress Controller（如 ingress-nginx、Istio Ingress）才能落地。",
      },
      {
        type: "order",
        prompt: "一条 HTTP 请求从外部进入集群，经过的正确顺序是：",
        items: [
          "外部客户端",
          "Ingress Controller（七层路由）",
          "Service（ClusterIP 负载均衡）",
          "Pod",
        ],
        explanation: "典型链路：客户端 → Ingress Controller → Service → Pod。",
      },
      {
        type: "single",
        prompt: "Gateway API 相比传统 Ingress 的核心改进是？",
        options: [
          { id: "a", text: "性能提升 10 倍" },
          { id: "b", text: "角色分离（基础设施提供方/集群运维/应用开发者）与更丰富的路由能力，不再依赖注解扩展" },
          { id: "c", text: "只支持 TCP 协议" },
          { id: "d", text: "替代 CNI" },
        ],
        answer: "b",
        explanation:
          "Gateway API 通过 GatewayClass/Gateway/HTTPRoute 分层模型实现职责分离，原生支持头部匹配、权重路由等能力。",
      },
    ],
  },
  {
    id: "quiz-network-metallb",
    lessonId: "network/metallb",
    title: "MetalLB",
    questions: [
      {
        type: "single",
        prompt: "MetalLB 解决的核心问题是？",
        options: [
          { id: "a", text: "Pod 间通信加密" },
          { id: "b", text: "裸金属/自建集群中 LoadBalancer 类型 Service 没有云厂商 LB 可用的问题" },
          { id: "c", text: "DNS 解析慢" },
          { id: "d", text: "Ingress 证书管理" },
        ],
        answer: "b",
        explanation:
          "云上 LoadBalancer Service 由厂商 LB 实现；裸金属环境用 MetalLB 分配 IP 并通过 BGP/ARP 宣告。",
      },
      {
        type: "single",
        prompt: "MetalLB 在二层（ARP）模式与 BGP 模式之间，哪种更适合与上游交换机组网做等价多路径？",
        options: [
          { id: "a", text: "BGP 模式" },
          { id: "b", text: "二层模式" },
          { id: "c", text: "两者等价" },
          { id: "d", text: "MetalLB 不支持 BGP" },
        ],
        answer: "a",
        explanation: "BGP 模式向网络宣告服务 IP，可配合 ECMP 实现多节点流量分发与故障切换。",
      },
    ],
  },
  {
    id: "quiz-network-cert-manager",
    lessonId: "network/cert-manager",
    title: "cert-manager 证书管理",
    questions: [
      {
        type: "single",
        prompt: "cert-manager 中描述「如何为域名签发证书」的资源是？",
        options: [
          { id: "a", text: "Certificate 直接手写私钥" },
          { id: "b", text: "Issuer / ClusterIssuer（签发者）+ Certificate（证书声明）" },
          { id: "c", text: "Ingress 的 tls 字段就够了，不需要 cert-manager 资源" },
          { id: "d", text: "Secret 控制器" },
        ],
        answer: "b",
        explanation:
          "Issuer/ClusterIssuer 定义 CA 或 ACME 账号等签发方式；Certificate 声明需要的证书，cert-manager 自动签发续期并写入 Secret。",
      },
      {
        type: "truefalse",
        prompt: "HTTP-01 方式验证域名时，Let's Encrypt 需要能通过公网访问到该域名的 80 端口。",
        answer: true,
        explanation: "HTTP-01 依赖公网可访问的 HTTP 端点回源验证；内网服务应选 DNS-01。",
      },
    ],
  },
];
