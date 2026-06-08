import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Upload,
  Play,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  AlertTriangle,
  FileUp,
} from 'lucide-react';
import { mockSources } from '@/mock/sources';
import { mockUsers } from '@/mock/users';
import type { ApiSource, SourceStatus, AuthType } from '@/types';
import { formatFromNow, cronToHuman } from '@/utils';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const sourceStatusConfig: Record<SourceStatus, { label: string; className: string; dotClass: string }> = {
  active: {
    label: '运行中',
    className: 'bg-success-50 text-success-600 border-success-200',
    dotClass: 'bg-success-400',
  },
  paused: {
    label: '已暂停',
    className: 'bg-warning-50 text-warning-500 border-warning-200',
    dotClass: 'bg-warning-400',
  },
  error: {
    label: '异常',
    className: 'bg-danger-50 text-danger-500 border-danger-200',
    dotClass: 'bg-danger-400',
  },
};

function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const config = sourceStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}

const authTypeLabels: Record<AuthType, string> = {
  none: '无鉴权',
  bearer: 'Bearer Token',
  apikey: 'API Key',
  oauth2: 'OAuth 2.0',
};

const authTypeClass: Record<AuthType, string> = {
  none: 'bg-ink-50 text-ink-500',
  bearer: 'bg-brand-50 text-brand-700',
  apikey: 'bg-warning-50 text-warning-500',
  oauth2: 'bg-success-50 text-success-600',
};

const SYSTEM_OPTIONS = [
  '支付中台',
  '用户中心',
  '商品中心',
  '营销中心',
  '风控中心',
  '物流中心',
  '其他',
];

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: '无鉴权' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'apikey', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

const SCAN_SCHEDULE_OPTIONS: { label: string; cron: string }[] = [
  { label: '每小时', cron: '0 0 * * * *' },
  { label: '每 6 小时', cron: '0 0 */6 * * *' },
  { label: '每 12 小时', cron: '0 0 */12 * * *' },
  { label: '每天 23:00', cron: '0 0 23 * * *' },
  { label: '仅手动触发', cron: '' },
];

const cronToLabel = (cron: string): string => {
  if (!cron) return '仅手动触发';
  const match = SCAN_SCHEDULE_OPTIONS.find((o) => o.cron === cron);
  if (match) return match.label;
  return cronToHuman(cron);
};

const SPEC_FORMATS = [
  { value: 'openapi3', label: 'OpenAPI 3.x' },
  { value: 'swagger2', label: 'Swagger 2.0' },
  { value: 'postman', label: 'Postman' },
  { value: 'markdown', label: 'Markdown' },
];

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface FormErrors {
  name?: string;
  system?: string;
  baseUrl?: string;
  authType?: string;
  owner?: string;
  scanSchedule?: string;
}

