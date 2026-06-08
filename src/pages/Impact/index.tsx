import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/Layout';
import {
  Network,
  AlertTriangle,
  ArrowRight,
  Shield,
  Server,
  Database,
  Layers,
  Search,
  Filter,
  ChevronRight,
  Zap,
  ArrowLeft,
  Plus,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { mockNodes, mockEdges } from '@/mock/topology';
import { mockUsers } from '@/mock/users';
import {
  changeCategoryLabels,
  changeSeverityLabels,
} from '@/mock/changes';
import type { NodeType, HttpMethod, ChangeCategory, ChangeSeverity, WorkItem, ApiSource } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { mockSources } from '@/mock/sources';

const nodeTypeLabels: Record<NodeType, string> = {
  api: 'API 接口',
  service: '业务服务',
  consumer: '消费方',
  database: '数据库',
  gateway: '网关',
};

const nodeTypeIcons: Record<NodeType, typeof Server> = {
  api: Layers,
  service: Server,
  consumer: ArrowRight,
  database: Database,
  gateway: Shield,
};

const riskLevelLabels: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低',
};

const riskLevelColors: Record<string, string> = {
  critical: 'bg-danger-500 text-white',
  high: 'bg-danger-100 text-danger-700',
  medium: 'bg-warning-100 text-warning-700',
  low: 'bg-brand-100 text-brand-700',
};

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success-500',
  POST: 'bg-brand-500',
  PUT: 'bg-warning-500',
  DELETE: 'bg-danger-500',
  PATCH: 'bg-ink-400',
};

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface AffectedSystem {
  id: string;
  name: string;
  type: NodeType;
  riskLevel: RiskLevel;
  callVolume: number;
  owner: string;
  riskScore: number;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickDeterministicRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 9301 + 49297);
  return x - Math.floor(x);
}

function generateImpactDescription(
  method: HttpMethod,
  endpoint: string,
  category: ChangeCategory,
  severity: ChangeSeverity,
): string {
  if (severity === 'breaking') {
    switch (category) {
      case 'field':
        return `${method} ${endpoint} 的字段结构发生破坏性变更，下游依赖字段被删除或类型修改将导致解析失败`;
      case 'statusCode':
        return `${method} ${endpoint} 的状态码规则变更，原有错误处理逻辑将失效`;
      case 'auth':
        return `${method} ${endpoint} 的鉴权方式变更，下游接入方需改造鉴权流程`;
      case 'path':
        return `${method} ${endpoint} 的接口路径变更，下游调用地址全部失效`;
      case 'parameter':
        return `${method} ${endpoint} 的请求参数变更，强制参数缺失将返回错误`;
      default:
        return `${method} ${endpoint} 发生破坏性变更（${changeCategoryLabels[category]}），下游需紧急评估影响`;
    }
  }
  return `${method} ${endpoint} 发生${changeSeverityLabels[severity]}变更（${changeCategoryLabels[category]}），建议回归验证`;
}

