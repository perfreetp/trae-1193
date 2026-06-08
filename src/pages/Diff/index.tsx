import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  GitCompare,
  Plus,
  Minus,
  AlertTriangle,
  XCircle,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { mockSources } from '@/mock/sources';
import {
  mockChanges,
  changeCategoryLabels,
  changeTypeLabels,
  changeSeverityLabels,
} from '@/mock/changes';
import { mockUsers } from '@/mock/users';
import type {
  ApiChange,
  ChangeCategory,
  ChangeType,
  ChangeSeverity,
  HttpMethod,
  WorkItem,
} from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-success-500',
  POST: 'bg-brand-500',
  PUT: 'bg-warning-500',
  DELETE: 'bg-danger-500',
  PATCH: 'bg-ink-400',
};

const changeTypeConfig: Record<
  ChangeType,
  {
    label: string;
    prefix: string;
    bgClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
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
  const Icon =
    type === 'added' ? Plus : type === 'removed' ? Minus : AlertTriangle;
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

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const categories: ChangeCategory[] = [
  'path',
  'parameter',
  'field',
  'statusCode',
  'auth',
  'example',
];

const categoryIconChars: Record<ChangeCategory, string> = {
  path: '🔗',
  parameter: '📋',
  field: '📦',
  statusCode: '🔢',
  auth: '🔐',
  example: '📝',
};

interface Stats {
  added: number;
  removed: number;
  modified: number;
  breaking: number;
  total: number;
}

function Toast({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgClass =
    toast.type === 'success'
      ? 'bg-success-50/95 border-success-200 text-success-700'
      : toast.type === 'error'
        ? 'bg-danger-50/95 border-danger-200 text-danger-700'
        : 'bg-brand-50/95 border-brand-200 text-brand-700';

  const Icon =
    toast.type === 'success'
      ? Check
      : toast.type === 'error'
        ? AlertTriangle
        : AlertTriangle;

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[260px] animate-fade-in-up',
        bgClass,
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function CreateWorkItemModal({
  open,
  change,
  onClose,
  onSuccess,
}: {
  open: boolean;
  change: ApiChange | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const addWorkItem = useAppStore((s) => s.addWorkItem);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | 'critical'>('medium');

  useEffect(() => {
    if (open && change) {
      setTitle(
        `[${changeCategoryLabels[change.category]}] ${change.description.slice(0, 32)}...`,
      );
      setPriority(change.severity === 'breaking' ? 'critical' : 'medium');
      setAssignee(mockUsers[0].name);
      setSubmitting(false);
    }
  }, [open, change]);

  if (!open || !change) return null;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const item: WorkItem = {
        id: 'wi' + Date.now().toString(36),
        title: title.trim() || `处理 ${changeCategoryLabels[change.category]} 变更`,
        changeIds: [change.id],
        status: 'pending_review',
        priority,
        assignee: assignee || undefined,
        reporter: '系统自动',
        description: `接口变更工单：\n\n接口: ${change.method} ${change.endpoint}\n分类: ${changeCategoryLabels[change.category]}\n类型: ${changeTypeLabels[change.type]}\n影响: ${changeSeverityLabels[change.severity]}\n\n${change.description}`,
        createdAt: now,
        updatedAt: now,
        comments: [],
      };
      addWorkItem(item);
      setSubmitting(false);
      onSuccess(`工单已创建：${item.title}`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/85 p-5 shadow-2xl backdrop-blur-xl animate-fade-in-up">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-700">
              创建工单
            </h2>
            <p className="mt-0.5 text-xs text-ink-400 truncate">
              关联变更：{change.method} {change.endpoint}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-600">
              工单标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="输入工单标题"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-600">
              优先级
            </label>
            <div className="flex flex-wrap gap-2">
              {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'chip cursor-pointer transition-all border',
                    priority === p
                      ? p === 'critical'
                        ? 'bg-danger-50 text-danger-700 border-danger-200'
                        : p === 'high'
                          ? 'bg-warning-50 text-warning-700 border-warning-200'
                          : p === 'medium'
                            ? 'bg-brand-50 text-brand-700 border-brand-200'
                            : 'bg-ink-50 text-ink-600 border-ink-200'
                      : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50',
                  )}
                >
                  {p === 'critical'
                    ? '紧急'
                    : p === 'high'
                      ? '高'
                      : p === 'medium'
                        ? '中'
                        : '低'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-600">
              负责人
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="input-field w-full"
            >
              {mockUsers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}（{u.department}）
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500 space-y-1">
            <div>
              <span className="text-ink-400">变更分类：</span>
              {changeCategoryLabels[change.category]}
            </div>
            <div>
              <span className="text-ink-400">变更类型：</span>
              {changeTypeLabels[change.type]}
            </div>
            <div>
              <span className="text-ink-400">影响程度：</span>
              <span
                className={cn(
                  'font-medium',
                  change.severity === 'breaking'
                    ? 'text-danger-600'
                    : change.severity === 'normal'
                      ? 'text-brand-600'
                      : 'text-ink-500',
                )}
              >
                {changeSeverityLabels[change.severity]}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                创建中
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                创建工单
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Diff() {
  const [searchParams] = useSearchParams();
  const sources = useAppStore((s) => s.sources);
  const allSources = sources.length ? sources : mockSources;

  const [leftSourceId, setLeftSourceId] = useState(mockSources[0].id);
  const [rightSourceId, setRightSourceId] = useState(mockSources[0].id);
  const [activeCategory, setActiveCategory] =
    useState<ChangeCategory>('field');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [workItemOpen, setWorkItemOpen] = useState(false);
  const [workItemChange, setWorkItemChange] = useState<ApiChange | null>(
    null,
  );
  const [diffTriggered, setDiffTriggered] = useState(false);

  const pushToast = (type: ToastType, message: string) => {
    const id = 'toast-' + Date.now().toString(36);
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      return next.slice(-3);
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const leftSource = allSources.find((s) => s.id === leftSourceId)!;
  const rightSource = allSources.find((s) => s.id === rightSourceId)!;

  const leftVersions = useMemo(() => {
    const vs = new Set<string>();
    mockChanges
      .filter((c) => c.sourceId === leftSourceId)
      .forEach((c) => {
        vs.add(c.versionFrom);
        vs.add(c.versionTo);
      });
    if (leftSource) vs.add(leftSource.currentVersion);
    return Array.from(vs).sort().reverse();
  }, [leftSourceId, leftSource?.currentVersion]);

  const rightVersions = useMemo(() => {
    const vs = new Set<string>();
    mockChanges
      .filter((c) => c.sourceId === rightSourceId)
      .forEach((c) => {
        vs.add(c.versionFrom);
        vs.add(c.versionTo);
      });
    if (rightSource) vs.add(rightSource.currentVersion);
    return Array.from(vs).sort().reverse();
  }, [rightSourceId, rightSource?.currentVersion]);

  const [leftVersion, setLeftVersion] = useState(
    leftVersions.length > 1 ? leftVersions[1] : leftVersions[0],
  );
  const [rightVersion, setRightVersion] = useState(rightVersions[0]);

  useEffect(() => {
    const paramSourceId = searchParams.get('sourceId');
    const paramVersionFrom = searchParams.get('versionFrom');
    const paramVersionTo = searchParams.get('versionTo');

    if (paramSourceId && paramVersionFrom && paramVersionTo) {
      const found = allSources.find((s) => s.id === paramSourceId);
      if (found) {
        setLeftSourceId(paramSourceId);
        setRightSourceId(paramSourceId);
        setTimeout(() => {
          setLeftVersion(paramVersionFrom);
          setRightVersion(paramVersionTo);
          setDiffTriggered(true);
          pushToast(
            'info',
            `已载入接口源「${found.name}」v${paramVersionFrom} → v${paramVersionTo} 的对比结果`,
          );
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setLeftVersion(leftVersions.length > 1 ? leftVersions[1] : leftVersions[0]);
  }, [leftVersions]);

  useEffect(() => {
    setRightVersion(rightVersions[0]);
  }, [rightVersions]);

  const filteredChanges = useMemo(() => {
    const list = mockChanges.filter((c) => {
      const matchSource =
        c.sourceId === leftSourceId && c.sourceId === rightSourceId;
      const matchVersion =
        c.versionFrom === leftVersion && c.versionTo === rightVersion;
      return matchSource && matchVersion;
    });
    return list;
  }, [leftSourceId, rightSourceId, leftVersion, rightVersion]);

  const categoryStats = useMemo(() => {
    const map: Record<ChangeCategory, Stats> = {
      path: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      parameter: {
        added: 0,
        removed: 0,
        modified: 0,
        breaking: 0,
        total: 0,
      },
      field: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      statusCode: {
        added: 0,
        removed: 0,
        modified: 0,
        breaking: 0,
        total: 0,
      },
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
    const s: Stats = {
      added: 0,
      removed: 0,
      modified: 0,
      breaking: 0,
      total: 0,
    };
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

  const handleGenerateDiff = () => {
    setDiffTriggered(true);
    pushToast(
      'success',
      `对比报告已生成：共 ${filteredChanges.length} 项变更`,
    );
  };

  const handleCreateWorkItem = (change: ApiChange) => {
    setWorkItemChange(change);
    setWorkItemOpen(true);
  };

  return (
    <div className="min-h-screen p-6 gradient-mesh-bg">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-700">
            版本对比
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            对比两个版本之间的接口变更，识别破坏性影响
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex flex-1 min-w-[240px] flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                源版本（旧）
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="input-field flex items-center justify-between text-left pr-9"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-700">
                      {leftSource?.name}
                    </span>
                    <span className="text-xs text-ink-400">v{leftVersion}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition-transform',
                      leftOpen && 'rotate-180',
                    )}
                  />
                </button>
                {leftOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-ink-100 bg-white shadow-cardHover">
                    {allSources.map((s) => (
                      <div
                        key={s.id}
                        className="border-b border-ink-50 last:border-b-0"
                      >
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
                          <div className="font-medium text-ink-700">
                            {s.name}
                          </div>
                          <div className="text-xs text-ink-400">{s.system}</div>
                        </button>
                      </div>
                    ))}
                    <div className="divider-x my-1" />
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      选择版本
                    </div>
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
                          v === leftVersion &&
                            'text-brand-700 bg-brand-50/60',
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
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                目标版本（新）
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRightOpen(!rightOpen)}
                  className="input-field flex items-center justify-between text-left pr-9"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-700">
                      {rightSource?.name}
                    </span>
                    <span className="text-xs text-ink-400">v{rightVersion}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition-transform',
                      rightOpen && 'rotate-180',
                    )}
                  />
                </button>
                {rightOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-ink-100 bg-white shadow-cardHover">
                    {allSources.map((s) => (
                      <div
                        key={s.id}
                        className="border-b border-ink-50 last:border-b-0"
                      >
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
                          <div className="font-medium text-ink-700">
                            {s.name}
                          </div>
                          <div className="text-xs text-ink-400">{s.system}</div>
                        </button>
                      </div>
                    ))}
                    <div className="divider-x my-1" />
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      选择版本
                    </div>
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
                          v === rightVersion &&
                            'text-brand-700 bg-brand-50/60',
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
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateDiff}
              >
                <GitCompare className="h-4 w-4" />
                生成对比报告
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">变更分类统计</h2>
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
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-base">{categoryIconChars[cat]}</span>
                    <span className="text-xs font-medium text-ink-500">
                      {changeCategoryLabels[cat]}
                    </span>
                    {s.breaking > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
                        !{s.breaking}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-[11px] mb-2">
                    <div className="flex justify-between">
                      <span className="text-success-600 font-semibold">
                        +{s.added}
                      </span>
                      <span className="text-ink-400">新增</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-danger-600 font-semibold">
                        -{s.removed}
                      </span>
                      <span className="text-ink-400">删除</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning-600 font-semibold">
                        ~{s.modified}
                      </span>
                      <span className="text-ink-400">修改</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-ink-100 flex items-baseline justify-between">
                    <span className="font-display text-xl font-bold text-ink-700">
                      {s.total}
                    </span>
                    <span className="text-[10px] text-ink-400">合计项</span>
                  </div>
                </button>
              );
            })}
          </div>

          {totalStats.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-ink-50/70 px-4 py-3 text-sm">
              <span className="text-ink-500">合计:</span>
              <span className="font-semibold text-ink-700">
                {totalStats.total} 项变更
              </span>
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
                    active
                      ? 'text-brand-700 bg-white'
                      : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50/50',
                  )}
                >
                  <span>{categoryIconChars[cat]}</span>
                  <span>{changeCategoryLabels[cat]}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                      active
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    {s.total}
                  </span>
                  {s.breaking > 0 && (
                    <span className="inline-flex h-4 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white">
                      !{s.breaking}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
                  )}
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
              categoryChanges.map((c) => (
                <DiffRow
                  key={c.id}
                  change={c}
                  onCreateWorkItem={handleCreateWorkItem}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <CreateWorkItemModal
        open={workItemOpen}
        change={workItemChange}
        onClose={() => {
          setWorkItemOpen(false);
          setWorkItemChange(null);
        }}
        onSuccess={(msg) => pushToast('success', msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function DiffRow({
  change,
  onCreateWorkItem,
}: {
  change: ApiChange;
  onCreateWorkItem: (c: ApiChange) => void;
}) {
  const typeCfg = changeTypeConfig[change.type];
  const isBreaking = change.severity === 'breaking';

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 p-4 transition-all',
        isBreaking &&
          'relative shadow-breaking animate-pulse-ring bg-gradient-to-r from-danger-50/80 to-transparent',
      )}
    >
      {isBreaking && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger-500 rounded-l-xl" />
      )}

      <div className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-2 md:col-start-1 md:row-start-1 md:flex-col md:items-start md:justify-start md:pl-1">
        <div className="flex items-center gap-2">
          <span className={cn('method-badge', methodColors[change.method])}>
            {change.method}
          </span>
          <SeverityBadge severity={change.severity} />
        </div>
        <TypeBadge type={change.type} />
        <button
          type="button"
          onClick={() => onCreateWorkItem(change)}
          className="btn-primary-sm md:mt-2"
        >
          <Plus className="h-3 w-3" />
          创建工单
        </button>
      </div>

      {isBreaking && (
        <div className="col-span-12 md:col-span-10 md:col-start-3 flex items-center gap-1.5 rounded-lg bg-danger-500/10 border border-danger-200 px-3 py-1.5 text-[11px] text-danger-700 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          破坏性变更
        </div>
      )}

      <div
        className={cn(
          'col-span-12 rounded-lg border p-3 md:col-span-4 md:row-start-1 md:col-start-3',
          change.type === 'removed' || change.type === 'modified'
            ? typeCfg.bgClass
            : 'border-dashed border-ink-200 bg-ink-50/30 text-ink-400',
          isBreaking && 'md:row-start-2',
        )}
      >
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          <Minus className="h-3 w-3" /> 旧值
        </div>
        {change.oldValue ? (
          <div className="text-sm font-mono break-all text-ink-700">
            {change.oldValue}
          </div>
        ) : (
          <div className="text-sm italic text-ink-400">（无）</div>
        )}
      </div>

      <div
        className={cn(
          'col-span-12 rounded-lg border p-3 md:col-span-4 md:row-start-1 md:col-start-7',
          change.type === 'added' || change.type === 'modified'
            ? typeCfg.bgClass
            : 'border-dashed border-ink-200 bg-ink-50/30 text-ink-400',
          isBreaking && 'md:row-start-2',
        )}
      >
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          <Plus className="h-3 w-3" /> 新值
        </div>
        {change.newValue ? (
          <div className="text-sm font-mono break-all text-ink-700">
            {change.newValue}
          </div>
        ) : (
          <div className="text-sm italic text-ink-400">（无）</div>
        )}
      </div>

      <div
        className={cn(
          'col-span-12 md:col-span-8 md:col-start-5',
          isBreaking ? 'md:row-start-3' : 'md:row-start-2',
        )}
      >
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
            变更类型：
            <span className="font-medium text-ink-600">
              {changeTypeLabels[change.type]}
            </span>
            {' · '}
            影响程度：
            <span className="font-medium text-ink-600">
              {changeSeverityLabels[change.severity]}
            </span>
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {change.description}
        </p>
      </div>
    </div>
  );
}
