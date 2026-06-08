import { Fragment, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Database,
  GitBranch,
  AlertTriangle,
  Clock,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  User,
  ChevronRight,
  Layers,
  FileDiff,
  Eye,
  FileBarChart,
  Bell,
} from 'lucide-react';

import { mockSources } from '@/mock/sources';
import { mockChanges, changeSeverityLabels } from '@/mock/changes';
import { mockWorkItems, workPriorityLabels } from '@/mock/workItems';
import { mockMonthlyTrend, mockWeeklyReport, mockHeatmapData } from '@/mock/reports';

import { cn } from '@/lib/utils';
import type { ChangeSeverity, WorkPriority } from '@/types';

function SeverityBadge({ severity }: { severity: ChangeSeverity }) {
  const styles: Record<ChangeSeverity, string> = {
    breaking: 'bg-danger-50 text-danger-500 border-danger-200',
    normal: 'bg-brand-50 text-brand-700 border-brand-200',
    minor: 'bg-success-50 text-success-600 border-success-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
        styles[severity],
      )}
    >
      {changeSeverityLabels[severity]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: WorkPriority }) {
  const styles: Record<WorkPriority, string> = {
    critical: 'bg-danger-500 text-white',
    high: 'bg-warning-400 text-white',
    medium: 'bg-brand-500 text-white',
    low: 'bg-ink-400 text-white',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold tracking-wide',
        styles[priority],
      )}
    >
      {workPriorityLabels[priority]}
    </span>
  );
}

const miniSparkData = {
  totalApis: [
    { v: 160 }, { v: 168 }, { v: 175 }, { v: 180 }, { v: 186 }, { v: 192 }, { v: 202 },
  ],
  monthlyChanges: [
    { v: 42 }, { v: 55 }, { v: 61 }, { v: 58 }, { v: 70 }, { v: 76 }, { v: 88 },
  ],
  breakingRatio: [
    { v: 20 }, { v: 22 }, { v: 18 }, { v: 24 }, { v: 25 }, { v: 23 }, { v: 26.1 },
  ],
  avgHours: [
    { v: 26 }, { v: 24.5 }, { v: 23 }, { v: 22.2 }, { v: 20.4 }, { v: 19.8 }, { v: 18.6 },
  ],
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down'; value: string; positive?: boolean };
  sparkData: { v: number }[];
  sparkColor: string;
  alert?: boolean;
  delay: number;
}