function generateAffectedSystems(
  endpoint: string,
  category: ChangeCategory,
  severity: ChangeSeverity,
): AffectedSystem[] {
  const seed = hashString(endpoint + category + severity);

  const systemPoolByEndpoint: Record<string, Array<{ name: string; type: NodeType }>> = {
    payments: [
      { name: '交易中心', type: 'service' },
      { name: '订单中心', type: 'service' },
      { name: '对账系统', type: 'consumer' },
      { name: '风控系统', type: 'service' },
      { name: '消息推送', type: 'consumer' },
      { name: '商家后台', type: 'consumer' },
      { name: '财务结算', type: 'service' },
    ],
    orders: [
      { name: '订单中心', type: 'service' },
      { name: '交易中心', type: 'service' },
      { name: '库存中心', type: 'service' },
      { name: '物流中心', type: 'consumer' },
      { name: '商家后台', type: 'consumer' },
      { name: '消息推送', type: 'consumer' },
    ],
    users: [
      { name: '用户中心', type: 'service' },
      { name: '订单中心', type: 'consumer' },
      { name: '营销中心', type: 'consumer' },
      { name: '风控系统', type: 'consumer' },
      { name: '客服系统', type: 'consumer' },
    ],
    products: [
      { name: '商品中心', type: 'service' },
      { name: '搜索服务', type: 'service' },
      { name: '订单中心', type: 'consumer' },
      { name: '推荐系统', type: 'consumer' },
      { name: '商家后台', type: 'consumer' },
      { name: '营销中心', type: 'consumer' },
      { name: '库存中心', type: 'consumer' },
    ],
    risk: [
      { name: '风控中心', type: 'service' },
      { name: '交易中心', type: 'consumer' },
      { name: '支付中台', type: 'consumer' },
      { name: '用户中心', type: 'consumer' },
      { name: '反作弊系统', type: 'service' },
    ],
    marketing: [
      { name: '营销中心', type: 'service' },
      { name: '订单中心', type: 'consumer' },
      { name: '商品中心', type: 'consumer' },
      { name: '推荐系统', type: 'consumer' },
      { name: '用户中心', type: 'consumer' },
    ],
    default: [
      { name: 'API 网关', type: 'gateway' },
      { name: '业务中台', type: 'service' },
      { name: '运营后台', type: 'consumer' },
      { name: '数据中心', type: 'database' },
      { name: '监控告警', type: 'consumer' },
    ],
  };

  let poolKey = 'default';
  const lowerEndpoint = endpoint.toLowerCase();
  if (lowerEndpoint.includes('pay') || lowerEndpoint.includes('refund')) {
    poolKey = 'payments';
  } else if (lowerEndpoint.includes('order')) {
    poolKey = 'orders';
  } else if (lowerEndpoint.includes('user') || lowerEndpoint.includes('login') || lowerEndpoint.includes('register')) {
    poolKey = 'users';
  } else if (lowerEndpoint.includes('goods') || lowerEndpoint.includes('product') || lowerEndpoint.includes('sku')) {
    poolKey = 'products';
  } else if (lowerEndpoint.includes('risk')) {
    poolKey = 'risk';
  } else if (lowerEndpoint.includes('market') || lowerEndpoint.includes('coupon')) {
    poolKey = 'marketing';
  }

  const pool = systemPoolByEndpoint[poolKey];

  const minCount = 4;
  const maxCount = Math.min(7, pool.length);
  const count = minCount + Math.floor(pickDeterministicRandom(seed, 0) * (maxCount - minCount + 1));

  const systems: AffectedSystem[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(pickDeterministicRandom(seed, i + 1) * pool.length);
    const system = pool[idx];
    if (systems.find((s) => s.name === system.name)) continue;

    const callVolume = 10000 + Math.floor(pickDeterministicRandom(seed, i + 10) * 90000);

    let riskLevel: RiskLevel;
    if (severity === 'breaking') {
      if (category === 'auth' || category === 'statusCode' || category === 'field') {
        riskLevel = pickDeterministicRandom(seed, i + 20) < 0.4 ? 'critical' : 'high';
      } else {
        riskLevel = pickDeterministicRandom(seed, i + 20) < 0.5 ? 'high' : 'medium';
      }
    } else if (severity === 'normal') {
      riskLevel = pickDeterministicRandom(seed, i + 20) < 0.4 ? 'medium' : 'low';
    } else {
      riskLevel = 'low';
    }

    const severityWeight = severity === 'breaking' ? 5 : severity === 'normal' ? 3 : 1;
    const categoryWeight =
      category === 'auth'
        ? 3
        : category === 'field'
          ? 2.5
          : category === 'statusCode'
            ? 2.8
            : category === 'path'
              ? 2.5
              : category === 'parameter'
                ? 1.8
                : 1;
    const callWeight = Math.min(3, callVolume / 30000);
    const riskScore = Math.round(
      Math.min(10, severityWeight * 0.6 + categoryWeight * 0.7 + callWeight * 1) * 10
    ) / 10;

    const ownerIdx = Math.floor(pickDeterministicRandom(seed, i + 30) * mockUsers.length);
    const owner = mockUsers[ownerIdx];

    systems.push({
      id: `sys-${seed}-${i}`,
      name: system.name,
      type: system.type,
      riskLevel,
      callVolume,
      owner: owner.name,
      riskScore,
    });
  }

  return systems.sort((a, b) => b.riskScore - a.riskScore);
}

