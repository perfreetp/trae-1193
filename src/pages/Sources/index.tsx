import { useState, useMemo } from 'react';
import { Search, Plus, Upload, Play, Pencil, Trash2, Loader2 } from 'lucide-react';
import { mockSources } from '@/mock/sources';
import type { ApiSource, SourceStatus, AuthType } from '@/types';
import { formatFromNow } from '@/utils';
import { cn } from '@/lib/utils';

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
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', config.className)}>
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

export default function Sources() {
  const [search, setSearch] = useState('');
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [sources, setSources] = useState<ApiSource[]>(mockSources);

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
      setSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                lastScanAt: new Date().toISOString(),
                status: 'active',
              }
            : s,
        ),
      );
      setScanningId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen p-6 gradient-mesh-bg">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-700">接口源管理</h1>
            <p className="mt-1 text-sm text-ink-400">管理接入的 API 文档源，配置扫描与鉴权方式</p>
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
                    activeSystem === sys && 'bg-brand-50 text-brand-700 border-brand-200',
                  )}
                >
                  {sys}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button type="button" className="btn-secondary">
                <Upload className="h-4 w-4" />
                导入文档
              </button>
              <button type="button" className="btn-primary">
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
                          <span className="font-medium text-ink-700">{src.name}</span>
                          <span className="text-xs text-ink-400">v{src.currentVersion}</span>
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
                        <span className="font-mono font-semibold text-ink-600">{src.apiCount}</span>
                      </td>
                      <td className="text-ink-500 text-sm">{formatFromNow(src.lastScanAt)}</td>
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
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost h-8 w-8 p-0 text-danger-500 hover:text-danger-600"
                            title="删除"
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
                    <td colSpan={9} className="py-16 text-center text-ink-400">
                      暂无匹配的接口源
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
