import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Upload, Play, Pencil, Trash2, Loader2, X, Check,
  AlertTriangle, FileUp, Clock, Calendar, GitCompareArrows, FileJson,
  FileText, FileSpreadsheet, ArrowRight, ChevronDown, ArrowUpRight,
  ArrowDownRight, Minus, Zap, CalendarClock, ChevronRight, Ticket, Camera,
} from 'lucide-react';
import { mockSources } from '@/mock/sources';
import { mockUsers } from '@/mock/users';
import type { ApiSource, SourceStatus, AuthType, ScanTrigger, ImportDocType, ImportMode, ApiChange, HttpMethod, ChangeCategory, ChangeType, ChangeSeverity, ScanHistory, DiffSnapshot } from '@/types';
import { formatFromNow, cronToHuman, formatDateTime, formatDate } from '@/utils';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const sourceStatusConfig: Record<SourceStatus, { label: string; className: string; dotClass: string }> = {
  active: { label: '运行中', className: 'bg-success-50 text-success-600 border-success-200', dotClass: 'bg-success-400' },
  paused: { label: '已暂停', className: 'bg-warning-50 text-warning-500 border-warning-200', dotClass: 'bg-warning-400' },
  error: { label: '异常', className: 'bg-danger-50 text-danger-500 border-danger-200', dotClass: 'bg-danger-400' },
};

function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const config = sourceStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', config.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}

const authTypeLabels: Record<AuthType, string> = { none: '无鉴权', bearer: 'Bearer Token', apikey: 'API Key', oauth2: 'OAuth 2.0' };
const authTypeClass: Record<AuthType, string> = {
  none: 'bg-ink-50 text-ink-500',
  bearer: 'bg-brand-50 text-brand-700',
  apikey: 'bg-warning-50 text-warning-500',
  oauth2: 'bg-success-50 text-success-600',
};

const SYSTEM_OPTIONS = ['支付中台', '用户中心', '商品中心', '营销中心', '风控中心', '物流中心', '其他'];
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

const triggerConfig: Record<ScanTrigger, { label: string; icon: typeof Zap; className: string }> = {
  manual: { label: '手动触发', icon: Zap, className: 'text-brand-600' },
  scheduled: { label: '定时扫描', icon: CalendarClock, className: 'text-ink-500' },
  import: { label: '导入触发', icon: FileUp, className: 'text-success-600' },
};

const importModeConfig: Record<ImportMode, { label: string; className: string }> = {
  overwrite: { label: '覆盖', className: 'bg-danger-50 text-danger-600 border-danger-200' },
  append: { label: '追加', className: 'bg-success-50 text-success-600 border-success-200' },
  skip: { label: '跳过', className: 'bg-ink-50 text-ink-500 border-ink-200' },
};

const docTypeIcon: Record<ImportDocType, typeof FileJson> = {
  openapi3: FileJson, swagger2: FileJson, postman: FileSpreadsheet, markdown: FileText,
};

const FAIL_REASONS = [
  '连接超时：基地址 504 Gateway Timeout',
  '鉴权失败：Token 已过期或无效',
  '解析错误：JSON 格式不合法',
  '网络错误：无法连接到目标服务器',
  '限流触发：请求频率超过服务器限制',
];

const PATH_POOL = [
  '/v1/users/{id}', '/v1/users', '/v1/users/{id}/orders', '/v1/users/{id}/profile',
  '/v1/orders', '/v1/orders/{id}', '/v1/orders/{id}/items', '/v1/orders/{id}/payments',
  '/v1/products', '/v1/products/{id}', '/v1/products/search', '/v1/products/{id}/reviews',
  '/v1/categories', '/v1/categories/{id}/products', '/v1/auth/login', '/v1/auth/refresh',
  '/v1/cart', '/v1/cart/items', '/v1/checkout', '/v1/payments/{id}/refund',
];

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

type DetailSubTab = 'new' | 'modified' | 'removed' | 'breaking';

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let state = Math.abs(hash) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0x100000000;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateDescription(method: HttpMethod, endpoint: string, category: ChangeCategory, type: ChangeType): string {
  if (type === 'added') {
    if (category === 'path') return `${method} ${endpoint} 新增接口`;
    if (category === 'parameter') return `路径 ${endpoint} 新增必填参数 region`;
    if (category === 'field') return `${method} ${endpoint} 请求体新增字段 discount`;
    return `${method} ${endpoint} 新增 ${category}`;
  }
  if (type === 'removed') {
    if (category === 'path') return `${method} ${endpoint} 接口已删除`;
    if (category === 'field') return `${method} ${endpoint} 请求体移除字段 oldField`;
    if (category === 'parameter') return `路径 ${endpoint} 移除可选参数 verbose`;
    return `${method} ${endpoint} 删除 ${category}`;
  }
  if (type === 'modified') {
    if (category === 'field') return `${method} ${endpoint} 响应字段 price 类型由 integer 改为 number`;
    if (category === 'parameter') return `路径 ${endpoint} 参数 pageSize 默认值由 20 改为 50`;
    if (category === 'statusCode') return `${method} ${endpoint} 新增 429 状态码响应`;
    if (category === 'example') return `${method} ${endpoint} 示例响应已更新`;
    return `${method} ${endpoint} 修改 ${category}`;
  }
  return `${method} ${endpoint} 变更`;
}

function generateChangesForCategory(
  h: ScanHistory,
  source: ApiSource,
  category: DetailSubTab,
  count: number,
  versionFrom: string,
): ApiChange[] {
  const seed = h.id + '-' + category;
  const rand = seededRandom(seed);
  const changes: ApiChange[] = [];
  for (let i = 0; i < count; i++) {
    const endpoint = pick(PATH_POOL, rand);
    let method = pick(HTTP_METHODS, rand);
    let cat: ChangeCategory;
    let type: ChangeType;
    let severity: ChangeSeverity;

    if (category === 'new') {
      type = 'added';
      cat = 'path';
      severity = rand() < 0.3 ? 'minor' : 'normal';
    } else if (category === 'modified') {
      type = 'modified';
      const modCats: ChangeCategory[] = ['field', 'parameter', 'statusCode', 'example'];
      cat = pick(modCats, rand);
      severity = rand() < 0.4 ? 'minor' : 'normal';
      if (cat === 'field' && (method === 'GET' || method === 'DELETE')) method = pick(['PUT', 'POST', 'PATCH'], rand);
    } else if (category === 'removed') {
      type = 'removed';
      cat = 'path';
      severity = 'breaking';
    } else {
      type = rand() < 0.5 ? 'removed' : 'modified';
      const breakCats: ChangeCategory[] = ['auth', 'field', 'statusCode'];
      cat = pick(breakCats, rand);
      severity = 'breaking';
    }

    changes.push({
      id: `ch-${h.id}-${category}-${i}`,
      sourceId: source.id,
      versionFrom,
      versionTo: h.version,
      endpoint,
      method,
      category: cat,
      type,
      severity,
      description: generateDescription(method, endpoint, cat, type),
      detectedAt: h.scanAt,
    });
  }
  return changes;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: number; type: ToastType; message: string; }
interface FormErrors { name?: string; system?: string; baseUrl?: string; authType?: string; owner?: string; scanSchedule?: string; }
type DetailTab = 'scan' | 'import' | 'diff' | 'snapshot';

function incrementPatchVersion(version: string): string {
  const parts = version.replace('-beta', '').split('.');
  const major = parseInt(parts[0], 10) || 1;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;
  const suffix = version.includes('-beta') ? '-beta' : '';
  return `${major}.${minor}.${patch + 1}${suffix}`;
}

