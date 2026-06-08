import type { AlertRule } from '@/types';

export const mockAlertRules: AlertRule[] = [
  {
    id: 'ar001',
    name: '破坏性变更紧急推送',
    enabled: true,
    triggers: {
      severities: ['breaking'],
      categories: [
        'path',
        'parameter',
        'field',
        'statusCode',
        'auth',
        'example',
      ],
    },
    channels: [
      {
        type: 'dingtalk',
        config: {
          webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
          secret: 'SECxxx',
          atMobiles: '13800000001,13800000002',
        },
      },
      {
        type: 'email',
        config: {
          recipients: 'all-tech@corp.com; product-leads@corp.com',
          subjectTemplate: '[API 破坏性变更告警] ${title}',
        },
      },
    ],
    subscribers: ['u001', 'u002', 'u003', 'u004', 'u007'],
    createdAt: '2026-01-10T09:00:00+08:00',
    createdBy: '叶知秋',
  },
  {
    id: 'ar002',
    name: '支付中台-全部变更',
    enabled: true,
    triggers: {
      severities: ['breaking', 'normal', 'minor'],
      categories: [
        'path',
        'parameter',
        'field',
        'statusCode',
        'auth',
        'example',
      ],
      sources: ['src001'],
    },
    channels: [
      {
        type: 'feishu',
        config: {
          webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx',
        },
      },
    ],
    subscribers: ['u003', 'u005', 'u006'],
    quietHours: {
      start: '23:00',
      end: '08:00',
      mergeDigests: true,
    },
    createdAt: '2026-02-15T14:00:00+08:00',
    createdBy: '沈知行',
  },
  {
    id: 'ar003',
    name: '核心接口鉴权与状态码变更',
    enabled: true,
    triggers: {
      severities: ['breaking', 'normal'],
      categories: ['auth', 'statusCode'],
    },
    channels: [
      {
        type: 'sms',
        config: {
          signName: '企业架构组',
          templateCode: 'SMS_API_CHANGE_2026',
          phones: '13800000001',
        },
      },
      {
        type: 'email',
        config: { recipients: 'security@corp.com' },
      },
    ],
    subscribers: ['u007'],
    createdAt: '2026-03-01T10:00:00+08:00',
    createdBy: '叶知秋',
  },
  {
    id: 'ar004',
    name: '测试环境每日变更摘要',
    enabled: false,
    triggers: {
      severities: ['breaking', 'normal', 'minor'],
      categories: ['field', 'parameter', 'example'],
    },
    channels: [
      {
        type: 'email',
        config: { recipients: 'qa-team@corp.com' },
      },
    ],
    subscribers: ['u002', 'u008'],
    createdAt: '2026-04-20T11:00:00+08:00',
    createdBy: '陈墨白',
  },
];

export const channelTypeLabels: Record<string, string> = {
  email: '邮件',
  dingtalk: '钉钉',
  feishu: '飞书',
  sms: '短信',
};
