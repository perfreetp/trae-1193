import { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { mockUsers } from '@/mock/users';
import { formatFromNow } from '@/utils';
import type {
  ChangeSeverity,
  ChangeCategory,
  ChannelType,
  AlertRule,
  NotificationChannel,
} from '@/types';
import {
  Plus,
  BellRing,
  Mail,
  MessageCircle,
  MessageSquare,
  Smartphone,
  Users,
  AlertTriangle,
  Power,
  X,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const severityLabels: Record<ChangeSeverity, string> = {
  breaking: '破坏性',
  normal: '普通',
  minor: '轻微',
};

const categoryLabels: Record<ChangeCategory, string> = {
  path: '路径',
  parameter: '参数',
  field: '字段',
  statusCode: '状态码',
  auth: '鉴权',
  example: '示例',
};

const channelIcons: Record<ChannelType, LucideIcon> = {
  email: Mail,
  dingtalk: MessageCircle,
  feishu: MessageSquare,
  sms: Smartphone,
};

const channelLabels: Record<ChannelType, string> = {
  email: '邮件',
  dingtalk: '钉钉',
  feishu: '飞书',
  sms: '短信',
};

const channelColors: Record<ChannelType, string> = {
  email: 'text-brand-600 bg-brand-50',
  dingtalk: 'text-success-600 bg-success-50',
  feishu: 'text-brand-500 bg-brand-50',
  sms: 'text-warning-600 bg-warning-50',
};

const severityChipColors: Record<ChangeSeverity, string> = {
  breaking: 'bg-danger-50 text-danger-700 border border-danger-200',
  normal: 'bg-warning-50 text-warning-700 border border-warning-200',
  minor: 'bg-ink-50 text-ink-600 border border-ink-200',
};

const avatarGradients = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
  'from-lime-400 to-green-500',
  'from-cyan-400 to-sky-500',
];

const timeOptions = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      opts.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );
    }
  }
  return opts;
})();

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

function Avatar({
  name,
  size = 'sm',
  index = 0,
}: {
  name: string;
  size?: 'sm' | 'md';
  index?: number;
}) {
  const initial = name.slice(0, 1);
  const gradient = avatarGradients[index % avatarGradients.length];
  const sizeClass =
    size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white bg-gradient-to-br shadow-sm ring-2 ring-white',
        sizeClass,
        gradient,
      )}
    >
      {initial}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
        checked ? 'bg-brand-500' : 'bg-ink-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

interface FormState {
  name: string;
  severities: ChangeSeverity[];
  categories: ChangeCategory[];
  sources: string[];
  channelEnabled: Record<ChannelType, boolean>;
  channelConfigs: Record<ChannelType, Record<string, string>>;
  subscribers: string[];
  quietEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  quietMerge: boolean;
  enabled: boolean;
}

const defaultChannelConfig: Record<ChannelType, Record<string, string>> = {
  email: { recipients: '' },
  dingtalk: { webhookUrl: '' },
  feishu: { webhookUrl: '' },
  sms: { phones: '' },
};

