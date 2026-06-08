import { useState } from 'react';
import { PageContainer } from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import type {
  ChangeSeverity,
  ChangeCategory,
  ChannelType,
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
  PowerOff,
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
  auth: '认证',
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

export default function Alerts() {
  const { alertRules, toggleAlertRule } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <PageContainer
      title="提醒规则"
      description="配置 API 变更的自动告警策略，多渠道通知相关负责人"
      actions={
        <button className="btn-primary">
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
            {alertRules.filter((r) => r.triggers.severities.includes('breaking')).length}
            <span className="ml-2 text-xs font-normal text-ink-400">
              条规则
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {alertRules.map((rule) => {
          const isExpanded = expandedId === rule.id;
          return (
            <div
              key={rule.id}
              className={cn(
                'glass-card transition-all overflow-hidden',
                !rule.enabled && 'opacity-60'
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
                          : 'bg-ink-100'
                      )}
                    >
                      <BellRing
                        className={cn(
                          'transition-colors',
                          rule.enabled ? 'text-white' : 'text-ink-400'
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
                        {rule.createdBy} · {new Date(rule.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAlertRule(rule.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                      rule.enabled ? 'bg-brand-500' : 'bg-ink-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
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

                <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                  <div className="flex items-center gap-1.5">
                    {rule.channels.map((ch, idx) => {
                      const Icon = channelIcons[ch.type];
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg',
                            channelColors[ch.type]
                          )}
                          title={channelLabels[ch.type]}
                        >
                          <Icon size={13} strokeWidth={1.8} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-500">
                    <Users size={13} strokeWidth={1.8} />
                    <span>{rule.subscribers.length} 人订阅</span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-ink-100 px-5 py-4 bg-ink-50/30 animate-fade-in">
                  <div className="text-xs text-ink-500">
                    详细配置可在编辑模式中查看
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
