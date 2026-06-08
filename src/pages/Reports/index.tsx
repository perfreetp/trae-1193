import { PageContainer } from '@/components/Layout';
import { mockReports, mockWeeklyReport } from '@/mock/reports';
import {
  FileBarChart2,
  Download,
  Calendar,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Table,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function Reports() {
  const latest = mockWeeklyReport;

  const statCards = [
    {
      label: '数据源总数',
      value: latest.summary.totalSources,
      icon: Target,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: '本周变更数',
      value: latest.summary.totalChanges,
      icon: TrendingUp,
      color: 'text-success-600',
      bg: 'bg-success-50',
      trend: '+8',
      trendUp: true,
    },
    {
      label: '破坏性变更',
      value: latest.summary.breakingCount,
      icon: AlertTriangle,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      trend: '-2',
      trendUp: false,
    },
    {
      label: '变更解决率',
      value: `${Math.round(latest.summary.resolvedRate * 100)}%`,
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      label: '平均处理时长',
      value: `${latest.summary.avgHandleHours}h`,
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      trend: '-1.5h',
      trendUp: true,
    },
  ];

  return (
    <PageContainer
      title="报告中心"
      description="按周汇总 API 变更治理情况，分析趋势并识别改进空间"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Calendar size={16} strokeWidth={1.8} />
            本周
            <ChevronDown size={14} strokeWidth={2} />
          </button>
          <button className="btn-secondary">
            <FileText size={16} strokeWidth={1.8} />
            导出 PDF
          </button>
          <button className="btn-secondary">
            <Table size={16} strokeWidth={1.8} />
            导出 Excel
          </button>
          <button className="btn-primary">
            <FileSpreadsheet size={16} strokeWidth={1.8} />
            导出 Word
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="glass-card p-6 border-t-4 border-t-brand-500">
          <div className="flex flex-wrap items-start justify-between gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                  <Sparkles className="text-brand-600" size={16} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  本周报告摘要
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-700 mb-1">
                {latest.weekStart} 至 {latest.weekEnd}
              </h2>
              <p className="text-sm text-ink-500">
                第 23 周 · 共 5 个工作日 · 治理整体达标
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-brand-50 text-brand-700 border border-brand-200">
                治理达标
              </span>
              <span className="chip bg-success-50 text-success-700 border border-success-200">
                较上周改善
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50/50 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        card.bg
                      )}
                    >
                      <Icon
                        className={card.color}
                        size={16}
                        strokeWidth={1.8}
                      />
                    </div>
                    {card.trend && (
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-xs font-semibold',
                          card.trendUp
                            ? 'text-success-600'
                            : 'text-danger-600'
                        )}
                      >
                        {card.trendUp ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownRight size={11} />
                        )}
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {card.value}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-50">
                <CheckCircle2
                  className="text-success-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">本周亮点</h3>
            </div>
            <ul className="space-y-3">
              {latest.highlights.map((h, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600 text-[10px] font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-ink-600 leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-50">
                <AlertTriangle
                  className="text-danger-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">风险提示</h3>
            </div>
            <ul className="space-y-3">
              {latest.risks.map((r, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600 text-[11px] font-bold mt-0.5">
                    !
                  </span>
                  <span className="text-ink-600 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                <TrendingUp
                  className="text-brand-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">推进进度</h3>
            </div>
            <ul className="space-y-3">
              {latest.progress.map((p, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-ink-600 leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">变更趋势</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-danger-500" />
                  破坏性
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-warning-500" />
                  普通
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-ink-400" />
                  轻微
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latest.trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#7A8494', fontSize: 11 }}
                    axisLine={{ stroke: '#DADFE6' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#7A8494', fontSize: 11 }}
                    axisLine={{ stroke: '#DADFE6' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #DADFE6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(29,33,41,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="breaking"
                    stroke="#D91A1A"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normal"
                    stroke="#FF7D00"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="minor"
                    stroke="#7A8494"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-warning-500" size={16} strokeWidth={1.8} />
              <h3 className="section-title">快速概览</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">总变更数</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {latest.summary.totalChanges}
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-success-600">
                    <ArrowUpRight size={11} />
                    +8
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-danger-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">破坏性变更占比</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {Math.round((latest.summary.breakingCount / latest.summary.totalChanges) * 100)}%
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-danger-600">
                    <ArrowDownRight size={11} />
                    -2.3%
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-success-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">已解决率</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {Math.round(latest.summary.resolvedRate * 100)}%
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-success-600">
                    <ArrowUpRight size={11} />
                    +5.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">按系统变更分布</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                全部变更
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-danger-500" />
                破坏性
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latest.bySystem} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                <XAxis
                  dataKey="system"
                  tick={{ fill: '#7A8494', fontSize: 12 }}
                  axisLine={{ stroke: '#DADFE6' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#7A8494', fontSize: 11 }}
                  axisLine={{ stroke: '#DADFE6' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #DADFE6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(29,33,41,0.08)',
                  }}
                  cursor={{ fill: 'rgba(22, 93, 255, 0.04)' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
                <Bar
                  dataKey="changes"
                  name="全部变更"
                  fill="#165DFF"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="breaking"
                  name="破坏性变更"
                  fill="#D91A1A"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <div className="flex items-center gap-2">
              <FileBarChart2
                className="text-brand-500"
                size={16}
                strokeWidth={1.8}
              />
              <h3 className="section-title">历史周报归档</h3>
            </div>
            <span className="text-sm text-ink-400">
              共 {mockReports.length} 期
            </span>
          </div>
          <div className="divide-y divide-ink-50">
            {mockReports.map((report, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50/50 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 text-xs font-bold shrink-0">
                  #{mockReports.length - idx}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-700 group-hover:text-brand-700 transition-colors">
                    {report.weekStart} ~ {report.weekEnd}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                    <span>{report.summary.totalChanges} 变更</span>
                    <span>
                      {report.summary.breakingCount} 破坏性
                    </span>
                    <span>
                      解决率 {Math.round(report.summary.resolvedRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.summary.breakingCount > 0 && (
                    <span className="chip bg-danger-50 text-danger-700 border border-danger-200">
                      需关注
                    </span>
                  )}
                  <button className="btn-ghost h-8 px-3 text-xs">
                    <Download size={12} strokeWidth={1.8} />
                    下载
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