function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  renderOption,
  renderValue,
}: {
  label: string;
  options: { id: string; [k: string]: unknown }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  renderOption: (opt: { id: string; [k: string]: unknown }) => React.ReactNode;
  renderValue?: (ids: string[]) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-ink-600">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="input-field flex w-full items-center justify-between text-left"
        >
          <div className="min-w-0 flex-1">
            {value.length === 0 ? (
              <span className="text-ink-400">{placeholder}</span>
            ) : renderValue ? (
              renderValue(value)
            ) : (
              <span className="text-ink-700">
                已选择 {value.length} 项
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'ml-2 h-4 w-4 shrink-0 text-ink-400 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <div className="absolute z-40 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-ink-100 bg-white p-1.5 shadow-cardHover animate-fade-in">
              {options.map((opt) => {
                const selected = value.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      selected
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        selected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-ink-200',
                      )}
                    >
                      {selected && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">{renderOption(opt)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
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

  const Icon = toast.type === 'success' ? Check : toast.type === 'error' ? AlertTriangle : AlertTriangle;

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

export default function Alerts() {
  const sources = useAppStore((s) => s.sources);
  const { alertRules, toggleAlertRule, addAlertRule, updateAlertRule, setAlertRuleLastTested } =
    useAppStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [subscriberModalId, setSubscriberModalId] = useState<string | null>(
    null,
  );
  const [subscriberDraft, setSubscriberDraft] = useState<string[]>([]);
  const [tmpLastTestedAt, setTmpLastTestedAt] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const emptyForm: FormState = {
    name: '',
    severities: [],
    categories: [],
    sources: [],
    channelEnabled: {
      email: false,
      dingtalk: false,
      feishu: false,
      sms: false,
    },
    channelConfigs: JSON.parse(JSON.stringify(defaultChannelConfig)),
    subscribers: [],
    quietEnabled: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    quietMerge: false,
    enabled: true,
  };

  const [form, setForm] = useState<FormState>(emptyForm);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push('请填写规则名称');
    if (form.severities.length === 0) errors.push('请至少选择 1 个变更级别');
    if (form.categories.length === 0) errors.push('请至少选择 1 个变更类别');
    const channelCount = Object.values(form.channelEnabled).filter(Boolean).length;
    if (channelCount === 0) errors.push('请至少配置 1 个通知渠道');
    return { valid: errors.length === 0, errors };
  }, [form]);

  function toggleArray<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function openCreate() {
    setForm(emptyForm);
    setTmpLastTestedAt(null);
    setCreateOpen(true);
  }

  function handleSendTest() {
    const enabledChannels = (Object.keys(form.channelEnabled) as ChannelType[]).filter(
      (t) => form.channelEnabled[t],
    );
    if (enabledChannels.length === 0 || form.subscribers.length === 0) {
      pushToast('error', '请先配置至少一个通知渠道和订阅人');
      return;
    }

    setTestSending(true);
    setTimeout(() => {
      setTestSending(false);
      const parts: string[] = [];
      enabledChannels.forEach((t) => {
        if (t === 'email') {
          const count = form.subscribers.length;
          parts.push(`邮件(${count}人)`);
        } else {
          parts.push(`${channelLabels[t]}群`);
        }
      });
      pushToast('success', `测试通知已发送至：${parts.join('、')}`);
      setTmpLastTestedAt(new Date().toISOString());
    }, 1500);
  }

  function submitCreate() {
    if (!validation.valid) return;

    const channels: NotificationChannel[] = [];
    (Object.keys(form.channelEnabled) as ChannelType[]).forEach((type) => {
      if (form.channelEnabled[type]) {
        channels.push({
          type,
          config: form.channelConfigs[type],
        });
      }
    });

    const rule: AlertRule = {
      id: 'ar' + Date.now().toString(36),
      name: form.name.trim(),
      enabled: form.enabled,
      triggers: {
        severities: form.severities,
        categories: form.categories,
        sources: form.sources.length ? form.sources : undefined,
      },
      channels,
      subscribers: form.subscribers,
      quietHours: form.quietEnabled
        ? {
            start: form.quietStart,
            end: form.quietEnd,
            mergeDigests: form.quietMerge,
          }
        : undefined,
      createdAt: new Date().toISOString(),
      createdBy: '林若曦',
      lastTestedAt: tmpLastTestedAt ?? undefined,
    };

    addAlertRule(rule);
    pushToast('success', '提醒规则创建成功');
    setCreateOpen(false);
  }

  function openSubscriberModal(ruleId: string, subs: string[]) {
    setSubscriberModalId(ruleId);
    setSubscriberDraft([...subs]);
  }

  function saveSubscribers() {
    if (!subscriberModalId) return;
    updateAlertRule(subscriberModalId, { subscribers: subscriberDraft });
    pushToast('success', '订阅人已更新');
    setSubscriberModalId(null);
  }

  function handleRetest(ruleId: string) {
    const now = new Date().toISOString();
    setAlertRuleLastTested(ruleId, now);
    pushToast('success', '测试通知已重发');
  }

  const userMap = useMemo(() => {
    const m: Record<string, (typeof mockUsers)[number]> = {};
    mockUsers.forEach((u) => (m[u.id] = u));
    return m;
  }, []);

  const editingRule =
    subscriberModalId != null
      ? alertRules.find((r) => r.id === subscriberModalId)
      : null;

  return (
    <PageContainer
      title="提醒规则"
      description="配置 API 变更的自动告警策略，多渠道通知相关负责人"
      actions={
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} strokeWidth={1.8} />
          新建规则
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <BellRing
                className="text-brand-600"
                size={16}
                strokeWidth={1.8}
              />
            </div>
            <span className="text-sm font-medium text-ink-500">规则总数</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {alertRules.length}
            <span className="ml-2 text-xs font-normal text-ink-400">条</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
              <Power className="text-success-600" size={16} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-ink-500">已启用</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {alertRules.filter((r) => r.enabled).length}
            <span className="ml-2 text-xs font-normal text-ink-400">条</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
              <AlertTriangle
                className="text-warning-600"
                size={16}
                strokeWidth={1.8}
              />
            </div>
            <span className="text-sm font-medium text-ink-500">
              高危变更监控
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-700">
            {
              alertRules.filter((r) =>
                r.triggers.severities.includes('breaking'),
              ).length
            }
            <span className="ml-2 text-xs font-normal text-ink-400">
              条规则
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {alertRules.map((rule) => {
          const subUsers = rule.subscribers
            .map((id) => userMap[id])
            .filter(Boolean);
          const shownAvatars = subUsers.slice(0, 4);
          const moreCount = subUsers.length - shownAvatars.length;

          return (
            <div
              key={rule.id}
              className={cn(
                'glass-card transition-all overflow-hidden',
                !rule.enabled && 'opacity-60',
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                        rule.enabled
                          ? 'bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm'
                          : 'bg-ink-100',
                      )}
                    >
                      <BellRing
                        className={cn(
                          'transition-colors',
                          rule.enabled ? 'text-white' : 'text-ink-400',
                        )}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink-700 truncate">
                        {rule.name}
                      </h3>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {rule.createdBy} ·{' '}
                        {new Date(rule.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAlertRule(rule.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                      rule.enabled ? 'bg-brand-500' : 'bg-ink-200',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                        rule.enabled ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-ink-50/60 px-3 py-2 border border-ink-100">
                  {rule.lastTestedAt ? (
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-success-500" />
                      <span className="text-ink-600">
                        最近测试：{formatFromNow(rule.lastTestedAt)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle className="h-4 w-4 text-ink-400" />
                      <span className="text-ink-400">尚未测试</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleRetest(rule.id)}
                    className="btn-ghost px-2 py-1 text-xs"
                  >
                    再测一次
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">
                    触发条件
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.triggers.severities.map((s) => (
                      <span
                        key={s}
                        className={cn('chip', severityChipColors[s])}
                      >
                        {severityLabels[s]}
                      </span>
                    ))}
                    {rule.triggers.categories.map((c) => (
                      <span
                        key={c}
                        className="chip bg-brand-50 text-brand-700 border border-brand-200"
                      >
                        {categoryLabels[c]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  {rule.channels.map((ch, idx) => {
                    const Icon = channelIcons[ch.type];
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg',
                          channelColors[ch.type],
                        )}
                        title={channelLabels[ch.type]}
                      >
                        <Icon size={13} strokeWidth={1.8} />
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-ink-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex -space-x-2">
                        {shownAvatars.map((u, i) => (
                          <Avatar
                            key={u.id}
                            name={u?.name ?? u.id}
                            index={i}
                          />
                        ))}
                        {moreCount > 0 && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-500 ring-2 ring-white">
                            +{moreCount}
                          </div>
                        )}
                        {subUsers.length === 0 && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-[11px] font-medium text-ink-400 ring-2 ring-white">
                            <Users size={12} strokeWidth={1.8} />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-ink-600 whitespace-nowrap">
                        {rule.subscribers.length} 人订阅
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        openSubscriberModal(rule.id, rule.subscribers)
                      }
                      className="shrink-0 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      管理
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-700">
                  新建提醒规则
                </h2>
                <p className="mt-1 text-xs text-ink-400">
                  配置触发条件、通知渠道及订阅人
                </p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-600">
                  规则名称 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：破坏性变更紧急推送"
                  className="input-field w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink-600">
                  变更级别触发 <span className="text-danger-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    ['breaking', 'normal', 'minor'] as ChangeSeverity[]
                  ).map((s) => {
                    const active = form.severities.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            severities: toggleArray(form.severities, s),
                          })
                        }
                        className={cn(
                          'chip cursor-pointer transition-all',
                          active
                            ? severityChipColors[s] + ' ring-2 ring-offset-1 ring-offset-white shadow-sm'
                            : 'bg-ink-50 text-ink-500 border border-ink-200 hover:bg-ink-100',
                          active && ['breaking'].includes(s)
                            ? 'ring-danger-300'
                            : active && ['normal'].includes(s)
                              ? 'ring-warning-300'
                              : active
                                ? 'ring-ink-300'
                                : '',
                        )}
                      >
                        {severityLabels[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink-600">
                  变更类别触发 <span className="text-danger-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'path',
                      'parameter',
                      'field',
                      'statusCode',
                      'auth',
                      'example',
                    ] as ChangeCategory[]
                  ).map((c) => {
                    const active = form.categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            categories: toggleArray(form.categories, c),
                          })
                        }
                        className={cn(
                          'chip cursor-pointer transition-all',
                          active
                            ? 'bg-brand-50 text-brand-700 border border-brand-200 ring-2 ring-brand-200 ring-offset-1 ring-offset-white shadow-sm'
                            : 'bg-ink-50 text-ink-500 border border-ink-200 hover:bg-ink-100',
                        )}
                      >
                        {categoryLabels[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink-600">
                  作用接口源{' '}
                  <span className="text-ink-400 font-normal">
                    （可选，未选=全部）
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src) => {
                    const active = form.sources.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            sources: toggleArray(form.sources, src.id),
                          })
                        }
                        className={cn(
                          'chip cursor-pointer transition-all',
                          active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-2 ring-emerald-200 ring-offset-1 ring-offset-white shadow-sm'
                            : 'bg-ink-50 text-ink-500 border border-ink-200 hover:bg-ink-100',
                        )}
                      >
                        {src.name}
                      </button>
                    );
                  })}
                  {sources.length === 0 && (
                    <span className="text-xs text-ink-400">暂无可选的接口源</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-ink-600">
                  通知渠道 <span className="text-danger-500">*</span>
                </label>
                <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                  {(
                    ['email', 'dingtalk', 'feishu', 'sms'] as ChannelType[]
                  ).map((type) => {
                    const Icon = channelIcons[type];
                    const enabled = form.channelEnabled[type];
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-ink-100">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                channelColors[type],
                              )}
                            >
                              <Icon size={15} strokeWidth={1.8} />
                            </div>
                            <span className="text-sm font-medium text-ink-700">
                              {channelLabels[type]}
                            </span>
                          </div>
                          <Switch
                            checked={enabled}
                            onChange={(v) =>
                              setForm({
                                ...form,
                                channelEnabled: {
                                  ...form.channelEnabled,
                                  [type]: v,
                                },
                              })
                            }
                          />
                        </div>
                        {enabled && (
                          <div className="ml-2 space-y-2 rounded-lg border-l-2 border-brand-200 bg-white/60 pl-3 pr-2 py-2">
                            {type === 'email' && (
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-medium text-ink-500">
                                  收件人邮箱（多个用 ; 分隔）
                                </label>
                                <input
                                  type="text"
                                  value={form.channelConfigs.email.recipients}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      channelConfigs: {
                                        ...form.channelConfigs,
                                        email: {
                                          ...form.channelConfigs.email,
                                          recipients: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  placeholder="a@corp.com; b@corp.com"
                                  className="input-field w-full"
                                />
                              </div>
                            )}
                            {(type === 'dingtalk' || type === 'feishu') && (
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-medium text-ink-500">
                                  Webhook URL
                                </label>
                                <input
                                  type="text"
                                  value={
                                    form.channelConfigs[type].webhookUrl ?? ''
                                  }
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      channelConfigs: {
                                        ...form.channelConfigs,
                                        [type]: {
                                          ...form.channelConfigs[type],
                                          webhookUrl: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  placeholder={`请输入${channelLabels[type]}机器人 Webhook 地址`}
                                  className="input-field w-full"
                                />
                              </div>
                            )}
                            {type === 'sms' && (
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-medium text-ink-500">
                                  接收手机号（多个用 , 分隔）
                                </label>
                                <input
                                  type="text"
                                  value={form.channelConfigs.sms.phones ?? ''}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      channelConfigs: {
                                        ...form.channelConfigs,
                                        sms: {
                                          ...form.channelConfigs.sms,
                                          phones: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  placeholder="13800000001, 13800000002"
                                  className="input-field w-full"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-ink-200">
                <div className="mb-3 flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-brand-500" />
                  <span className="text-xs font-semibold text-ink-700">发送测试通知</span>
                  {tmpLastTestedAt && (
                    <span className="text-[11px] text-success-600 ml-auto">
                      ✓ 已测试
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={testSending}
                  className={cn(
                    'btn-secondary w-full',
                    testSending && 'cursor-not-allowed opacity-70',
                  )}
                >
                  {testSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在发送...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      发送测试通知
                    </>
                  )}
                </button>
              </div>

              <MultiSelectDropdown
                label="订阅人"
                options={mockUsers as unknown as { id: string; [k: string]: unknown }[]}
                value={form.subscribers}
                onChange={(v) => setForm({ ...form, subscribers: v })}
                placeholder="请选择订阅人"
                renderOption={(opt) => {
                  const u = userMap[opt.id];
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        name={u?.name ?? opt.id}
                        index={mockUsers.findIndex((x) => x.id === opt.id)}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-700">
                          {u?.name}
                        </div>
                        <div className="text-[11px] text-ink-400 truncate">
                          {u?.department}
                        </div>
                      </div>
                    </div>
                  );
                }}
                renderValue={(ids) => (
                  <div className="flex items-center gap-1">
                    {ids.slice(0, 3).map((id, i) => (
                      <Avatar
                        key={id}
                        name={userMap[id]?.name ?? id}
                        index={mockUsers.findIndex((x) => x.id === id)}
                      />
                    ))}
                    {ids.length > 3 && (
                      <span className="text-xs text-ink-500">
                        +{ids.length - 3}
                      </span>
                    )}
                    <span className="ml-1 text-xs text-ink-600">
                      共 {ids.length} 人
                    </span>
                  </div>
                )}
              />

              <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink-700">
                      启用静默期
                    </div>
                    <div className="text-[11px] text-ink-400">
                      在设定时间段内暂缓推送
                    </div>
                  </div>
                  <Switch
                    checked={form.quietEnabled}
                    onChange={(v) => setForm({ ...form, quietEnabled: v })}
                  />
                </div>
                {form.quietEnabled && (
                  <div className="space-y-3 rounded-lg border border-ink-100 bg-white p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-ink-500">
                          静默开始
                        </label>
                        <select
                          value={form.quietStart}
                          onChange={(e) =>
                            setForm({ ...form, quietStart: e.target.value })
                          }
                          className="input-field w-full"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-ink-500">
                          静默结束
                        </label>
                        <select
                          value={form.quietEnd}
                          onChange={(e) =>
                            setForm({ ...form, quietEnd: e.target.value })
                          }
                          className="input-field w-full"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2">
                      <div>
                        <div className="text-xs font-medium text-ink-700">
                          夜间合并为摘要通知
                        </div>
                        <div className="text-[11px] text-ink-400">
                          静默期的多条告警汇总为一条
                        </div>
                      </div>
                      <Switch
                        checked={form.quietMerge}
                        onChange={(v) => setForm({ ...form, quietMerge: v })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-ink-700">
                    启用状态
                  </div>
                  <div className="text-[11px] text-ink-400">
                    保存后是否立即生效
                  </div>
                </div>
                <Switch
                  checked={form.enabled}
                  onChange={(v) => setForm({ ...form, enabled: v })}
                />
              </div>

              {!validation.valid && (
                <div className="space-y-1 rounded-xl border border-danger-200 bg-danger-50 p-3">
                  {validation.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-danger-600"
                    >
                      <AlertTriangle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        strokeWidth={2}
                      />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="btn-ghost"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitCreate}
                disabled={!validation.valid}
                className={cn(
                  'btn-primary',
                  !validation.valid &&
                    'cursor-not-allowed opacity-50 pointer-events-none',
                )}
              >
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriberModalId != null && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setSubscriberModalId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/85 p-5 shadow-2xl backdrop-blur-xl animate-fade-in-up">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-700">
                  订阅人维护
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 truncate">
                  规则：{editingRule.name}
                </p>
              </div>
              <button
                onClick={() => setSubscriberModalId(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mb-4 max-h-80 space-y-1 overflow-y-auto pr-1">
              {mockUsers.map((u) => {
                const idx = mockUsers.findIndex((x) => x.id === u.id);
                const selected = subscriberDraft.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() =>
                      setSubscriberDraft(
                        subscriberDraft.includes(u.id)
                          ? subscriberDraft.filter((x) => x !== u.id)
                          : [...subscriberDraft, u.id],
                      )
                    }
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                      selected
                        ? 'bg-brand-50 ring-1 ring-brand-200'
                        : 'hover:bg-ink-50',
                    )}
                  >
                    <Avatar name={u.name} size="md" index={idx} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink-700">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        {u.department} · {u.email}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                        selected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-ink-200',
                      )}
                    >
                      {selected && (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
              已选择 <span className="font-semibold text-brand-600">{subscriberDraft.length}</span> 人
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
              <button
                type="button"
                onClick={() => setSubscriberModalId(null)}
                className="btn-ghost"
              >
                取消
              </button>
              <button type="button" onClick={saveSubscribers} className="btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </PageContainer>
  );
}
