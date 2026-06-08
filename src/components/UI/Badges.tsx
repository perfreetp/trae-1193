import type {
  HttpMethod,
  ChangeSeverity,
  WorkPriority,
  WorkStatus,
  SourceStatus,
  ChangeType,
} from '@/types';
import { cn } from '@/lib/utils';

export function MethodBadge({ method }: { method: HttpMethod }) {
  const colors: Record<HttpMethod, string> = {
    GET: 'bg-success-500',
    POST: 'bg-brand-600',
    PUT: 'bg-warning-500',
    DELETE: 'bg-danger-500',
    PATCH: 'bg-ink-500',
  };
  return (
    <span className={cn('method-badge', colors[method])}>{method}</span>
  );
}

export function SeverityBadge({ severity }: { severity: ChangeSeverity }) {
  const styles: Record<ChangeSeverity, string> = {
    breaking:
      'bg-danger-50 text-danger-600 border-danger-200 shadow-[inset_0_0_0_1px_rgba(245,63,63,0.14)]',
    normal: 'bg-warning-50 text-warning-600 border-warning-200',
    minor: 'bg-ink-50 text-ink-600 border-ink-200',
  };
  const labels: Record<ChangeSeverity, string> = {
    breaking: '破坏性',
    normal: '普通',
    minor: '轻微',
  };
  const dots: Record<ChangeSeverity, string> = {
    breaking: 'bg-danger-500',
    normal: 'bg-warning-500',
    minor: 'bg-ink-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[severity]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[severity])} />
      {labels[severity]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: WorkPriority }) {
  const styles: Record<WorkPriority, string> = {
    critical: 'bg-danger-500 text-white shadow-sm shadow-danger-500/30',
    high: 'bg-warning-500 text-white',
    medium: 'bg-brand-100 text-brand-700',
    low: 'bg-ink-100 text-ink-600',
  };
  const labels: Record<WorkPriority, string> = {
    critical: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold',
        styles[priority]
      )}
    >
      {labels[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkStatus }) {
  const styles: Record<WorkStatus, string> = {
    pending_review: 'bg-warning-50 text-warning-700 border-warning-200',
    in_progress: 'bg-brand-50 text-brand-700 border-brand-200',
    awaiting_verify: 'bg-success-50 text-success-700 border-success-200',
    closed: 'bg-ink-50 text-ink-500 border-ink-200',
  };
  const labels: Record<WorkStatus, string> = {
    pending_review: '待评审',
    in_progress: '处理中',
    awaiting_verify: '待验证',
    closed: '已关闭',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const styles: Record<SourceStatus, string> = {
    active: 'bg-success-50 text-success-700 border-success-200',
    paused: 'bg-warning-50 text-warning-700 border-warning-200',
    error: 'bg-danger-50 text-danger-700 border-danger-200',
  };
  const labels: Record<SourceStatus, string> = {
    active: '运行中',
    paused: '已暂停',
    error: '异常',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'active' && 'bg-success-500 animate-pulse-soft',
          status === 'paused' && 'bg-warning-500',
          status === 'error' && 'bg-danger-500 animate-pulse'
        )}
      />
      {labels[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: ChangeType }) {
  const styles: Record<ChangeType, string> = {
    added: 'bg-success-50 text-success-700 border-success-200',
    removed: 'bg-danger-50 text-danger-700 border-danger-200',
    modified: 'bg-brand-50 text-brand-700 border-brand-200',
  };
  const labels: Record<ChangeType, string> = {
    added: '新增',
    removed: '删除',
    modified: '修改',
  };
  const icons: Record<ChangeType, string> = {
    added: '+',
    removed: '−',
    modified: '~',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
        styles[type]
      )}
    >
      <span className="font-bold leading-none">{icons[type]}</span>
      {labels[type]}
    </span>
  );
}
