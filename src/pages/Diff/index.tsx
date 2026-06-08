import { useState, useMemo } from 'react';
import { ArrowRight, ChevronDown, GitCompare, Plus, Minus, AlertTriangle, XCircle } from 'lucide-react';
import { mockSources } from '@/mock/sources';
import { mockChanges, changeCategoryLabels, changeTypeLabels, changeSeverityLabels } from '@/mock/changes';
import type { ApiChange, ChangeCategory, ChangeType, ChangeSeverity, HttpMethod } from '@/types';
import { cn } from '@/lib/utils';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success-500',
  POST: 'bg-brand-500',
  PUT: 'bg-warning-500',
  DELETE: 'bg-danger-500',
  PATCH: 'bg-ink-400',
};

const changeTypeConfig: Record<ChangeType, { label: string; prefix: string; bgClass: string; textClass: string; iconClass: string }> = {
  added: {
    label: '新增',
    prefix: '+',
    bgClass: 'bg-success-50 border-success-200',
    textClass: 'text-success-700',
    iconClass: 'text-success-500',
  },
  removed: {
    label: '删除',
    prefix: '-',
    bgClass: 'bg-danger-50 border-danger-200',
    textClass: 'text-danger-700',
    iconClass: 'text-danger-500',
  },
  modified: {
    label: '修改',
    prefix: '~',
    bgClass: 'bg-warning-50 border-warning-200',
    textClass: 'text-warning-600',
    iconClass: 'text-warning-500',
  },
};