function generateActions(
  category: ChangeCategory,
  severity: ChangeSeverity,
): string[] {
  if (severity === 'breaking') {
    switch (category) {
      case 'field':
        return [
          '通知下游 3 天内完成兼容改造',
          '灰度发布 + 双写过渡期 7 天',
          '保留旧字段 deprecated 14 天',
          '上线前组织变更评审会议',
        ];
      case 'path':
        return [
          '新旧路径并行 30 天',
          '在 API Gateway 层配置 rewrite 规则',
          '通知所有调用方切换新地址',
          '配置路径监控报警',
        ];
      case 'auth':
        return [
          '提前 14 天公告所有接入方',
          '灰度比例 5%→50%→100%',
          '新旧鉴权并行支持 30 天',
          '配置鉴权失败兜底方案演练',
        ];
      case 'statusCode':
        return [
          '梳理所有下游错误处理逻辑全面排查',
          '更新 SDK 版本同步升级',
          '发布后 48 小时重点监控',
        ];
      case 'parameter':
        return [
          '新增参数设置合理默认值',
          '下游接入方 7 天内适配',
          '完善参数校验日志',
        ];
      default:
        return [
          '通知下游评估影响',
          '发布后观察报警',
          '准备回滚预案',
        ];
    }
  }

  if (severity === 'normal') {
    return [
      '全量回归覆盖',
      '发布后 2 小时观察报警',
      '相关方邮件知会',
    ];
  }

  return [
    '冒烟回归覆盖',
    '发布后观察 1 小时监控',
  ];
}