function ModalOverlay({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string; }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className={cn('relative z-10 w-full max-w-xl rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60', className)}
          initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void; }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100/60 px-6 py-4">
      <h2 className="font-display text-lg font-semibold text-ink-700">{title}</h2>
      <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 p-0 text-ink-400 hover:text-ink-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-[11px] font-medium text-danger-500">{error}</p>;
}

function Toast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void; }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
  const bgClass =
    toast.type === 'success' ? 'bg-success-50/95 border-success-200 text-success-700' :
    toast.type === 'error' ? 'bg-danger-50/95 border-danger-200 text-danger-700' :
    'bg-brand-50/95 border-brand-200 text-brand-700';
  const Icon = toast.type === 'success' ? Check : AlertTriangle;
  return (
    <motion.div
      layout initial={{ opacity: 0, x: 50, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 50, y: 10 }} transition={{ duration: 0.3 }}
      className={cn('pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[260px]', bgClass)}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void; }) {
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface SourceFormData { name: string; system: string; baseUrl: string; authType: AuthType; owner: string; scanSchedule: string; }

function validateSourceForm(data: SourceFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = '请输入接口源名称';
  if (!data.system) errors.system = '请选择所属系统';
  if (!data.baseUrl.trim()) errors.baseUrl = '请输入接口基地址';
  else if (!/^https?:\/\/.+/i.test(data.baseUrl.trim())) errors.baseUrl = '请输入合法的 URL';
  if (!data.owner) errors.owner = '请选择负责人';
  return errors;
}

function NewSourceModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (msg: string) => void; }) {
  const addSource = useAppStore((s) => s.addSource);
  const [form, setForm] = useState<SourceFormData>({ name: '', system: '', baseUrl: '', authType: 'none', owner: '', scanSchedule: '0 0 */6 * * *' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (open) { setForm({ name: '', system: '', baseUrl: '', authType: 'none', owner: '', scanSchedule: '0 0 */6 * * *' }); setErrors({}); setSubmitting(false); }
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
      id: 'src' + Date.now().toString(36), name: form.name.trim(), system: form.system, baseUrl: form.baseUrl.trim(),
      authType: form.authType, owner: form.owner, status: 'active', lastScanAt: now,
      currentVersion: '1.0.0', apiCount, createdAt: now, scanSchedule: form.scanSchedule,
    };
    setTimeout(() => { addSource(newSource); setSubmitting(false); onSuccess('新建接口源成功'); onClose(); }, 500);
  };
  if (!open) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="新建接口源" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">名称 <span className="text-danger-500">*</span></label>
          <input type="text" className="input-field" placeholder="如：支付中台-订单服务" value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }} />
          <FieldError error={errors.name} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">所属系统 <span className="text-danger-500">*</span></label>
          <select className="input-field" value={form.system}
            onChange={(e) => { setForm({ ...form, system: e.target.value }); if (errors.system) setErrors({ ...errors, system: undefined }); }}>
            <option value="">请选择所属系统</option>
            {SYSTEM_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <FieldError error={errors.system} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">接口基地址 <span className="text-danger-500">*</span></label>
          <input type="text" className="input-field" placeholder="https://api.corp.com/xxx/v1" value={form.baseUrl}
            onChange={(e) => { setForm({ ...form, baseUrl: e.target.value }); if (errors.baseUrl) setErrors({ ...errors, baseUrl: undefined }); }} />
          <FieldError error={errors.baseUrl} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">鉴权方式</label>
          <div className="flex flex-wrap gap-2">
            {AUTH_TYPES.map((a) => (
              <button key={a.value} type="button" onClick={() => setForm({ ...form, authType: a.value })}
                className={cn('chip-outline chip transition-all', form.authType === a.value && 'bg-brand-50 text-brand-700 border-brand-200')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">负责人 <span className="text-danger-500">*</span></label>
          <select className="input-field" value={form.owner}
            onChange={(e) => { setForm({ ...form, owner: e.target.value }); if (errors.owner) setErrors({ ...errors, owner: undefined }); }}>
            <option value="">请选择负责人</option>
            {mockUsers.map((u) => (<option key={u.id} value={u.name}>{u.name}（{u.department}）</option>))}
          </select>
          <FieldError error={errors.owner} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">扫描计划</label>
          <select className="input-field" value={form.scanSchedule} onChange={(e) => setForm({ ...form, scanSchedule: e.target.value })}>
            {SCAN_SCHEDULE_OPTIONS.map((o) => (<option key={o.cron} value={o.cron}>{o.label}</option>))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>取消</button>
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />保存中</>) : '保存'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function EditSourceModal({ open, source, onClose, onSuccess }: { open: boolean; source: ApiSource | null; onClose: () => void; onSuccess: (msg: string) => void; }) {
  const updateSource = useAppStore((s) => s.updateSource);
  const [form, setForm] = useState<SourceFormData>({ name: '', system: '', baseUrl: '', authType: 'none', owner: '', scanSchedule: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (open && source) {
      setForm({ name: source.name, system: source.system, baseUrl: source.baseUrl, authType: source.authType, owner: source.owner, scanSchedule: source.scanSchedule });
      setErrors({}); setSubmitting(false);
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
      updateSource(source.id, { name: form.name.trim(), system: form.system, baseUrl: form.baseUrl.trim(), authType: form.authType, owner: form.owner, scanSchedule: form.scanSchedule });
      setSubmitting(false); onSuccess('编辑成功'); onClose();
    }, 400);
  };
  if (!open || !source) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="编辑接口源" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">名称 <span className="text-danger-500">*</span></label>
          <input type="text" className="input-field" value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }} />
          <FieldError error={errors.name} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">所属系统 <span className="text-danger-500">*</span></label>
          <select className="input-field" value={form.system}
            onChange={(e) => { setForm({ ...form, system: e.target.value }); if (errors.system) setErrors({ ...errors, system: undefined }); }}>
            <option value="">请选择所属系统</option>
            {SYSTEM_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <FieldError error={errors.system} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">接口基地址 <span className="text-danger-500">*</span></label>
          <input type="text" className="input-field" value={form.baseUrl}
            onChange={(e) => { setForm({ ...form, baseUrl: e.target.value }); if (errors.baseUrl) setErrors({ ...errors, baseUrl: undefined }); }} />
          <FieldError error={errors.baseUrl} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">鉴权方式</label>
          <div className="flex flex-wrap gap-2">
            {AUTH_TYPES.map((a) => (
              <button key={a.value} type="button" onClick={() => setForm({ ...form, authType: a.value })}
                className={cn('chip-outline chip transition-all', form.authType === a.value && 'bg-brand-50 text-brand-700 border-brand-200')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">负责人 <span className="text-danger-500">*</span></label>
          <select className="input-field" value={form.owner}
            onChange={(e) => { setForm({ ...form, owner: e.target.value }); if (errors.owner) setErrors({ ...errors, owner: undefined }); }}>
            <option value="">请选择负责人</option>
            {mockUsers.map((u) => (<option key={u.id} value={u.name}>{u.name}（{u.department}）</option>))}
          </select>
          <FieldError error={errors.owner} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-600">扫描计划</label>
          <select className="input-field" value={form.scanSchedule} onChange={(e) => setForm({ ...form, scanSchedule: e.target.value })}>
            {SCAN_SCHEDULE_OPTIONS.map((o) => (<option key={o.cron} value={o.cron}>{o.label}</option>))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>取消</button>
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />保存中</>) : '保存'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function ImportDocModal({ open, onClose, onSuccess, onImportComplete }: {
  open: boolean; onClose: () => void; onSuccess: (msg: string) => void;
  onImportComplete: (sourceId: string, initialTab: DetailTab) => void;
}) {
  const navigate = useNavigate();
  const addSource = useAppStore((s) => s.addSource);
  const updateSource = useAppStore((s) => s.updateSource);
  const addImportRecord = useAppStore((s) => s.addImportRecord);
  const addScanHistory = useAppStore((s) => s.addScanHistory);
  const sources = useAppStore((s) => s.sources);
  const getImportRecordsBySource = useAppStore((s) => s.getImportRecordsBySource);
  const [format, setFormat] = useState<ImportDocType>('openapi3');
  const [fileName, setFileName] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [importMode, setImportMode] = useState<ImportMode | 'ask'>('ask');
  const [importing, setImporting] = useState(false);
  const [selectedExistingSourceId, setSelectedExistingSourceId] = useState<string>('');
  const [duplicateInfo, setDuplicateInfo] = useState<{ sourceId: string; daysAgo: number; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormat('openapi3'); setFileName(''); setBaseUrl(''); setOwner('');
      setImportMode('ask'); setImporting(false); setSelectedExistingSourceId(''); setDuplicateInfo(null);
    }
  }, [open]);

  useEffect(() => {
    if (!fileName || !baseUrl.trim()) { setDuplicateInfo(null); return; }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysMs = thirtyDaysAgo.getTime();
    for (const src of sources) {
      const records = getImportRecordsBySource(src.id);
      const match = records.find((r) => {
        const importedAt = new Date(r.importedAt).getTime();
        return r.fileName === fileName && importedAt >= thirtyDaysMs;
      });
      if (match) {
        const daysAgo = Math.max(1, Math.floor((Date.now() - new Date(match.importedAt).getTime()) / (1000 * 60 * 60 * 24)));
        setDuplicateInfo({ sourceId: src.id, daysAgo, fileName });
        setSelectedExistingSourceId(src.id);
        return;
      }
    }
    setDuplicateInfo(null); setSelectedExistingSourceId('');
  }, [fileName, baseUrl, sources, getImportRecordsBySource]);

  const canSubmit =
    !!fileName.trim() && !!baseUrl.trim() && /^https?:\/\/.+/i.test(baseUrl.trim()) &&
    !!owner && !importing && !(duplicateInfo && importMode === 'ask');

  const handleFileSelect = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); }
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setImporting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const parsedApiCount = Math.floor(Math.random() * 81) + 20;
      const importedBy = owner;
      let targetSource: ApiSource | undefined;
      let versionBefore: string;
      let versionAfter: string;
      let finalImportMode: ImportMode;
      let finalApiCount: number;
      let apiCountDelta: number;

      if (duplicateInfo && selectedExistingSourceId) {
        targetSource = sources.find((s) => s.id === selectedExistingSourceId);
        finalImportMode = importMode === 'ask' ? 'append' : (importMode as ImportMode);
      } else {
        finalImportMode = 'overwrite';
      }

      if (targetSource && finalImportMode !== 'skip') {
        versionBefore = targetSource.currentVersion;
        const delta = finalImportMode === 'overwrite' ? parsedApiCount - targetSource.apiCount : Math.floor(Math.random() * 11) - 3;
        apiCountDelta = delta;
        finalApiCount = Math.max(3, targetSource.apiCount + apiCountDelta);
        versionAfter = incrementPatchVersion(targetSource.currentVersion);
        updateSource(targetSource.id, { currentVersion: versionAfter, apiCount: finalApiCount, lastScanAt: now, status: 'active' });
        const newApis = Math.max(0, apiCountDelta);
        const modifiedApis = Math.floor(Math.random() * 8);
        const removedApis = Math.max(0, -apiCountDelta);
        const totalChanges = newApis + modifiedApis + removedApis;
        addScanHistory({
          id: 'sh-import-' + Date.now().toString(36), sourceId: targetSource.id, version: versionAfter, scanAt: now,
          status: 'success', triggeredBy: 'import', operator: importedBy, durationMs: Math.floor(Math.random() * 3000) + 500,
          apiCount: finalApiCount, apiCountDelta, newApis, modifiedApis, removedApis, totalChanges,
          breakingChanges: Math.random() < 0.2 ? 1 : 0,
        });
      } else if (finalImportMode === 'skip' && targetSource) {
        setImporting(false); onSuccess('已跳过导入'); onClose(); return;
      } else {
        const apiCount = parsedApiCount;
        const newSource: ApiSource = {
          id: 'src' + Date.now().toString(36), name: fileName.replace(/\.[^.]+$/, '') + '-导入', system: '其他',
          baseUrl: baseUrl.trim(), authType: 'none', owner: importedBy, status: 'active', lastScanAt: now,
          currentVersion: '1.0.0', apiCount, createdAt: now, scanSchedule: '',
        };
        addSource(newSource); targetSource = newSource;
        versionBefore = '0.0.0'; versionAfter = '1.0.0'; apiCountDelta = apiCount; finalApiCount = apiCount;
        addScanHistory({
          id: 'sh-import-' + Date.now().toString(36), sourceId: newSource.id, version: versionAfter, scanAt: now,
          status: 'success', triggeredBy: 'import', operator: importedBy, durationMs: Math.floor(Math.random() * 3000) + 500,
          apiCount, apiCountDelta, newApis: apiCount, modifiedApis: 0, removedApis: 0, totalChanges: apiCount, breakingChanges: 0,
        });
      }

      addImportRecord({
        id: 'ir-' + Date.now().toString(36), sourceId: targetSource!.id, fileName, docType: format,
        importMode: finalImportMode, importedBy, importedAt: now, parsedApiCount,
        versionBefore, versionAfter, apiCountDelta,
      });

      setImporting(false);
      const isNew = !duplicateInfo;
      const tab: DetailTab = 'import';
      onSuccess(
        isNew ? `导入成功，新建源「${targetSource!.name}」，共 ${parsedApiCount} 个接口`
          : finalImportMode === 'overwrite' ? `覆盖成功，共 ${parsedApiCount} 个接口`
          : `追加成功，共 ${parsedApiCount} 个接口`,
      );
      onClose();
      onImportComplete(targetSource!.id, tab);
      if (navigate) void 0;
    }, 2000);
  };

  if (!open) return null;
  return (
    <ModalOverlay onClose={onClose} className="max-w-2xl">
      <ModalHeader title="导入文档" onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
        {duplicateInfo && (
          <div className="rounded-xl border border-warning-200 bg-warning-50/80 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-700">检测到同名文档「{duplicateInfo.fileName}」于 {duplicateInfo.daysAgo} 天前已导入</p>
                <p className="text-xs text-warning-600 mt-0.5">请选择处理方式</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setImportMode('overwrite')}
                className={cn('chip-outline chip transition-all', importMode === 'overwrite' ? 'bg-danger-50 text-danger-600 border-danger-300' : 'border-danger-200 text-danger-500 hover:bg-danger-50')}>
                覆盖原有版本
              </button>
              <button type="button" onClick={() => setImportMode('append')}
                className={cn('chip-outline chip transition-all', importMode === 'append' ? 'bg-success-50 text-success-600 border-success-300' : 'border-success-200 text-success-500 hover:bg-success-50')}>
                追加到现有
              </button>
              <button type="button" onClick={() => setImportMode('skip')}
                className={cn('chip-outline chip transition-all', importMode === 'skip' ? 'bg-ink-50 text-ink-600 border-ink-300' : 'border-ink-200 text-ink-500 hover:bg-ink-50')}>
                跳过
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">文档格式</label>
          <div className="flex flex-wrap gap-2">
            {SPEC_FORMATS.map((f) => (
              <button key={f.value} type="button" onClick={() => setFormat(f.value as ImportDocType)}
                className={cn('chip-outline chip transition-all', format === f.value && 'bg-brand-50 text-brand-700 border-brand-200')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-600">选择文件</label>
          <div onClick={handleFileSelect}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-6 py-8 transition-all hover:border-brand-300 hover:bg-brand-50/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-ink-100">
              <FileUp className="h-6 w-6 text-brand-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-600">
                {fileName ? fileName : '拖拽文件到此处，或'}
                <span className="ml-1 text-brand-600 underline-offset-2 hover:underline">点击选择文件</span>
              </p>
              <p className="mt-1 text-xs text-ink-400">支持 .json / .yaml / .yml / .md，单文件最大 20MB</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept=".json,.yaml,.yml,.md" onChange={handleFileChange} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">接口基地址 <span className="text-danger-500">*</span></label>
            <input type="text" className="input-field" placeholder="https://api.corp.com/xxx/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            {baseUrl && !/^https?:\/\/.+/i.test(baseUrl.trim()) && (<FieldError error="请输入合法的 URL" />)}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-600">负责人 <span className="text-danger-500">*</span></label>
            <select className="input-field" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">请选择负责人</option>
              {mockUsers.map((u) => (<option key={u.id} value={u.name}>{u.name}</option>))}
            </select>
          </div>
        </div>
        {!duplicateInfo && (
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-600">导入方式</label>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-ink-400 py-1">默认：覆盖同名接口（创建新源）</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={importing}>取消</button>
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
          {importing ? (<><Loader2 className="h-4 w-4 animate-spin" />导入中...</>) : '开始导入'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function SourceDetailDrawer({ open, source, onClose, initialTab = 'scan', onEdit, onDelete, pushToast }: {
  open: boolean; source: ApiSource | null; onClose: () => void; initialTab?: DetailTab;
  onEdit?: (src: ApiSource) => void; onDelete?: (src: ApiSource) => void;
  pushToast: (type: ToastType, message: string) => void;
}) {
  const navigate = useNavigate();
  const addScanHistory = useAppStore((s) => s.addScanHistory);
  const updateScanHistory = useAppStore((s) => s.updateScanHistory);
  const updateSource = useAppStore((s) => s.updateSource);
  const getScanHistoriesBySource = useAppStore((s) => s.getScanHistoriesBySource);
  const getImportRecordsBySource = useAppStore((s) => s.getImportRecordsBySource);
  const getDiffSnapshotsBySource = useAppStore((s) => s.getDiffSnapshotsBySource);
  const removeDiffSnapshot = useAppStore((s) => s.removeDiffSnapshot);
  const sources = useAppStore((s) => s.sources);
  const addWorkItem = useAppStore((s) => s.addWorkItem);
  const addChange = useAppStore((s) => s.addChange);
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [versionFrom, setVersionFrom] = useState('');
  const [versionTo, setVersionTo] = useState('');
  const [scanning, setScanning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<DetailSubTab>('new');

  useEffect(() => { if (open && source) setActiveTab(initialTab); }, [open, source, initialTab]);
  useEffect(() => { if (open) { setExpandedScanId(null); setDetailSubTab('new'); } }, [open]);

  const currentSource = source ? (sources.find((s) => s.id === source.id) || source) : null;
  const scanHistories = useMemo(() => {
    if (!source) return [];
    return [...getScanHistoriesBySource(source.id)].sort((a, b) => new Date(b.scanAt).getTime() - new Date(a.scanAt).getTime());
  }, [source ? source.id : '', refreshKey, scanning, source]);
  const importRecords = useMemo(() => {
    if (!source) return [];
    return [...getImportRecordsBySource(source.id)].sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  }, [source ? source.id : '', refreshKey, source]);
  const diffSnapshots = useMemo(() => {
    if (!source) return [];
    return getDiffSnapshotsBySource(source.id);
  }, [source ? source.id : '', refreshKey, source, getDiffSnapshotsBySource]);
  const versionOptions = useMemo(() => scanHistories.filter((h) => h.status === 'success').map((h) => ({ version: h.version, scanAt: h.scanAt })), [scanHistories]);
  const recentVersions = versionOptions.slice(0, 4);

  useEffect(() => {
    if (!source) return;
    if (versionOptions.length >= 2) { setVersionFrom(versionOptions[1].version); setVersionTo(versionOptions[0].version); }
    else if (versionOptions.length === 1) { setVersionFrom(versionOptions[0].version); setVersionTo(versionOptions[0].version); }
  }, [source ? source.id : '', versionOptions.length, source]);

  if (!open || !source || !currentSource) return null;

  const handleScanNow = () => {
    if (scanning) return;
    const src = sources.find((s) => s.id === source.id) || source;
    setScanning(true);
    setRefreshKey((k) => k + 1);
    const runningId = 'sh-run-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const operatorName = mockUsers[Math.floor(Math.random() * mockUsers.length)].name;
    addScanHistory({ id: runningId, sourceId: src.id, version: src.currentVersion, scanAt: now, status: 'running', triggeredBy: 'manual', operator: operatorName, durationMs: 0, apiCount: src.apiCount, apiCountDelta: 0, newApis: 0, modifiedApis: 0, removedApis: 0, totalChanges: 0, breakingChanges: 0 });
    setTimeout(() => {
      const isFailed = Math.random() < 0.1;
      const durationMs = Math.floor(Math.random() * 2901) + 600;
      const apiCountDelta = Math.floor(Math.random() * 11) - 5;
      const newApiCount = Math.max(5, src.apiCount + apiCountDelta);
      const newVers = incrementPatchVersion(src.currentVersion);
      const newApis = Math.max(0, apiCountDelta + Math.floor(Math.random() * 3));
      const modifiedApis = Math.floor(Math.random() * 6);
      const removedApis = Math.max(0, -apiCountDelta + Math.floor(Math.random() * 2));
      const totalChanges = newApis + modifiedApis + removedApis;
      const breakingChanges = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      if (isFailed) {
        const failReason = FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];
        updateScanHistory(runningId, { status: 'failed', failReason, durationMs, apiCountDelta: 0, newApis: 0, modifiedApis: 0, removedApis: 0, totalChanges: 0, breakingChanges: 0 });
        pushToast('error', `扫描失败：${failReason}`);
      } else {
        updateScanHistory(runningId, { status: 'success', version: newVers, durationMs, apiCount: newApiCount, apiCountDelta, newApis, modifiedApis, removedApis, totalChanges, breakingChanges });
        updateSource(src.id, { currentVersion: newVers, lastScanAt: new Date().toISOString(), apiCount: newApiCount });
        pushToast('success', `扫描完成：版本 ${newVers}，共 ${totalChanges} 项变更`);
      }
      setRefreshKey((k) => k + 1);
      setScanning(false);
    }, 1500);
  };

  const goDiff = (vf: string, vt: string) => { navigate(`/diff?sourceId=${source.id}&versionFrom=${vf}&versionTo=${vt}`, { state: { sourceName: source.name, sourceBaseUrl: source.baseUrl } }); };

  const expandedHistory = useMemo(() => {
    if (!expandedScanId || !source) return null;
    const h = scanHistories.find((x) => x.id === expandedScanId);
    if (!h || h.status !== 'success') return null;
    const idx = scanHistories.indexOf(h);
    const prev = scanHistories.slice(idx + 1).find((x) => x.status === 'success');
    const vf = prev ? prev.version : '0.0.0';
    return {
      history: h,
      versionFrom: vf,
      newChanges: generateChangesForCategory(h, source, 'new', h.newApis, vf),
      modifiedChanges: generateChangesForCategory(h, source, 'modified', h.modifiedApis, vf),
      removedChanges: generateChangesForCategory(h, source, 'removed', h.removedApis, vf),
      breakingChanges: generateChangesForCategory(h, source, 'breaking', h.breakingChanges, vf),
    };
  }, [expandedScanId, scanHistories, source]);

  const handleCreateWorkItem = (change: ApiChange) => {
    const existing = useAppStore.getState().changes.find((c) => c.id === change.id);
    const changeId = existing ? change.id : addChange({ ...change });
    const now = new Date().toISOString();
    const methodLabels: Record<ChangeType, string> = { added: '新增', removed: '删除', modified: '变更' };
    const title = `[${methodLabels[change.type]}] ${change.method} ${change.endpoint}`;
    let prio: 'critical' | 'high' | 'medium' | 'low';
    if (change.severity === 'breaking') prio = 'high';
    else if (change.severity === 'normal') prio = 'medium';
    else prio = 'low';
    const wi = {
      id: 'wi-' + Date.now().toString(36),
      title,
      changeIds: [changeId],
      status: 'pending_review' as const,
      priority: prio,
      assignee: source?.owner,
      reporter: mockUsers[Math.floor(Math.random() * mockUsers.length)].name,
      description: `源：${source?.name || ''}\n版本：v${change.versionFrom} → v${change.versionTo}\n路径：${change.method} ${change.endpoint}\n类别：${change.category}\n影响级别：${change.severity}\n\n${change.description}`,
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    addWorkItem(wi);
    pushToast('success', '工单已创建（关联 1 条变更）');
  };

  const handleToggleExpand = (h: ScanHistory) => {
    if (h.status !== 'success') return;
    setExpandedScanId((prev) => (prev === h.id ? null : h.id));
    setDetailSubTab('new');
  };

  const getSubTabChanges = (): ApiChange[] => {
    if (!expandedHistory) return [];
    switch (detailSubTab) {
      case 'new': return expandedHistory.newChanges;
      case 'modified': return expandedHistory.modifiedChanges;
      case 'removed': return expandedHistory.removedChanges;
      case 'breaking': return expandedHistory.breakingChanges;
    }
  };

  const subTabs: { key: DetailSubTab; label: string; count: number; color: string; }[] = [
    { key: 'new', label: '新增', count: expandedHistory?.history.newApis || 0, color: 'text-success-600' },
    { key: 'modified', label: '修改', count: expandedHistory?.history.modifiedApis || 0, color: 'text-warning-600' },
    { key: 'removed', label: '删除', count: expandedHistory?.history.removedApis || 0, color: 'text-danger-600' },
    { key: 'breaking', label: '破坏性', count: expandedHistory?.history.breakingChanges || 0, color: 'text-danger-600 font-bold' },
  ];
  const tabs: { key: DetailTab; label: string; count: number }[] = [
    { key: 'scan', label: '扫描历史', count: scanHistories.length },
    { key: 'import', label: '导入记录', count: importRecords.length },
    { key: 'diff', label: '版本对比', count: versionOptions.length },
    { key: 'snapshot', label: '对比快照', count: diffSnapshots.length },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: 640 }} animate={{ x: 0 }} exit={{ x: 640 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 z-50 h-screen w-[640px] border-l border-ink-100 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 border-b border-ink-100 bg-white/80 backdrop-blur-lg px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-xl font-bold text-ink-700">{currentSource.name}</h2>
                  <SourceStatusBadge status={currentSource.status} />
                </div>
                <p className="text-xs font-mono text-ink-500 mt-1 truncate">{currentSource.baseUrl}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onEdit && onEdit(currentSource)} className="btn-ghost h-8 w-8 p-0 text-ink-500 hover:text-brand-600" title="编辑"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDelete && onDelete(currentSource)} className="btn-ghost h-8 w-8 p-0 text-ink-500 hover:text-danger-600" title="删除"><Trash2 className="h-4 w-4" /></button>
                <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 p-0 text-ink-500 hover:text-ink-700"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 p-3 rounded-xl bg-gradient-to-br from-brand-50/60 to-ink-50/40 border border-ink-100">
              <div className="min-w-0"><p className="text-[10px] text-ink-400">所属系统</p><p className="text-xs font-medium text-ink-700 truncate">{currentSource.system}</p></div>
              <div className="min-w-0"><p className="text-[10px] text-ink-400">鉴权方式</p><span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-medium', authTypeClass[currentSource.authType])}>{authTypeLabels[currentSource.authType]}</span></div>
              <div className="min-w-0"><p className="text-[10px] text-ink-400">负责人</p><div className="flex items-center gap-1 text-xs text-ink-700"><UserIcon className="h-3 w-3 text-ink-400" /><span className="truncate">{currentSource.owner}</span></div></div>
              <div className="min-w-0"><p className="text-[10px] text-ink-400">扫描计划</p><p className="text-xs font-medium text-ink-700 truncate">{cronToLabel(currentSource.scanSchedule)}</p></div>
              <div className="min-w-0"><p className="text-[10px] text-ink-400">当前版本</p><p className="text-xs font-mono font-semibold text-brand-600">v{currentSource.currentVersion}</p></div>
              <div className="min-w-0"><p className="text-[10px] text-ink-400">总接口数</p><p className="text-xs font-mono font-semibold text-ink-700">{currentSource.apiCount}</p></div>
              <div className="col-span-2 min-w-0"><p className="text-[10px] text-ink-400">最近扫描</p><p className="text-xs text-ink-700">{formatDateTime(currentSource.lastScanAt)}</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap', activeTab === t.key ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700')}>
                  {t.label} <span className={cn('ml-1', activeTab === t.key ? 'text-white/80' : 'text-ink-400')}>({t.count})</span>
                </button>
              ))}
              <button type="button" onClick={handleScanNow} disabled={scanning}
                className={cn('ml-auto px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all', scanning ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm')}>
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {scanning ? '扫描中...' : '立即扫描'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {activeTab === 'scan' && (scanHistories.length === 0 ? (
              <div className="text-center py-16"><Clock className="mx-auto h-10 w-10 text-ink-300 mb-3" /><p className="text-sm text-ink-500 font-medium">暂无扫描记录</p><p className="text-xs text-ink-400 mt-1">点击右上角「立即扫描」创建首次记录</p></div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-ink-100">
                <table className="w-full text-xs">
                  <thead><tr className="bg-ink-50/60 text-ink-500">
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">扫描时间</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">版本号</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">触发方式</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">状态</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">接口数</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">Delta</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">新增</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">修改</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">删除</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">破坏性</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">耗时</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">操作</th>
                  </tr></thead>
                  <tbody className="divide-y divide-ink-50">
                    {scanHistories.map((h, idx) => {
                      const trig = triggerConfig[h.triggeredBy];
                      const prev = scanHistories.slice(idx + 1).find((x) => x.status === 'success');
                      const DeltaIcon = h.apiCountDelta > 0 ? ArrowUpRight : h.apiCountDelta < 0 ? ArrowDownRight : Minus;
                      const isExpanded = expandedScanId === h.id;
                      const canExpand = h.status === 'success';
                      return (
                        <>
                          <tr key={h.id}
                            className={cn(
                              'transition-colors',
                              canExpand && 'cursor-pointer',
                              isExpanded ? 'bg-brand-50/60' : canExpand ? 'hover:bg-ink-50/40' : 'opacity-90',
                              !canExpand && 'cursor-not-allowed',
                            )}
                            onClick={() => handleToggleExpand(h)}
                          >
                            <td className="px-3 py-2 text-ink-600 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {canExpand ? (
                                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                                  </motion.div>
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-ink-200 shrink-0" />
                                )}
                                <span>{formatDateTime(h.scanAt)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-brand-600 whitespace-nowrap">v{h.version}</td>
                            <td className="px-3 py-2 whitespace-nowrap"><div className="flex items-center gap-1.5"><trig.icon className={cn('h-3.5 w-3.5', trig.className)} /><span className="text-ink-600">{trig.label}</span>{h.triggeredBy === 'manual' && h.operator && <span className="text-ink-400">· {h.operator}</span>}</div></td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {h.status === 'success' && <span className="inline-flex items-center gap-1 text-success-600 font-medium"><Check className="h-3.5 w-3.5" />成功</span>}
                              {h.status === 'running' && <span className="inline-flex items-center gap-1 text-ink-500 font-medium"><Loader2 className="h-3.5 w-3.5 animate-spin" />扫描中</span>}
                              {h.status === 'failed' && <div><span className="inline-flex items-center gap-1 text-danger-600 font-medium"><AlertTriangle className="h-3.5 w-3.5" />失败</span>{h.failReason && <p className="text-[10px] text-danger-500 mt-0.5 leading-tight max-w-[180px]">{h.failReason}</p>}</div>}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-ink-700 whitespace-nowrap">{h.apiCount}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap"><div className={cn('inline-flex items-center gap-0.5 font-mono font-semibold', h.apiCountDelta > 0 ? 'text-success-600' : h.apiCountDelta < 0 ? 'text-danger-600' : 'text-ink-400')}><DeltaIcon className="h-3 w-3" />{h.apiCountDelta > 0 ? '+' : ''}{h.apiCountDelta}</div></td>
                            <td className="px-3 py-2 text-right font-mono text-success-600 whitespace-nowrap">+{h.newApis}</td>
                            <td className="px-3 py-2 text-right font-mono text-warning-600 whitespace-nowrap">~{h.modifiedApis}</td>
                            <td className="px-3 py-2 text-right font-mono text-danger-600 whitespace-nowrap">-{h.removedApis}</td>
                            <td className={cn('px-3 py-2 text-right font-mono whitespace-nowrap', h.breakingChanges > 0 ? 'text-danger-600 font-bold' : 'text-ink-400')}>{h.breakingChanges}</td>
                            <td className="px-3 py-2 text-right font-mono text-ink-500 whitespace-nowrap">{(h.durationMs / 1000).toFixed(1)}s</td>
                            <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); }}>
                              {prev && <button type="button" onClick={() => goDiff(prev.version, h.version)} className="text-brand-600 hover:text-brand-700 font-medium text-[11px] flex items-center gap-0.5"><GitCompareArrows className="h-3 w-3" />对比前一次</button>}
                            </td>
                          </tr>
                          {isExpanded && expandedHistory && expandedHistory.history.id === h.id && (
                            <tr key={h.id + '-expanded'} className="bg-brand-50/40">
                              <td colSpan={12} className="px-3 py-4">
                                <div className="rounded-xl border border-brand-100 bg-white/70 p-4 space-y-4">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {subTabs.map((t) => (
                                      <button key={t.key} type="button"
                                        onClick={(e) => { e.stopPropagation(); setDetailSubTab(t.key); }}
                                        className={cn(
                                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1',
                                          detailSubTab === t.key
                                            ? 'bg-brand-500 text-white shadow-sm'
                                            : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700 border border-ink-100',
                                        )}>
                                        {t.label}
                                        <span className={cn(detailSubTab === t.key ? 'text-white/80' : t.color)}>({t.count})</span>
                                      </button>
                                    ))}
                                  </div>
                                  {(() => {
                                    const changes = getSubTabChanges();
                                    if (changes.length === 0) {
                                      return (
                                        <div className="text-center py-6 text-xs text-ink-400">
                                          暂无{subTabs.find((s) => s.key === detailSubTab)?.label}类变更
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="overflow-x-auto rounded-lg border border-ink-100">
                                        <table className="w-full text-[11px]">
                                          <thead><tr className="bg-ink-50/80 text-ink-500">
                                            <th className="px-2.5 py-2 font-semibold text-left whitespace-nowrap">接口路径</th>
                                            <th className="px-2.5 py-2 font-semibold text-left whitespace-nowrap">方法</th>
                                            <th className="px-2.5 py-2 font-semibold text-left whitespace-nowrap">变更类别</th>
                                            <th className="px-2.5 py-2 font-semibold text-left whitespace-nowrap">影响级别</th>
                                            <th className="px-2.5 py-2 font-semibold text-left">简短说明</th>
                                            <th className="px-2.5 py-2 font-semibold text-right whitespace-nowrap">操作</th>
                                          </tr></thead>
                                          <tbody className="divide-y divide-ink-50">
                                            {changes.map((c) => (
                                              <tr key={c.id} className="hover:bg-ink-50/40">
                                                <td className="px-2.5 py-2 font-mono text-ink-700 whitespace-nowrap">{c.endpoint}</td>
                                                <td className="px-2.5 py-2 whitespace-nowrap">
                                                  <span className={cn(
                                                    'inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold',
                                                    c.method === 'GET' && 'bg-success-50 text-success-700',
                                                    c.method === 'POST' && 'bg-brand-50 text-brand-700',
                                                    c.method === 'PUT' && 'bg-warning-50 text-warning-700',
                                                    c.method === 'DELETE' && 'bg-danger-50 text-danger-700',
                                                    c.method === 'PATCH' && 'bg-purple-50 text-purple-700',
                                                  )}>{c.method}</span>
                                                </td>
                                                <td className="px-2.5 py-2 whitespace-nowrap text-ink-600">{c.category}</td>
                                                <td className="px-2.5 py-2 whitespace-nowrap">
                                                  <span className={cn(
                                                    'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                                                    c.severity === 'breaking' && 'bg-danger-50 text-danger-700 border border-danger-200',
                                                    c.severity === 'normal' && 'bg-warning-50 text-warning-700',
                                                    c.severity === 'minor' && 'bg-ink-50 text-ink-600',
                                                  )}>{c.severity === 'breaking' ? '破坏性' : c.severity === 'normal' ? '普通' : '轻微'}</span>
                                                </td>
                                                <td className="px-2.5 py-2 text-ink-600 min-w-[200px]">{c.description}</td>
                                                <td className="px-2.5 py-2 text-right whitespace-nowrap">
                                                  <button type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleCreateWorkItem(c); }}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-medium transition-colors shadow-sm">
                                                    <Ticket className="h-3 w-3" />创建工单
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {activeTab === 'import' && (importRecords.length === 0 ? (
              <div className="text-center py-16"><FileSpreadsheet className="mx-auto h-10 w-10 text-ink-300 mb-3" /><p className="text-sm text-ink-500 font-medium">暂无导入记录</p><p className="text-xs text-ink-400 mt-1">通过「导入文档」功能导入 API 规范</p></div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-ink-100">
                <table className="w-full text-xs">
                  <thead><tr className="bg-ink-50/60 text-ink-500">
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">文件名</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">文档类型</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">导入方式</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">导入人</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">导入时间</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">解析接口</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">版本变化</th>
                    <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">Delta</th>
                    <th className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">操作</th>
                  </tr></thead>
                  <tbody className="divide-y divide-ink-50">
                    {importRecords.map((r) => {
                      const DocIcon = docTypeIcon[r.docType];
                      const modeCfg = importModeConfig[r.importMode];
                      return (
                        <tr key={r.id} className="hover:bg-ink-50/40">
                          <td className="px-3 py-2"><div className="flex items-center gap-1.5 min-w-0"><DocIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" /><span className="text-ink-700 truncate max-w-[140px]">{r.fileName}</span></div></td>
                          <td className="px-3 py-2 text-ink-600 whitespace-nowrap uppercase">{r.docType}</td>
                          <td className="px-3 py-2 whitespace-nowrap"><span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium', modeCfg.className)}>{modeCfg.label}</span></td>
                          <td className="px-3 py-2 text-ink-600 whitespace-nowrap">{r.importedBy}</td>
                          <td className="px-3 py-2 text-ink-500 whitespace-nowrap">{formatDateTime(r.importedAt)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-ink-700 whitespace-nowrap">{r.parsedApiCount}</td>
                          <td className="px-3 py-2 whitespace-nowrap"><div className="flex items-center gap-1 font-mono text-[11px]"><span className="text-ink-400">v{r.versionBefore}</span><ArrowRight className="h-3 w-3 text-ink-300" /><span className="text-brand-600 font-semibold">v{r.versionAfter}</span></div></td>
                          <td className="px-3 py-2 text-right whitespace-nowrap"><div className={cn('inline-flex items-center font-mono font-semibold', r.apiCountDelta >= 0 ? 'text-success-600' : 'text-danger-600')}>{r.apiCountDelta >= 0 ? '+' : ''}{r.apiCountDelta}</div></td>
                          <td className="px-3 py-2 whitespace-nowrap"><button type="button" onClick={() => goDiff(r.versionBefore, r.versionAfter)} className="text-brand-600 hover:text-brand-700 font-medium text-[11px] flex items-center gap-0.5"><GitCompareArrows className="h-3 w-3" />查看变更</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {activeTab === 'diff' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-ink-100 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="mb-1 block text-[11px] font-medium text-ink-500">版本 From</label>
                      <div className="relative"><select value={versionFrom} onChange={(e) => setVersionFrom(e.target.value)} className="input-field text-xs py-2 pr-7">
                        {versionOptions.map((opt) => (<option key={opt.version + '-f'} value={opt.version}>v{opt.version} ({formatDate(opt.scanAt)})</option>))}
                      </select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /></div>
                    </div>
                    <div><label className="mb-1 block text-[11px] font-medium text-ink-500">版本 To</label>
                      <div className="relative"><select value={versionTo} onChange={(e) => setVersionTo(e.target.value)} className="input-field text-xs py-2 pr-7">
                        {versionOptions.map((opt) => (<option key={opt.version + '-t'} value={opt.version}>v{opt.version} ({formatDate(opt.scanAt)})</option>))}
                      </select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => goDiff(versionFrom, versionTo)} disabled={versionOptions.length < 2}
                      className={cn('flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all', versionOptions.length < 2 ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm')}>
                      <GitCompareArrows className="h-3.5 w-3.5" />开始对比
                    </button>
                    {versionOptions.length >= 2 && (
                      <button type="button" onClick={() => goDiff(versionOptions[1].version, versionOptions[0].version)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-ink-50 hover:bg-ink-100 text-ink-600 border border-ink-100">
                        <GitCompareArrows className="h-3.5 w-3.5" />对比前一次
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-medium text-ink-600 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-ink-400" />最近 {Math.min(4, recentVersions.length)} 次版本变化时间线</h4>
                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-100" />
                    <div className="space-y-4">
                      {recentVersions.map((opt, idx) => (
                        <div key={'tl-' + opt.version + idx} className="relative">
                          <div className={cn('absolute -left-[22px] top-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center', idx === 0 ? 'border-brand-500 bg-brand-500' : 'border-ink-200 bg-white')}>
                            {idx === 0 && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('font-mono font-semibold text-xs', idx === 0 ? 'text-brand-600' : 'text-ink-500')}>v{opt.version}</span>
                            <span className="text-[11px] text-ink-400">{formatDateTime(opt.scanAt)}</span>
                            {idx === 0 && <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-200 rounded px-1.5 py-px font-medium">当前版本</span>}
                          </div>
                        </div>
                      ))}
                      {recentVersions.length === 0 && <p className="text-xs text-ink-400">暂无版本记录</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'snapshot' && (
              diffSnapshots.length === 0 ? (
                <div className="text-center py-16">
                  <Camera className="mx-auto h-10 w-10 text-ink-300 mb-3" />
                  <p className="text-sm text-ink-500 font-medium">暂无对比快照</p>
                  <p className="text-xs text-ink-400 mt-1 mb-4">去版本对比页保存本次结果</p>
                  <button
                    type="button"
                    onClick={() => navigate('/diff')}
                    className="btn-primary inline-flex"
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    去版本对比
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {diffSnapshots.map((snap: DiffSnapshot) => (
                    <div
                      key={snap.id}
                      className="rounded-xl border border-ink-100 bg-white p-4 transition-all hover:border-brand-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm text-ink-700 truncate">
                            {snap.label || `v${snap.versionFrom} → v${snap.versionTo} 对比`}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-medium text-ink-500">
                            {formatFromNow(snap.savedAt)}
                          </div>
                          <div className="text-[10px] text-ink-400">
                            {formatDateTime(snap.savedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs mb-3 font-mono">
                        <span className="text-ink-500">v{snap.versionFrom}</span>
                        <ArrowRight className="h-3 w-3 text-ink-300" />
                        <span className="text-brand-600 font-semibold">v{snap.versionTo}</span>
                        <span className="ml-2 text-[10px] text-ink-400">
                          保存人：{snap.savedBy}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mb-3">
                        <div className="text-center rounded-lg bg-success-50 py-2">
                          <div className="text-base font-bold text-success-600">
                            +{snap.summary.added}
                          </div>
                          <div className="text-[10px] text-success-500">新增</div>
                        </div>
                        <div className="text-center rounded-lg bg-danger-50 py-2">
                          <div className="text-base font-bold text-danger-600">
                            -{snap.summary.removed}
                          </div>
                          <div className="text-[10px] text-danger-500">删除</div>
                        </div>
                        <div className="text-center rounded-lg bg-warning-50 py-2">
                          <div className="text-base font-bold text-warning-600">
                            ~{snap.summary.modified}
                          </div>
                          <div className="text-[10px] text-warning-500">修改</div>
                        </div>
                        <div className={cn("text-center rounded-lg py-2", snap.summary.breaking > 0 ? "bg-danger-50" : "bg-ink-50")}>
                          <div className={cn(
                            'text-base font-bold',
                            snap.summary.breaking > 0 ? 'text-danger-700' : 'text-ink-400',
                          )}>
                            !{snap.summary.breaking}
                          </div>
                          <div className="text-[10px] text-danger-500">破坏</div>
                        </div>
                        <div className="text-center rounded-lg bg-ink-50 py-2">
                          <div className="text-base font-bold text-ink-700">
                            {snap.summary.totalChanges}
                          </div>
                          <div className="text-[10px] text-ink-500">合计</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/diff?sourceId=${snap.sourceId}&versionFrom=${snap.versionFrom}&versionTo=${snap.versionTo}`)}
                          className="text-brand-600 hover:text-brand-700 font-medium text-[11px] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brand-50 transition-colors"
                        >
                          <GitCompareArrows className="h-3 w-3" />
                          重新打开
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeDiffSnapshot(snap.id);
                            setRefreshKey((k) => k + 1);
                            pushToast('success', '快照已删除');
                          }}
                          className="text-danger-500 hover:text-danger-600 font-medium text-[11px] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-danger-50 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ConfirmDeleteModal({ open, source, onClose, onSuccess }: { open: boolean; source: ApiSource | null; onClose: () => void; onSuccess: (msg: string) => void; }) {
  const removeSource = useAppStore((s) => s.removeSource);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { if (open) setDeleting(false); }, [open]);
  const handleDelete = () => {
    if (!source) return;
    setDeleting(true);
    setTimeout(() => { removeSource(source.id); setDeleting(false); onSuccess('删除成功'); onClose(); }, 400);
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
              确认要删除「<span className="font-semibold text-ink-700">{source.name}</span>」接口源吗？此操作不可撤销。
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-ink-100/60 px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={deleting}>取消</button>
        <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? (<><Loader2 className="h-4 w-4 animate-spin" />删除中</>) : '删除'}
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function Sources() {
  const navigate = useNavigate();
  const { sources, updateSource, addScanHistory, updateScanHistory } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editSource, setEditSource] = useState<ApiSource | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteSrc, setDeleteSrc] = useState<ApiSource | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSource, setDrawerSource] = useState<ApiSource | null>(null);
  const [drawerTab, setDrawerTab] = useState<DetailTab>('scan');
  const [scanRefresh, setScanRefresh] = useState(0);

  const pushToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => { const next = [...prev, { id, type, message }]; return next.slice(-5); });
  };
  const removeToast = (id: number) => { setToasts((prev) => prev.filter((t) => t.id !== id)); };

  const systems = useMemo(() => { const set = new Set(sources.map((s) => s.system)); return Array.from(set); }, [sources]);
  const filteredSources = useMemo(() => sources.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.baseUrl.toLowerCase().includes(search.toLowerCase()) || s.owner.includes(search);
    const matchSystem = !activeSystem || s.system === activeSystem;
    return matchSearch && matchSystem;
  }), [sources, search, activeSystem, scanRefresh]);

  const handleScan = (id: string) => {
    if (scanningId) return;
    const src = sources.find((s) => s.id === id);
    if (!src) return;
    setScanningId(id);
    setScanRefresh((k) => k + 1);
    const runningId = 'sh-run-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const operatorName = mockUsers[Math.floor(Math.random() * mockUsers.length)].name;
    addScanHistory({ id: runningId, sourceId: src.id, version: src.currentVersion, scanAt: now, status: 'running', triggeredBy: 'manual', operator: operatorName, durationMs: 0, apiCount: src.apiCount, apiCountDelta: 0, newApis: 0, modifiedApis: 0, removedApis: 0, totalChanges: 0, breakingChanges: 0 });
    setTimeout(() => {
      const isFailed = Math.random() < 0.1;
      const durationMs = Math.floor(Math.random() * 2901) + 600;
      const apiCountDelta = Math.floor(Math.random() * 11) - 5;
      const newApiCount = Math.max(5, src.apiCount + apiCountDelta);
      const newVers = incrementPatchVersion(src.currentVersion);
      const newApis = Math.max(0, apiCountDelta + Math.floor(Math.random() * 3));
      const modifiedApis = Math.floor(Math.random() * 6);
      const removedApis = Math.max(0, -apiCountDelta + Math.floor(Math.random() * 2));
      const totalChanges = newApis + modifiedApis + removedApis;
      const breakingChanges = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      if (isFailed) {
        const failReason = FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];
        updateScanHistory(runningId, { status: 'failed', failReason, durationMs, apiCountDelta: 0, newApis: 0, modifiedApis: 0, removedApis: 0, totalChanges: 0, breakingChanges: 0 });
        pushToast('error', `扫描失败：${failReason}`);
      } else {
        updateScanHistory(runningId, { status: 'success', version: newVers, durationMs, apiCount: newApiCount, apiCountDelta, newApis, modifiedApis, removedApis, totalChanges, breakingChanges });
        updateSource(src.id, { currentVersion: newVers, lastScanAt: new Date().toISOString(), apiCount: newApiCount });
        pushToast('success', `「${src.name}」扫描完成：版本 ${newVers}，${totalChanges} 项变更`);
        if (navigate) void 0;
      }
      setScanRefresh((k) => k + 1);
      setScanningId(null);
    }, 1500);
  };

  const handleEdit = (src: ApiSource) => { setDrawerOpen(false); setTimeout(() => { setEditSource(src); setEditOpen(true); }, 150); };
  const handleDelete = (src: ApiSource) => { setDrawerOpen(false); setTimeout(() => { setDeleteSrc(src); setDeleteOpen(true); }, 150); };
  const openDrawer = (src: ApiSource, tab: DetailTab = 'scan') => { setDrawerSource(src); setDrawerTab(tab); setDrawerOpen(true); };
  const onImportComplete = (sourceId: string, initialTab: DetailTab) => {
    setTimeout(() => {
      const currentSources = useAppStore.getState().sources;
      const src = currentSources.find((s) => s.id === sourceId);
      if (src) openDrawer(src, initialTab);
    }, 0);
  };

  return (
    <div className="min-h-screen p-6 gradient-mesh-bg">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-700">接口源管理</h1>
          <p className="mt-1 text-sm text-ink-400">管理接入的 API 文档源，配置扫描与鉴权方式</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input type="text" placeholder="搜索名称、基地址、负责人..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setActiveSystem(null)}
                className={cn('chip-outline chip transition-all', !activeSystem && 'bg-brand-50 text-brand-700 border-brand-200')}>全部</button>
              {systems.map((sys) => (
                <button key={sys} type="button" onClick={() => setActiveSystem(sys)}
                  className={cn('chip-outline chip transition-all', activeSystem === sys && 'bg-brand-50 text-brand-700 border-brand-200')}>{sys}</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />导入文档
              </button>
              <button type="button" className="btn-primary" onClick={() => setNewSourceOpen(true)}>
                <Plus className="h-4 w-4" />新建接口源
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th><th>所属系统</th><th>基地址</th><th>鉴权方式</th><th>负责人</th>
                  <th>状态</th><th>接口数量</th><th>最近扫描</th><th className="w-32 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.map((src) => {
                  const isScanning = scanningId === src.id;
                  return (
                    <tr key={src.id} className="group cursor-pointer transition-colors hover:bg-brand-50/20" onClick={() => openDrawer(src)}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 decoration-brand-300">{src.name}</span>
                          <span className="text-xs text-ink-400 font-mono">v{src.currentVersion}</span>
                        </div>
                      </td>
                      <td>{src.system}</td>
                      <td><code className="rounded bg-ink-50 px-2 py-1 text-xs text-ink-600 font-mono break-all">{src.baseUrl}</code></td>
                      <td><span className={cn('tag', authTypeClass[src.authType])}>{authTypeLabels[src.authType]}</span></td>
                      <td>{src.owner}</td>
                      <td>
                        {isScanning ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            <Loader2 className="h-3 w-3 animate-spin" />扫描中
                          </span>
                        ) : (<SourceStatusBadge status={src.status} />)}
                      </td>
                      <td><span className="font-mono font-semibold text-ink-600">{src.apiCount}</span></td>
                      <td className="text-ink-500 text-sm">
                        {formatFromNow(src.lastScanAt)}
                        {src.scanSchedule && (<div className="text-[11px] text-ink-400 mt-0.5">{cronToLabel(src.scanSchedule)}</div>)}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className={cn('btn-ghost h-8 w-8 p-0', isScanning ? 'text-brand-600' : 'opacity-60 hover:opacity-100')}
                            onClick={() => handleScan(src.id)} disabled={isScanning} title="立即扫描">
                            {isScanning ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Play className="h-4 w-4" />)}
                          </button>
                          <button type="button" className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700 opacity-60 hover:opacity-100" title="编辑" onClick={() => handleEdit(src)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost h-8 w-8 p-0 text-danger-500 hover:text-danger-600 opacity-60 hover:opacity-100" title="删除" onClick={() => handleDelete(src)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSources.length === 0 && (
                  <tr><td colSpan={9} className="py-16 text-center text-ink-400">暂无匹配的接口源</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewSourceModal open={newSourceOpen} onClose={() => setNewSourceOpen(false)} onSuccess={(msg) => pushToast('success', msg)} />
      <ImportDocModal open={importOpen} onClose={() => setImportOpen(false)} onSuccess={(msg) => pushToast('success', msg)} onImportComplete={onImportComplete} />
      <EditSourceModal open={editOpen} source={editSource}
        onClose={() => { setEditOpen(false); setEditSource(null); }}
        onSuccess={(msg) => pushToast('success', msg)} />
      <ConfirmDeleteModal open={deleteOpen} source={deleteSrc}
        onClose={() => { setDeleteOpen(false); setDeleteSrc(null); }}
        onSuccess={(msg) => pushToast('success', msg)} />
      <SourceDetailDrawer
        open={drawerOpen}
        source={drawerSource}
        onClose={() => setDrawerOpen(false)}
        initialTab={drawerTab}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pushToast={pushToast}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