function ModalOverlay({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className={cn(
            'relative z-10 w-full max-w-xl rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60',
            className,
          )}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100/60 px-6 py-4">
      <h2 className="font-display text-lg font-semibold text-ink-700">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="btn-ghost h-8 w-8 p-0 text-ink-400 hover:text-ink-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-[11px] font-medium text-danger-500">{error}</p>
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
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 50, y: 10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[260px]',
        bgClass,
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
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
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SourceFormData {
  name: string;
  system: string;
  baseUrl: string;
  authType: AuthType;
  owner: string;
  scanSchedule: string;
}

function validateSourceForm(data: SourceFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = '请输入接口源名称';
  if (!data.system) errors.system = '请选择所属系统';
  if (!data.baseUrl.trim()) errors.baseUrl = '请输入接口基地址';
  else if (!/^https?:\/\/.+/i.test(data.baseUrl.trim()))
    errors.baseUrl = '请输入合法的 URL（以 http:// 或 https:// 开头）';
  if (!data.owner) errors.owner = '请选择负责人';
  return errors;
}

function NewSourceModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const addSource = useAppStore((s) => s.addSource);
  const [form, setForm] = useState<SourceFormData>({
    name: '',
    system: '',
    baseUrl: '',
    authType: 'none',
    owner: '',
    scanSchedule: '0 0 */6 * * *',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        system: '',
        baseUrl: '',
        authType: 'none',
        owner: '',
        scanSchedule: '0 0 */6 * * *',
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const allErrors = validateSourceForm(form);
  const canSubmit = Object.keys(allErrors).length === 0 && !submitting;

  const handleSubmit = () => {
    const errs = validateSourceForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    const now = new Date().toISOString();
    const apiCount = Math.floor(Math.random() * 69) + 12;
    const newSource: ApiSource = {
      id: 'src' + Date.now().toString(36),
      name: form.name.trim(),
      system: form.system,
      baseUrl: form.baseUrl.trim(),
      authType: form.authType,
      owner: form.owner,
      status: 'active',
      lastScanAt: now,
      currentVersion: '1.0.0',
      apiCount,
      createdAt: now,
      scanSchedule: form.scanSchedule,
    };
    setTimeout(() => {
      addSource(newSource);
      setSubmitting(false);
      onSuccess('新建接口源成功');
      onClose();
    }, 500);
  };

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="新建接口源" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            名称 <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="如：支付中台-订单服务"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
          />
          <FieldError error={errors.name || (!form.name.trim() ? undefined : undefined)} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            所属系统 <span className="text-danger-500">*</span>
          </label>
          <select
            className="input-field"
            value={form.system}
            onChange={(e) => {
              setForm({ ...form, system: e.target.value });
              if (errors.system) setErrors({ ...errors, system: undefined });
            }}
          >
            <option value="">请选择所属系统</option>
            {SYSTEM_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <FieldError error={errors.system} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            接口基地址 <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="https://api.corp.com/xxx/v1"
            value={form.baseUrl}
            onChange={(e) => {
              setForm({ ...form, baseUrl: e.target.value });
              if (errors.baseUrl) setErrors({ ...errors, baseUrl: undefined });
            }}
          />
          <FieldError error={errors.baseUrl} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">鉴权方式</label>
          <div className="flex flex-wrap gap-2">
            {AUTH_TYPES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setForm({ ...form, authType: a.value })}
                className={cn(
                  'chip-outline chip transition-all',
                  form.authType === a.value &&
                    'bg-brand-50 text-brand-700 border-brand-200',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            负责人 <span className="text-danger-500">*</span>
          </label>
          <select
            className="input-field"
            value={form.owner}
            onChange={(e) => {
              setForm({ ...form, owner: e.target.value });
              if (errors.owner) setErrors({ ...errors, owner: undefined });
            }}
          >
            <option value="">请选择负责人</option>
            {mockUsers.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}（{u.department}）
              </option>
            ))}
          </select>
          <FieldError error={errors.owner} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">扫描计划</label>
          <select
            className="input-field"
            value={form.scanSchedule}
            onChange={(e) => setForm({ ...form, scanSchedule: e.target.value })}
          >
            {SCAN_SCHEDULE_OPTIONS.map((o) => (
              <option key={o.cron} value={o.cron}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中
            </>
          ) : (
            '保存'
          )}
        </button>
      </div>
    </ModalOverlay>
  );
}

function EditSourceModal({
  open,
  source,
  onClose,
  onSuccess,
}: {
  open: boolean;
  source: ApiSource | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const updateSource = useAppStore((s) => s.updateSource);
  const [form, setForm] = useState<SourceFormData>({
    name: '',
    system: '',
    baseUrl: '',
    authType: 'none',
    owner: '',
    scanSchedule: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && source) {
      setForm({
        name: source.name,
        system: source.system,
        baseUrl: source.baseUrl,
        authType: source.authType,
        owner: source.owner,
        scanSchedule: source.scanSchedule,
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [open, source]);

  const allErrors = validateSourceForm(form);
  const canSubmit = Object.keys(allErrors).length === 0 && !submitting;

  const handleSubmit = () => {
    const errs = validateSourceForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !source) return;

    setSubmitting(true);
    setTimeout(() => {
      updateSource(source.id, {
        name: form.name.trim(),
        system: form.system,
        baseUrl: form.baseUrl.trim(),
        authType: form.authType,
        owner: form.owner,
        scanSchedule: form.scanSchedule,
      });
      setSubmitting(false);
      onSuccess('编辑成功');
      onClose();
    }, 400);
  };

  if (!open || !source) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="编辑接口源" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            名称 <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
          />
          <FieldError error={errors.name} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            所属系统 <span className="text-danger-500">*</span>
          </label>
          <select
            className="input-field"
            value={form.system}
            onChange={(e) => {
              setForm({ ...form, system: e.target.value });
              if (errors.system) setErrors({ ...errors, system: undefined });
            }}
          >
            <option value="">请选择所属系统</option>
            {SYSTEM_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <FieldError error={errors.system} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            接口基地址 <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            value={form.baseUrl}
            onChange={(e) => {
              setForm({ ...form, baseUrl: e.target.value });
              if (errors.baseUrl) setErrors({ ...errors, baseUrl: undefined });
            }}
          />
          <FieldError error={errors.baseUrl} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">鉴权方式</label>
          <div className="flex flex-wrap gap-2">
            {AUTH_TYPES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setForm({ ...form, authType: a.value })}
                className={cn(
                  'chip-outline chip transition-all',
                  form.authType === a.value &&
                    'bg-brand-50 text-brand-700 border-brand-200',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">
            负责人 <span className="text-danger-500">*</span>
          </label>
          <select
            className="input-field"
            value={form.owner}
            onChange={(e) => {
              setForm({ ...form, owner: e.target.value });
              if (errors.owner) setErrors({ ...errors, owner: undefined });
            }}
          >
            <option value="">请选择负责人</option>
            {mockUsers.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}（{u.department}）
              </option>
            ))}
          </select>
          <FieldError error={errors.owner} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">扫描计划</label>
          <select
            className="input-field"
            value={form.scanSchedule}
            onChange={(e) => setForm({ ...form, scanSchedule: e.target.value })}
          >
            {SCAN_SCHEDULE_OPTIONS.map((o) => (
              <option key={o.cron} value={o.cron}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中
            </>
          ) : (
            '保存'
          )}
        </button>
      </div>
    </ModalOverlay>
  );
}

function ImportDocModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const addSource = useAppStore((s) => s.addSource);
  const [format, setFormat] = useState<string>('openapi3');
  const [fileName, setFileName] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [importMode, setImportMode] = useState<'overwrite' | 'addonly'>('addonly');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormat('openapi3');
      setFileName('');
      setBaseUrl('');
      setOwner('');
      setImportMode('addonly');
      setImporting(false);
    }
  }, [open]);

  const canSubmit =
    !!fileName.trim() &&
    !!baseUrl.trim() &&
    /^https?:\/\/.+/i.test(baseUrl.trim()) &&
    !!owner &&
    !importing;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    setImporting(true);
    setTimeout(() => {
      const apiCount = Math.floor(Math.random() * 81) + 20;
      const patchVersion = Math.floor(Math.random() * 20);
      const now = new Date().toISOString();
      const newSource: ApiSource = {
        id: 'src' + Date.now().toString(36),
        name: fileName.replace(/\.[^.]+$/, '') + '-导入',
        system: '其他',
        baseUrl: baseUrl.trim(),
        authType: 'none',
        owner,
        status: 'active',
        lastScanAt: now,
        currentVersion: `1.0.${patchVersion}`,
        apiCount,
        createdAt: now,
        scanSchedule: '',
      };
      addSource(newSource);
      setImporting(false);
      onSuccess(`导入成功，新增 ${apiCount} 个接口`);
      onClose();
    }, 2000);
  };

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose} className="max-w-2xl">
      <ModalHeader title="导入文档" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">文档格式</label>
          <div className="flex flex-wrap gap-2">
            {SPEC_FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={cn(
                  'chip-outline chip transition-all',
                  format === f.value &&
                    'bg-brand-50 text-brand-700 border-brand-200',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">选择文件</label>
          <div
            onClick={handleFileSelect}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-6 py-8 transition-all hover:border-brand-300 hover:bg-brand-50/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-ink-100">
              <FileUp className="h-6 w-6 text-brand-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-600">
                {fileName ? fileName : '拖拽文件到此处，或'}
                <span className="ml-1 text-brand-600 underline-offset-2 hover:underline">
                  点击选择文件
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-400">
                支持 .json / .yaml / .yml / .md，单文件最大 20MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".json,.yaml,.yml,.md"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">
              接口基地址 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="https://api.corp.com/xxx/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            {baseUrl && !/^https?:\/\/.+/i.test(baseUrl.trim()) && (
              <FieldError error="请输入合法的 URL" />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">
              负责人 <span className="text-danger-500">*</span>
            </label>
            <select
              className="input-field"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">请选择负责人</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">导入方式</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportMode('overwrite')}
              className={cn(
                'chip-outline chip transition-all',
                importMode === 'overwrite' &&
                  'bg-brand-50 text-brand-700 border-brand-200',
              )}
            >
              覆盖同名接口
            </button>
            <button
              type="button"
              onClick={() => setImportMode('addonly')}
              className={cn(
                'chip-outline chip transition-all',
                importMode === 'addonly' &&
                  'bg-brand-50 text-brand-700 border-brand-200',
              )}
            >
              仅新增
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={importing}
        >
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              导入中...
            </>
          ) : (
            '开始导入'
          )}
        </button>
      </div>
    </ModalOverlay>
  );
}