export default function Impact() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addWorkItem = useAppStore((s) => s.addWorkItem);
  const sources = useAppStore((s) => s.sources);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const sourceId = searchParams.get('sourceId');
  const endpoint = searchParams.get('endpoint') as string | null;
  const method = searchParams.get('method') as HttpMethod | null;
  const category = searchParams.get('category') as ChangeCategory | null;
  const severity = searchParams.get('severity') as ChangeSeverity | null;
  const changeId = searchParams.get('changeId');

  const hasLinkage = !!(sourceId && endpoint);

  const allSources = sources.length ? sources : mockSources;

  const linkedSource: ApiSource | undefined = useMemo(() => {
    if (!sourceId) return undefined;
    return allSources.find((s) => s.id === sourceId);
  }, [sourceId, allSources]);

  const affectedSystems = useMemo(() => {
    if (!endpoint || !category || !severity) return [];
    return generateAffectedSystems(endpoint, category, severity);
  }, [endpoint, category, severity]);

  const actions = useMemo(() => {
    if (!category || !severity) return [];
    return generateActions(category, severity);
  }, [category, severity]);

  const overallRiskScore = useMemo(() => {
    if (affectedSystems.length === 0) return 0;
    const total = affectedSystems.reduce((sum, s) => sum + s.riskScore, 0);
    return Math.round((total / affectedSystems.length) * 10) / 10;
  }, [affectedSystems]);

  const totalCalls = affectedSystems.reduce((sum, s) => sum + s.callVolume, 0);

  const criticalCount = affectedSystems.filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'high').length;

  const impactDescription = useMemo(() => {
    if (!method || !endpoint || !category || !severity) return '';
    return generateImpactDescription(method, endpoint, category, severity);
  }, [method, endpoint, category, severity]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateWorkItem = () => {
    if (!changeId || !method || !endpoint || !category || !severity || !linkedSource) return;
    const now = new Date().toISOString();
    const priority = severity === 'breaking' ? 'critical' : severity === 'normal' ? 'medium' : 'low';
    const item: WorkItem = {
      id: 'wi' + Date.now().toString(36),
      title: `[影响分析] ${method} ${endpoint} 变更处理`,
      changeIds: [changeId],
      status: 'pending_review',
      priority,
      assignee: linkedSource.owner,
      reporter: '系统自动',
      description: `接口变更影响分析工单：\n\n接口: ${method} ${endpoint}\n分类: ${changeCategoryLabels[category]}\n影响: ${changeSeverityLabels[severity]}\n所属源: ${linkedSource.name}\n\n${impactDescription}\n\n建议动作:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    addWorkItem(item);
    showToast(`工单已创建：${item.title}`);
  };

  const nodes = mockNodes;
  const edges = mockEdges;
  const atRiskNodes = nodes.filter((n) => n.changeRelated);
  const totalCallsMock = edges.reduce((sum, e) => sum + e.callVolume, 0);

  const riskScoreColorClass =
    overallRiskScore >= 8
      ? 'from-danger-500 to-danger-400'
      : overallRiskScore >= 5
        ? 'from-warning-500 to-warning-400'
        : overallRiskScore >= 3
          ? 'from-brand-500 to-brand-400'
          : 'from-success-500 to-success-400';

  return (
    <PageContainer
      title="影响分析"
      description="分析 API 变更对上下游系统的影响范围，识别关键依赖链路"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Filter size={16} strokeWidth={1.8} />
            筛选
          </button>
          <button className="btn-primary">
            <Search size={16} strokeWidth={1.8} />
            影响分析
          </button>
        </div>
      }
    >
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[100] pointer-events-auto flex items-center gap-3 rounded-xl border border-success-200 bg-success-50/95 px-4 py-3 text-sm font-medium text-success-700 shadow-lg backdrop-blur-md animate-fade-in-up">
          <CheckCircle2 className="h-4 w-4" />
          {toastMsg}
        </div>
      )}

      {hasLinkage && method && endpoint && category && severity && linkedSource && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-brand-100/80 to-blue-50 p-5 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger-100 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-danger-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-ink-700 mb-2">
                  变更影响分析
                </h2>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={cn('method-badge', methodColors[method])}>
                    {method}
                  </span>
                  <code className="rounded bg-brand-50 px-2 py-1 font-mono text-sm text-brand-700 border border-brand-200">
                    {endpoint}
                  </code>
                  <span className="chip bg-ink-50 text-ink-600 border border-ink-200">
                    {changeCategoryLabels[category]}
                  </span>
                  {severity === 'breaking' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      <XCircle className="h-3 w-3" />
                      破坏性
                    </span>
                  ) : (
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      severity === 'normal'
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'bg-ink-50 text-ink-500 border border-ink-200',
                    )}>
                      {changeSeverityLabels[severity]}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <span className="text-ink-500">
                    所属接口源：
                    <span className="font-semibold text-ink-700">{linkedSource.name}</span>
                  </span>
                  <span className="text-ink-500">
                    基地址：
                    <code className="font-mono text-brand-600">{linkedSource.baseUrl}</code>
                  </span>
                  <span className="text-ink-500">
                    负责人：
                    <span className="font-semibold text-ink-700">{linkedSource.owner}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                  {impactDescription}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                返回版本对比
              </button>
              <button
                type="button"
                onClick={handleCreateWorkItem}
                className="btn-danger"
              >
                <Plus className="h-4 w-4" />
                创建工单
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <Network className="text-brand-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">系统节点</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {hasLinkage ? affectedSystems.length : nodes.length}
            <span className="ml-2 text-xs font-normal text-ink-400">个</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <ArrowRight className="text-violet-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">依赖链路</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {hasLinkage ? Math.max(affectedSystems.length - 1, 0) : edges.length}
            <span className="ml-2 text-xs font-normal text-ink-400">条</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-50">
              <AlertTriangle className="text-danger-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">高危系统</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {hasLinkage ? criticalCount : atRiskNodes.length}
            <span className="ml-2 text-xs font-normal text-ink-400">个</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
              <Zap className="text-success-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">日均调用量</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {hasLinkage
              ? (totalCalls / 1000).toFixed(1)
              : (totalCallsMock / 1000).toFixed(1)}
            <span className="ml-2 text-xs font-normal text-ink-400">k 次</span>
          </p>
        </div>
      </div>

      {hasLinkage && (
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">整体风险评分</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-danger-500" />
                极高 ≥ 8
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-warning-500" />
                高 ≥ 5
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                中 ≥ 3
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-success-500" />
                低
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-50 via-white to-ink-100 shadow-inner">
              <svg className="absolute inset-0" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#riskGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallRiskScore / 10) * 263.89} 263.89`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={riskScoreColorClass.split(' ')[0]} />
                    <stop offset="100%" className={riskScoreColorClass.split(' ')[1]} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center z-10">
                <span className="font-display text-3xl font-bold text-ink-700">
                  {overallRiskScore.toFixed(1)}
                </span>
                <p className="text-[10px] text-ink-400 mt-0.5">/ 10</p>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-500">变更严重度</span>
                  <span className="font-semibold text-ink-700">
                    {changeSeverityLabels[severity!]}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      severity === 'breaking'
                        ? 'bg-danger-500'
                        : severity === 'normal'
                          ? 'bg-brand-500'
                          : 'bg-success-500',
                    )}
                    style={{
                      width:
                        severity === 'breaking'
                          ? '100%'
                          : severity === 'normal'
                            ? '60%'
                            : '30%',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-500">调用影响范围</span>
                  <span className="font-semibold text-ink-700">
                    {affectedSystems.length} 个系统
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${Math.min(100, (affectedSystems.length / 7) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-500">调用量权重</span>
                  <span className="font-semibold text-ink-700">
                    {(totalCalls / 1000).toFixed(1)}k 次/日
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning-500"
                    style={{ width: `${Math.min(100, (totalCalls / 500000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasLinkage && actions.length > 0 && (
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <ClipboardList className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="section-title mb-0">建议处理动作</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-ink-100 bg-gradient-to-r from-ink-50/60 to-white p-3 hover:border-brand-200 hover:from-brand-50/50 transition-all"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm text-ink-600 leading-relaxed pt-0.5">
                  {action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">
              {hasLinkage ? '受影响拓扑示意' : '系统拓扑图'}
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-danger-500 animate-pulse-soft" />
                受变更影响
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                正常节点
              </span>
            </div>
          </div>
          <div className="relative h-80 rounded-2xl bg-gradient-to-br from-ink-50 via-brand-50/30 to-violet-50/30 border border-ink-100 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(22, 93, 255, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)`,
              }}
            />
            <div className="text-center z-10">
              <Network
                className="mx-auto mb-3 text-brand-400"
                size={48}
                strokeWidth={1.5}
              />
              <p className="text-sm text-ink-500 mb-1">
                {hasLinkage ? '影响链路可视化区域' : '拓扑可视化区域'}
              </p>
              <p className="text-xs text-ink-400">
                共 {hasLinkage ? affectedSystems.length : nodes.length} 个节点，
                {hasLinkage
                  ? Math.max(affectedSystems.length - 1, 0)
                  : edges.length}{' '}
                条连线
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-4">受影响系统</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {hasLinkage
              ? affectedSystems.map((sys) => {
                const Icon = nodeTypeIcons[sys.type] || Server;
                return (
                  <div
                    key={sys.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer group"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        sys.riskLevel === 'critical' || sys.riskLevel === 'high'
                          ? 'bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm shadow-danger-500/20'
                          : sys.riskLevel === 'medium'
                            ? 'bg-gradient-to-br from-warning-400 to-warning-500'
                            : 'bg-ink-100',
                      )}
                    >
                      <Icon
                        className={cn(
                          sys.riskLevel === 'critical' ||
                          sys.riskLevel === 'high' ||
                          sys.riskLevel === 'medium'
                            ? 'text-white'
                            : 'text-ink-500',
                        )}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-ink-700 truncate">
                          {sys.name}
                        </p>
                        {sys.riskLevel && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              riskLevelColors[sys.riskLevel],
                            )}
                          >
                            {riskLevelLabels[sys.riskLevel]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">
                        {nodeTypeLabels[sys.type]} · {sys.owner}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">
                        <span>风险分 {sys.riskScore.toFixed(1)}</span>
                        <span>·</span>
                        <span>{sys.callVolume.toLocaleString()} 调用</span>
                      </div>
                    </div>
                    <ChevronRight
                      className="text-ink-300 group-hover:text-brand-500 transition-colors"
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>
                );
              })
              : atRiskNodes.map((node) => {
                const Icon = nodeTypeIcons[node.type] || Server;
                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer group"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        node.changeRelated
                          ? 'bg-gradient-to-br from-danger-400 to-danger-600 shadow-sm shadow-danger-500/20'
                          : 'bg-ink-100',
                      )}
                    >
                      <Icon
                        className={cn(
                          node.changeRelated ? 'text-white' : 'text-ink-500',
                        )}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-ink-700 truncate">
                          {node.name}
                        </p>
                        {node.riskLevel && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              riskLevelColors[node.riskLevel],
                            )}
                          >
                            {riskLevelLabels[node.riskLevel]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">
                        {nodeTypeLabels[node.type]} · {node.owner}
                      </p>
                    </div>
                    <ChevronRight
                      className="text-ink-300 group-hover:text-brand-500 transition-colors"
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="glass-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="section-title">影响链路详情</h3>
          <span className="text-xs text-ink-400">按风险等级排序</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>变更源</th>
                <th>影响范围</th>
                <th>依赖路径</th>
                <th>调用量</th>
                <th>风险等级</th>
                <th>负责人</th>
              </tr>
            </thead>
            <tbody>
              {hasLinkage
                ? affectedSystems.slice(0, 5).map((sys, idx) => (
                    <tr key={sys.id}>
                      <td>
                        <div className="font-medium text-ink-700">{sys.name}</div>
                        <div className="text-xs text-ink-400 mt-0.5">
                          {nodeTypeLabels[sys.type]}
                        </div>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'chip',
                            sys.riskLevel === 'critical' ||
                            sys.riskLevel === 'high'
                              ? 'bg-danger-50 text-danger-700 border-danger-200'
                              : sys.riskLevel === 'medium'
                                ? 'bg-warning-50 text-warning-700 border-warning-200'
                                : 'bg-brand-50 text-brand-700 border-brand-200',
                          )}
                        >
                          {Math.max(1, affectedSystems.length - idx - 1)} 个下游
                        </span>
                      </td>
                      <td className="text-xs text-ink-500">
                        {linkedSource?.name} → {sys.name} → 下游系统 {idx + 1}
                      </td>
                      <td className="text-sm font-semibold text-ink-700">
                        {sys.callVolume.toLocaleString()}
                      </td>
                      <td>
                        {sys.riskLevel ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-bold',
                              riskLevelColors[sys.riskLevel],
                            )}
                          >
                            {riskLevelLabels[sys.riskLevel]}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-sm text-ink-600">{sys.owner}</td>
                    </tr>
                  ))
                : atRiskNodes.slice(0, 5).map((node, idx) => {
                    const relatedEdges = edges.filter(
                      (e) => e.source === node.id || e.target === node.id,
                    );
                    const calls = relatedEdges.reduce(
                      (sum, e) => sum + e.callVolume,
                      0,
                    );
                    return (
                      <tr key={node.id}>
                        <td>
                          <div className="font-medium text-ink-700">
                            {node.name}
                          </div>
                          <div className="text-xs text-ink-400 mt-0.5">
                            {nodeTypeLabels[node.type]}
                          </div>
                        </td>
                        <td>
                          <span className="chip bg-danger-50 text-danger-700 border-danger-200">
                            {relatedEdges.length} 个下游
                          </span>
                        </td>
                        <td className="text-xs text-ink-500">
                          {node.name} → 下游系统 {idx + 1} → ...
                        </td>
                        <td className="text-sm font-semibold text-ink-700">
                          {calls.toLocaleString()}
                        </td>
                        <td>
                          {node.riskLevel ? (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-xs font-bold',
                                riskLevelColors[node.riskLevel],
                              )}
                            >
                              {riskLevelLabels[node.riskLevel]}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-sm text-ink-600">{node.owner}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
