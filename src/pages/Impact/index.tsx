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
} from 'lucide-react';
import { mockNodes, mockEdges } from '@/mock/topology';
import type { NodeType } from '@/types';
import { cn } from '@/lib/utils';

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

export default function Impact() {
  const nodes = mockNodes;
  const edges = mockEdges;

  const atRiskNodes = nodes.filter((n) => n.changeRelated);
  const totalCalls = edges.reduce((sum, e) => sum + e.callVolume, 0);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <Network className="text-brand-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">系统节点</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {nodes.length}
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
            {edges.length}
            <span className="ml-2 text-xs font-normal text-ink-400">条</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
              <AlertTriangle className="text-warning-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">受影响节点</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {atRiskNodes.length}
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
            {(totalCalls / 1000).toFixed(1)}k
            <span className="ml-2 text-xs font-normal text-ink-400">次</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">系统拓扑图</h3>
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
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(22, 93, 255, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)`
            }} />
            <div className="text-center z-10">
              <Network className="mx-auto mb-3 text-brand-400" size={48} strokeWidth={1.5} />
              <p className="text-sm text-ink-500 mb-1">拓扑可视化区域</p>
              <p className="text-xs text-ink-400">共 {nodes.length} 个节点，{edges.length} 条连线</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-4">受影响系统</h3>
          <div className="space-y-3">
            {atRiskNodes.map((node) => {
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
                        : 'bg-ink-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        node.changeRelated ? 'text-white' : 'text-ink-500'
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
                            riskLevelColors[node.riskLevel]
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
              {atRiskNodes.slice(0, 5).map((node, idx) => {
                const relatedEdges = edges.filter(
                  (e) => e.source === node.id || e.target === node.id
                );
                const calls = relatedEdges.reduce((sum, e) => sum + e.callVolume, 0);
                return (
                  <tr key={node.id}>
                    <td>
                      <div className="font-medium text-ink-700">{node.name}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {nodeTypeLabels[node.type]}
                      </div>
                    </td>
                    <td>
                      <span className="chip bg-danger-50 text-danger-700 border border-danger-200">
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
                            riskLevelColors[node.riskLevel]
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