function ConfirmDeleteModal({
  open,
  source,
  onClose,
  onSuccess,
}: {
  open: boolean;
  source: ApiSource | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const removeSource = useAppStore((s) => s.removeSource);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) setDeleting(false);
  }, [open]);

  const handleDelete = () => {
    if (!source) return;
    setDeleting(true);
    setTimeout(() => {
      removeSource(source.id);
      setDeleting(false);
      onSuccess('删除成功');
      onClose();
    }, 400);
  };

  if (!open || !source) return null;

  return (
    <ModalOverlay onClose={onClose} className="max-w-md">
      <ModalHeader title="确认删除" onClose={onClose} />
      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-50">
            <AlertTriangle className="h-5 w-5 text-danger-500" />
          </div>
          <div>
            <p className="text-sm text-ink-600 leading-relaxed">
              确认要删除「
              <span className="font-semibold text-ink-700">{source.name}</span>
              」接口源吗？此操作不可撤销。
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={deleting}
        >
          取消
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              删除中
            </>
          ) : (
            '删除'
          )}
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function Sources() {
  const { sources, addSource, updateSource, removeSource } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editSource, setEditSource] = useState<ApiSource | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteSource, setDeleteSource] = useState<ApiSource | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const systems = useMemo(() => {
    const set = new Set(sources.map((s) => s.system));
    return Array.from(set);
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.baseUrl.toLowerCase().includes(search.toLowerCase()) ||
        s.owner.includes(search);
      const matchSystem = !activeSystem || s.system === activeSystem;
      return matchSearch && matchSystem;
    });
  }, [sources, search, activeSystem]);

  const handleScan = (id: string) => {
    if (scanningId) return;
    setScanningId(id);
    setTimeout(() => {
      updateSource(id, {
        lastScanAt: new Date().toISOString(),
        status: 'active',
      });
      setScanningId(null);
    }, 1500);
  };

  const handleEdit = (src: ApiSource) => {
    setEditSource(src);
    setEditOpen(true);
  };

  const handleDelete = (src: ApiSource) => {
    setDeleteSource(src);
    setDeleteOpen(true);
  };

  return (
    <div className="min-h-screen p-6 gradient-mesh-bg">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-700">接口源管理</h1>
            <p className="mt-1 text-sm text-ink-400">
              管理接入的 API 文档源，配置扫描与鉴权方式
            </p>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                placeholder="搜索名称、基地址、负责人..."
                className="input-field pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSystem(null)}
                className={cn(
                  'chip-outline chip transition-all',
                  !activeSystem && 'bg-brand-50 text-brand-700 border-brand-200',
                )}
              >
                全部
              </button>
              {systems.map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setActiveSystem(sys)}
                  className={cn(
                    'chip-outline chip transition-all',
                    activeSystem === sys &&
                      'bg-brand-50 text-brand-700 border-brand-200',
                  )}
                >
                  {sys}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                导入文档
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setNewSourceOpen(true)}
              >
                <Plus className="h-4 w-4" />
                新建接口源
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>所属系统</th>
                  <th>基地址</th>
                  <th>鉴权方式</th>
                  <th>负责人</th>
                  <th>状态</th>
                  <th>接口数量</th>
                  <th>最近扫描</th>
                  <th className="w-28 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.map((src) => {
                  const isScanning = scanningId === src.id;
                  return (
                    <tr key={src.id} className="group">
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-ink-700">
                            {src.name}
                          </span>
                          <span className="text-xs text-ink-400">
                            v{src.currentVersion}
                          </span>
                        </div>
                      </td>
                      <td>{src.system}</td>
                      <td>
                        <code className="rounded bg-ink-50 px-2 py-1 text-xs text-ink-600 font-mono break-all">
                          {src.baseUrl}
                        </code>
                      </td>
                      <td>
                        <span className={cn('tag', authTypeClass[src.authType])}>
                          {authTypeLabels[src.authType]}
                        </span>
                      </td>
                      <td>{src.owner}</td>
                      <td>
                        {isScanning ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            扫描中
                          </span>
                        ) : (
                          <SourceStatusBadge status={src.status} />
                        )}
                      </td>
                      <td>
                        <span className="font-mono font-semibold text-ink-600">
                          {src.apiCount}
                        </span>
                      </td>
                      <td className="text-ink-500 text-sm">
                        {formatFromNow(src.lastScanAt)}
                        {src.scanSchedule && (
                          <div className="text-[11px] text-ink-400 mt-0.5">
                            {cronToLabel(src.scanSchedule)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            className={cn(
                              'btn-ghost h-8 w-8 p-0',
                              isScanning && 'text-brand-600 opacity-100',
                            )}
                            onClick={() => handleScan(src.id)}
                            disabled={isScanning}
                            title="立即扫描"
                          >
                            {isScanning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700"
                            title="编辑"
                            onClick={() => handleEdit(src)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost h-8 w-8 p-0 text-danger-500 hover:text-danger-600"
                            title="删除"
                            onClick={() => handleDelete(src)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSources.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-16 text-center text-ink-400"
                    >
                      暂无匹配的接口源
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewSourceModal
        open={newSourceOpen}
        onClose={() => setNewSourceOpen(false)}
        onSuccess={(msg) => pushToast('success', msg)}
      />

      <ImportDocModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={(msg) => pushToast('success', msg)}
      />

      <EditSourceModal
        open={editOpen}
        source={editSource}
        onClose={() => {
          setEditOpen(false);
          setEditSource(null);
        }}
        onSuccess={(msg) => pushToast('success', msg)}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        source={deleteSource}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteSource(null);
        }}
        onSuccess={(msg) => pushToast('success', msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