function MetricCard({
  title,
  value,
  subtitle,
  gradient,
  icon,
  trend,
  sparkData,
  sparkColor,
  alert,
  delay,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'glass-card glass-card-hover relative overflow-hidden animate-fade-in-up p-5',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-90',
          gradient,
        )}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/85">{title}</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-white">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    'mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                    trend.positive
                      ? 'bg-success-500/90 text-white'
                      : 'bg-danger-500/95 text-white',
                  )}
                >
                  {trend.direction === 'up' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {trend.value}
                </span>
              )}
            </div>
            {alert && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white animate-pulse-soft">
                <AlertTriangle className="h-3 w-3" />
                需重点关注
              </div>
            )}
            <p className="mt-2 text-xs text-white/70">{subtitle}</p>
          </div>
          <div className="rounded-xl bg-white/20 p-2.5 text-white backdrop-blur">
            {icon}
          </div>
        </div>
        <div className="mt-3 h-14 -mx-1 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function QuickNavEntry({
  icon,
  label,
  desc,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-cardHover"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
          color,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-sm font-semibold text-ink-700 group-hover:text-brand-700">
          {label}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="truncate text-xs text-ink-400">{desc}</p>
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const [hoverCell, setHoverCell] = useState<{
    system: string;
    category: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const totalApis = useMemo(
    () => mockSources.reduce((sum, s) => sum + s.apiCount, 0),
    [],
  );

  const pendingWorkItems = useMemo(() => {
    const priorityOrder: Record<WorkPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return mockWorkItems
      .filter((w) => w.status !== 'closed')
      .sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      )
      .slice(0, 8);
  }, []);

  const changeSeverityStats = useMemo(() => {
    const stats = { breaking: 0, normal: 0, minor: 0 };
    mockChanges.forEach((c) => {
      stats[c.severity]++;
    });
    return stats;
  }, []);

  const heatmapSystems = useMemo(() => {
    return Array.from(new Set(mockHeatmapData.map((d) => d.system)));
  }, []);

  const heatmapCategories = useMemo(() => {
    return Array.from(new Set(mockHeatmapData.map((d) => d.category)));
  }, []);

  const maxHeatmapValue = useMemo(
    () => Math.max(...mockHeatmapData.map((d) => d.value), 1),
    [],
  );

  function getHeatmapColor(value: number) {
    const ratio = value / maxHeatmapValue;
    if (ratio === 0) return 'bg-ink-50 text-ink-300';
    if (ratio < 0.25) return 'bg-brand-100/70 text-brand-700';
    if (ratio < 0.5) return 'bg-brand-200/80 text-brand-800';
    if (ratio < 0.75) return 'bg-brand-400 text-white';
    return 'bg-brand-600 text-white';
  }

  const trendData = useMemo(() => {
    return mockMonthlyTrend.map((d) => ({
      ...d,
      trend:
        d.total * 0.6 +
        (mockMonthlyTrend[Math.max(0, mockMonthlyTrend.indexOf(d) - 1)]?.total ?? d.total) * 0.4,
    }));
  }, []);

  return (
    <div className="min-h-full gradient-mesh-bg">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-ink-700">
            总览仪表盘
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            接口变更态势 · 工单进度 · 风险分布 一屏掌握
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="总接口数"
            value={String(totalApis)}
            subtitle={`覆盖 ${mockSources.length} 个接口源`}
            gradient="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800"
            icon={<Database className="h-5 w-5" />}
            trend={{ direction: 'up', value: '+12.4%', positive: true }}
            sparkData={miniSparkData.totalApis}
            sparkColor="#ffffff"
            delay={40}
          />
          <MetricCard
            title="本月变更"
            value="88"
            subtitle={`${mockWeeklyReport.summary.breakingCount} 条破坏性变更`}
            gradient="bg-gradient-to-br from-violet-500 via-indigo-500 to-brand-700"
            icon={<GitBranch className="h-5 w-5" />}
            trend={{ direction: 'up', value: '+8.6%', positive: true }}
            sparkData={miniSparkData.monthlyChanges}
            sparkColor="#ffffff"
            delay={80}
          />
          <MetricCard
            title="破坏性变更占比"
            value="26.1%"
            subtitle="高于上月警戒线 20%"
            gradient="bg-gradient-to-br from-rose-500 via-danger-500 to-red-700"
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={{ direction: 'up', value: '+3.2%', positive: false }}
            sparkData={miniSparkData.breakingRatio}
            sparkColor="#ffffff"
            alert
            delay={120}
          />
          <MetricCard
            title="平均处理时长"
            value="18.6h"
            subtitle="从发现到工单关闭"
            gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-700"
            icon={<Clock className="h-5 w-5" />}
            trend={{ direction: 'down', value: '-12%', positive: true }}
            sparkData={miniSparkData.avgHours}
            sparkColor="#ffffff"
            delay={160}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div
            className="glass-card glass-card-hover animate-fade-in-up p-5 xl:col-span-2"
            style={{ animationDelay: '200ms' }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  近 30 天变更趋势
                </h2>
                <p className="mt-1 text-xs text-ink-400">
                  按严重级别堆叠 · 含 7 日平滑趋势线
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-danger-400" />
                  <span className="text-ink-500">破坏性</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-400" />
                  <span className="text-ink-500">普通</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-success-400" />
                  <span className="text-ink-500">轻微</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-5 bg-ink-600" />
                  <span className="text-ink-500">趋势</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 10, right: 16, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBreaking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F53F3F" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#F53F3F" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#335CFF" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#335CFF" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="colorMinor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0FC458" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#0FC458" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="#EEF0F3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#7A8494' }}
                    tickLine={false}
                    axisLine={{ stroke: '#EEF0F3' }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#7A8494' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: '#B5CCFF', strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="glass-card min-w-[180px] rounded-xl border border-white/80 p-3 shadow-cardHover">
                          <p className="mb-2 font-display text-sm font-semibold text-ink-700">
                            {label}
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-ink-500">
                                <span className="h-2 w-2 rounded-sm bg-danger-400" />
                                破坏性
                              </span>
                              <span className="font-semibold text-danger-500">
                                {data.breaking}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-ink-500">
                                <span className="h-2 w-2 rounded-sm bg-brand-400" />
                                普通
                              </span>
                              <span className="font-semibold text-brand-700">
                                {data.normal}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-ink-500">
                                <span className="h-2 w-2 rounded-sm bg-success-400" />
                                轻微
                              </span>
                              <span className="font-semibold text-success-600">
                                {data.minor}
                              </span>
                            </div>
                            <div className="mt-1.5 border-t border-ink-100 pt-1.5">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-ink-500">合计</span>
                                <span className="font-bold text-ink-700">
                                  {data.total}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-ink-500">趋势</span>
                                <span className="font-semibold text-ink-600">
                                  {data.trend?.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minor"
                    stackId="1"
                    stroke="#0FC458"
                    strokeWidth={1.5}
                    fill="url(#colorMinor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="normal"
                    stackId="1"
                    stroke="#335CFF"
                    strokeWidth={1.5}
                    fill="url(#colorNormal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="breaking"
                    stackId="1"
                    stroke="#F53F3F"
                    strokeWidth={1.5}
                    fill="url(#colorBreaking)"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#2E3442"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 3"
                  />
                  <Bar dataKey="total" stackId="hidden" fill="transparent" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="glass-card glass-card-hover animate-fade-in-up p-5"
            style={{ animationDelay: '240ms' }}
          >
            <div className="mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Bell className="h-4 w-4 text-danger-500" />
                告警分布
              </h2>
              <p className="mt-1 text-xs text-ink-400">
                按严重级别统计 · 共 {mockChanges.length} 条
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  key: 'breaking' as const,
                  label: '破坏性变更',
                  count: changeSeverityStats.breaking,
                  pct: (changeSeverityStats.breaking / mockChanges.length) * 100,
                  bar: 'bg-gradient-to-r from-danger-400 to-danger-600',
                  text: 'text-danger-500',
                },
                {
                  key: 'normal' as const,
                  label: '普通变更',
                  count: changeSeverityStats.normal,
                  pct: (changeSeverityStats.normal / mockChanges.length) * 100,
                  bar: 'bg-gradient-to-r from-brand-400 to-brand-600',
                  text: 'text-brand-700',
                },
                {
                  key: 'minor' as const,
                  label: '轻微变更',
                  count: changeSeverityStats.minor,
                  pct: (changeSeverityStats.minor / mockChanges.length) * 100,
                  bar: 'bg-gradient-to-r from-success-400 to-success-600',
                  text: 'text-success-600',
                },
              ].map((item) => (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-ink-600">
                      <SeverityBadge severity={item.key} />
                      {item.label}
                    </span>
                    <span className={cn('font-semibold', item.text)}>
                      {item.count}
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        ({item.pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={cn('h-full rounded-full transition-all', item.bar)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-ink-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                快速跳转
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <QuickNavEntry
                  icon={<Layers className="h-4.5 w-4.5" />}
                  label="接口源"
                  desc="管理与扫描"
                  color="bg-brand-500"
                  href="#/sources"
                />
                <QuickNavEntry
                  icon={<FileDiff className="h-4.5 w-4.5" />}
                  label="变更对比"
                  desc="Diff 详情"
                  color="bg-violet-500"
                  href="#/diff"
                />
                <QuickNavEntry
                  icon={<Eye className="h-4.5 w-4.5" />}
                  label="变更评审"
                  desc="工单看板"
                  color="bg-warning-400"
                  href="#/review"
                />
                <QuickNavEntry
                  icon={<FileBarChart className="h-4.5 w-4.5" />}
                  label="周报报告"
                  desc="洞察与分析"
                  color="bg-emerald-500"
                  href="#/reports"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div
            className="glass-card glass-card-hover animate-fade-in-up p-5 xl:col-span-3"
            style={{ animationDelay: '280ms' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-400" />
                  待处理工单
                </h2>
                <p className="mt-1 text-xs text-ink-400">
                  按优先级排序 · 展示前 {pendingWorkItems.length} 条
                </p>
              </div>
              <a
                href="#/review"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                查看全部
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-ink-100">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">优先级</th>
                    <th>工单标题</th>
                    <th className="w-24">严重度</th>
                    <th className="w-28">负责人</th>
                    <th className="w-28">截止日期</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWorkItems.map((item) => {
                    const firstChangeId = item.changeIds[0];
                    const change = mockChanges.find((c) => c.id === firstChangeId);
                    const overdue =
                      item.dueDate &&
                      new Date(item.dueDate).getTime() < Date.now();
                    return (
                      <tr key={item.id}>
                        <td>
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td>
                          <div className="font-medium text-ink-700">
                            {item.title}
                          </div>
                          <div className="mt-0.5 text-xs text-ink-400">
                            #{item.id} · 更新于{' '}
                            {new Date(item.updatedAt).toLocaleDateString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td>
                          {change ? (
                            <SeverityBadge severity={change.severity} />
                          ) : (
                            <span className="text-ink-300">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm text-ink-600">
                              {item.assignee ?? item.reporter}
                            </span>
                          </div>
                        </td>
                        <td>
                          {item.dueDate ? (
                            <span
                              className={cn(
                                'text-xs font-medium',
                                overdue ? 'text-danger-500' : 'text-ink-500',
                              )}
                            >
                              {item.dueDate}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="glass-card glass-card-hover animate-fade-in-up relative overflow-hidden p-5 xl:col-span-2"
            style={{ animationDelay: '320ms' }}
          >
            <div className="mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                系统 × 变更类别 热力图
              </h2>
              <p className="mt-1 text-xs text-ink-400">
                颜色深浅代表变更数量
              </p>
            </div>
            <div className="relative">
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `72px repeat(${heatmapCategories.length}, minmax(0, 1fr))`,
                }}
                onMouseLeave={() => setHoverCell(null)}
              >
                <div />
                {heatmapCategories.map((cat) => (
                  <div
                    key={cat}
                    className="text-center text-[11px] font-semibold text-ink-500"
                  >
                    {cat}
                  </div>
                ))}

                {heatmapSystems.map((system) => (
                  <Fragment key={system}>
                    <div
                      className="flex items-center text-xs font-medium text-ink-600"
                    >
                      <span className="truncate">{system}</span>
                    </div>
                    {heatmapCategories.map((category) => {
                      const cell = mockHeatmapData.find(
                        (d) => d.system === system && d.category === category,
                      );
                      const value = cell?.value ?? 0;
                      return (
                        <div
                          key={`${system}-${category}`}
                          className={cn(
                            'relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-all hover:scale-105 hover:shadow-md',
                            getHeatmapColor(value),
                          )}
                          onMouseEnter={(e) => {
                            const rect = (
                              e.currentTarget as HTMLElement
                            ).getBoundingClientRect();
                            const parent = (
                              e.currentTarget.closest(
                                '.glass-card',
                              ) as HTMLElement
                            )?.getBoundingClientRect();
                            setHoverCell({
                              system,
                              category,
                              value,
                              x: rect.left - (parent?.left ?? 0) + rect.width / 2,
                              y: rect.top - (parent?.top ?? 0) - 8,
                            });
                          }}
                        >
                          {value > 0 ? value : ''}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>

              {hoverCell && (
                <div
                  className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full animate-fade-in"
                  style={{ left: hoverCell.x, top: hoverCell.y }}
                >
                  <div className="glass-card whitespace-nowrap rounded-lg border border-white/80 px-3 py-2 text-xs shadow-cardHover">
                    <div className="font-semibold text-ink-700">
                      {hoverCell.system} · {hoverCell.category}
                    </div>
                    <div className="mt-1 text-brand-600">
                      变更数量：
                      <span className="font-bold">{hoverCell.value}</span>
                    </div>
                  </div>
                  <div className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-white/80 bg-white/80" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-ink-400">
              <span>少</span>
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-4 w-6 rounded',
                    getHeatmapColor(Math.round(maxHeatmapValue * r)),
                  )}
                />
              ))}
              <span>多</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