function TypeBadge({ type }: { type: ChangeType }) {
  const cfg = changeTypeConfig[type];
  const Icon = type === 'added' ? Plus : type === 'removed' ? Minus : AlertTriangle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
        cfg.bgClass,
        cfg.textClass,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{cfg.prefix}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

const severityConfig: Record<ChangeSeverity, { label: string; className: string }> = {
  breaking: {
    label: '破坏性',
    className: 'bg-danger-500 text-white',
  },
  normal: {
    label: '普通',
    className: 'bg-brand-50 text-brand-700 border border-brand-200',
  },
  minor: {
    label: '轻微',
    className: 'bg-ink-50 text-ink-500 border border-ink-200',
  },
};

function SeverityBadge({ severity }: { severity: ChangeSeverity }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        cfg.className,
      )}
    >
      {severity === 'breaking' && <XCircle className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

const categories: ChangeCategory[] = ['path', 'parameter', 'field', 'statusCode', 'auth', 'example'];

interface Stats {
  added: number;
  removed: number;
  modified: number;
  breaking: number;
  total: number;
}

export default function Diff() {
  const [leftSourceId, setLeftSourceId] = useState(mockSources[0].id);
  const [rightSourceId, setRightSourceId] = useState(mockSources[0].id);
  const [activeCategory, setActiveCategory] = useState<ChangeCategory>('field');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const leftSource = mockSources.find((s) => s.id === leftSourceId)!;
  const rightSource = mockSources.find((s) => s.id === rightSourceId)!;

  const leftVersions = useMemo(() => {
    const vs = new Set<string>();
    mockChanges
      .filter((c) => c.sourceId === leftSourceId)
      .forEach((c) => {
        vs.add(c.versionFrom);
        vs.add(c.versionTo);
      });
    vs.add(leftSource.currentVersion);
    return Array.from(vs).sort().reverse();
  }, [leftSourceId, leftSource.currentVersion]);

  const rightVersions = useMemo(() => {
    const vs = new Set<string>();
    mockChanges
      .filter((c) => c.sourceId === rightSourceId)
      .forEach((c) => {
        vs.add(c.versionFrom);
        vs.add(c.versionTo);
      });
    vs.add(rightSource.currentVersion);
    return Array.from(vs).sort().reverse();
  }, [rightSourceId, rightSource.currentVersion]);

  const [leftVersion, setLeftVersion] = useState(leftVersions.length > 1 ? leftVersions[1] : leftVersions[0]);
  const [rightVersion, setRightVersion] = useState(rightVersions[0]);

  const filteredChanges = useMemo(() => {
    return mockChanges.filter((c) => {
      const matchSource = c.sourceId === leftSourceId && c.sourceId === rightSourceId;
      const matchVersion = c.versionFrom === leftVersion && c.versionTo === rightVersion;
      return matchSource && matchVersion;
    });
  }, [leftSourceId, rightSourceId, leftVersion, rightVersion]);

  const categoryStats = useMemo(() => {
    const map: Record<ChangeCategory, Stats> = {
      path: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      parameter: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      field: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      statusCode: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      auth: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      example: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
    };
    filteredChanges.forEach((c) => {
      const s = map[c.category];
      s.total++;
      s[c.type]++;
      if (c.severity === 'breaking') s.breaking++;
    });
    return map;
  }, [filteredChanges]);

  const totalStats = useMemo(() => {
    const s: Stats = { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 };
    filteredChanges.forEach((c) => {
      s.total++;
      s[c.type]++;
      if (c.severity === 'breaking') s.breaking++;
    });
    return s;
  }, [filteredChanges]);

  const categoryChanges = useMemo(
    () => filteredChanges.filter((c) => c.category === activeCategory),
    [filteredChanges, activeCategory],
  );

  return (
    <div className="min-h-screen p-6 gradient-mesh-bg">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-700">版本对比</h1>
          <p className="mt-1 text-sm text-ink-400">对比两个版本之间的接口变更，识别破坏性影响</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex flex-1 min-w-[240px] flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">源版本（旧）</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="input-field flex items-center justify-between text-left pr-9"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-700">{leftSource.name}</span>
                    <span className="text-xs text-ink-400">v{leftVersion}</span>
                  </div>
                  <ChevronDown className={cn('absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition-transform', leftOpen && 'rotate-180')} />
                </button>
                {leftOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-ink-100 bg-white shadow-cardHover">
                    {mockSources.map((s) => (
                      <div key={s.id} className="border-b border-ink-50 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => {
                            setLeftSourceId(s.id);
                            setLeftOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50',
                            s.id === leftSourceId && 'bg-brand-50/60',
                          )}
                        >
                          <div className="font-medium text-ink-700">{s.name}</div>
                          <div className="text-xs text-ink-400">{s.system}</div>
                        </button>
                      </div>
                    ))}
                    <div className="divider-x my-1" />
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">选择版本</div>
                    {leftVersions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setLeftVersion(v);
                          setLeftOpen(false);
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-ink-50 font-mono',
                          v === leftVersion && 'text-brand-700 bg-brand-50/60',
                        )}
                      >
                        v{v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-brand-100/50">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            <div className="flex flex-1 min-w-[240px] flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">目标版本（新）</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRightOpen(!rightOpen)}
                  className="input-field flex items-center justify-between text-left pr-9"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-700">{rightSource.name}</span>
                    <span className="text-xs text-ink-400">v{rightVersion}</span>
                  </div>
                  <ChevronDown className={cn('absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition-transform', rightOpen && 'rotate-180')} />
                </button>
                {rightOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-ink-100 bg-white shadow-cardHover">
                    {mockSources.map((s) => (
                      <div key={s.id} className="border-b border-ink-50 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => {
                            setRightSourceId(s.id);
                            setRightOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50',
                            s.id === rightSourceId && 'bg-brand-50/60',
                          )}
                        >
                          <div className="font-medium text-ink-700">{s.name}</div>
                          <div className="text-xs text-ink-400">{s.system}</div>
                        </button>
                      </div>
                    ))}
                    <div className="divider-x my-1" />
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">选择版本</div>
                    {rightVersions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setRightVersion(v);
                          setRightOpen(false);
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-ink-50 font-mono',
                          v === rightVersion && 'text-brand-700 bg-brand-50/60',
                        )}
                      >
                        v{v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <button type="button" className="btn-primary">
                <GitCompare className="h-4 w-4" />
                生成对比报告
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">变更统计</h2>
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success-400" /> 新增
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-danger-400" /> 删除
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning-400" /> 修改
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-danger-600" /> 破坏性
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const s = categoryStats[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    activeCategory === cat
                      ? 'border-brand-300 bg-brand-50/60 shadow-[0_0_0_3px_rgba(22,93,255,0.08)]'
                      : 'border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/30',
                  )}
                >
                  <div className="mb-1 text-xs font-medium text-ink-400">{changeCategoryLabels[cat]}</div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-ink-700">{s.total}</span>
                    <span className="text-xs text-ink-400">项变更</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.added > 0 && (
                      <span className="inline-flex items-center rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-600">
                        +{s.added}
                      </span>
                    )}
                    {s.removed > 0 && (
                      <span className="inline-flex items-center rounded bg-danger-50 px-1.5 py-0.5 text-[10px] font-semibold text-danger-500">
                        -{s.removed}
                      </span>
                    )}
                    {s.modified > 0 && (
                      <span className="inline-flex items-center rounded bg-warning-50 px-1.5 py-0.5 text-[10px] font-semibold text-warning-500">
                        ~{s.modified}
                      </span>
                    )}
                    {s.breaking > 0 && (
                      <span className="inline-flex items-center rounded bg-danger-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        !{s.breaking}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {totalStats.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-ink-50/70 px-4 py-3 text-sm">
              <span className="text-ink-500">合计:</span>
              <span className="font-semibold text-ink-700">{totalStats.total} 项变更</span>
              <span className="text-success-600">新增 {totalStats.added}</span>
              <span className="text-danger-500">删除 {totalStats.removed}</span>
              <span className="text-warning-500">修改 {totalStats.modified}</span>
              {totalStats.breaking > 0 && (
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-danger-500 px-3 py-1 text-xs font-semibold text-white shadow-breaking">
                  <XCircle className="h-3.5 w-3.5" />
                  破坏性变更 {totalStats.breaking} 项，需重点关注
                </span>
              )}
            </div>
          )}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-1 border-b border-ink-100 px-2 pt-2">
            {categories.map((cat) => {
              const s = categoryStats[cat];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'relative inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    active ? 'text-brand-700 bg-white' : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50/50',
                  )}
                >
                  <span>{changeCategoryLabels[cat]}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                      active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    {s.total}
                  </span>
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-ink-100">
            {categoryChanges.length === 0 ? (
              <div className="py-16 text-center text-sm text-ink-400">
                该分类下暂无变更项
              </div>
            ) : (
              categoryChanges.map((c) => <DiffRow key={c.id} change={c} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffRow({ change }: { change: ApiChange }) {
  const typeCfg = changeTypeConfig[change.type];
  const isBreaking = change.severity === 'breaking';

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 p-4 transition-all',
        isBreaking && 'relative shadow-breaking animate-pulse-ring',
      )}
    >
      <div className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-2 md:col-start-1 md:row-start-1 md:flex-col md:items-start md:justify-start">
        <div className="flex items-center gap-2">
          <span className={cn('method-badge', methodColors[change.method])}>{change.method}</span>
          <SeverityBadge severity={change.severity} />
        </div>
        <TypeBadge type={change.type} />
      </div>

      <div className={cn(
        'col-span-12 rounded-lg border p-3 md:col-span-4 md:row-start-1',
        change.type === 'removed' || change.type === 'modified'
          ? typeCfg.bgClass
          : 'border-dashed border-ink-200 bg-ink-50/30 text-ink-400',
      )}>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          <Minus className="h-3 w-3" /> 旧值
        </div>
        {change.oldValue ? (
          <div className="text-sm font-mono break-all text-ink-700">{change.oldValue}</div>
        ) : (
          <div className="text-sm italic text-ink-400">（无）</div>
        )}
      </div>

      <div className={cn(
        'col-span-12 rounded-lg border p-3 md:col-span-4 md:row-start-1 md:col-start-7',
        change.type === 'added' || change.type === 'modified'
          ? typeCfg.bgClass
          : 'border-dashed border-ink-200 bg-ink-50/30 text-ink-400',
      )}>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          <Plus className="h-3 w-3" /> 新值
        </div>
        {change.newValue ? (
          <div className="text-sm font-mono break-all text-ink-700">{change.newValue}</div>
        ) : (
          <div className="text-sm italic text-ink-400">（无）</div>
        )}
      </div>

      <div className="col-span-12 md:col-span-8 md:col-start-5 md:row-start-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-ink-700 px-2 py-1 font-mono text-[11px] text-ink-50">
            {change.endpoint}
          </code>
          {change.fieldPath && (
            <code className="rounded bg-brand-50 px-2 py-1 font-mono text-[11px] text-brand-700 border border-brand-100">
              {change.fieldPath}
            </code>
          )}
          <span className="ml-auto text-ink-400">
            变更类型：<span className="font-medium text-ink-600">{changeTypeLabels[change.type]}</span>
            {' · '}
            影响程度：<span className="font-medium text-ink-600">{changeSeverityLabels[change.severity]}</span>
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{change.description}</p>
      </div>
    </div>
  );
}
