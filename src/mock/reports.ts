import type { TrendPoint, WeeklyReport } from '@/types';

export const mockMonthlyTrend: TrendPoint[] = [
  { date: '05-10', breaking: 3, normal: 5, minor: 4, total: 12 },
  { date: '05-11', breaking: 1, normal: 4, minor: 6, total: 11 },
  { date: '05-12', breaking: 5, normal: 7, minor: 3, total: 15 },
  { date: '05-13', breaking: 2, normal: 3, minor: 5, total: 10 },
  { date: '05-14', breaking: 0, normal: 2, minor: 4, total: 6 },
  { date: '05-15', breaking: 4, normal: 6, minor: 2, total: 12 },
  { date: '05-16', breaking: 1, normal: 5, minor: 7, total: 13 },
  { date: '05-17', breaking: 3, normal: 8, minor: 5, total: 16 },
  { date: '05-18', breaking: 6, normal: 4, minor: 3, total: 13 },
  { date: '05-19', breaking: 2, normal: 3, minor: 6, total: 11 },
  { date: '05-20', breaking: 1, normal: 7, minor: 4, total: 12 },
  { date: '05-21', breaking: 4, normal: 5, minor: 5, total: 14 },
  { date: '05-22', breaking: 0, normal: 2, minor: 8, total: 10 },
  { date: '05-23', breaking: 2, normal: 4, minor: 3, total: 9 },
  { date: '05-24', breaking: 5, normal: 6, minor: 2, total: 13 },
  { date: '05-25', breaking: 3, normal: 8, minor: 4, total: 15 },
  { date: '05-26', breaking: 1, normal: 3, minor: 7, total: 11 },
  { date: '05-27', breaking: 4, normal: 5, minor: 6, total: 15 },
  { date: '05-28', breaking: 2, normal: 7, minor: 4, total: 13 },
  { date: '05-29', breaking: 0, normal: 2, minor: 3, total: 5 },
  { date: '05-30', breaking: 3, normal: 6, minor: 5, total: 14 },
  { date: '05-31', breaking: 2, normal: 4, minor: 6, total: 12 },
  { date: '06-01', breaking: 5, normal: 8, minor: 2, total: 15 },
  { date: '06-02', breaking: 1, normal: 5, minor: 7, total: 13 },
  { date: '06-03', breaking: 3, normal: 4, minor: 3, total: 10 },
  { date: '06-04', breaking: 4, normal: 6, minor: 5, total: 15 },
  { date: '06-05', breaking: 2, normal: 3, minor: 6, total: 11 },
  { date: '06-06', breaking: 6, normal: 7, minor: 4, total: 17 },
  { date: '06-07', breaking: 3, normal: 5, minor: 2, total: 10 },
  { date: '06-08', breaking: 5, normal: 3, minor: 2, total: 10 },
];

export const mockWeeklyReport: WeeklyReport = {
  weekStart: '2026-06-02',
  weekEnd: '2026-06-08',
  summary: {
    totalSources: 6,
    totalChanges: 88,
    breakingCount: 23,
    resolvedRate: 0.74,
    avgHandleHours: 18.6,
  },
  highlights: [
    '支付中台完成退款金额单位标准化改造，已灰度发布至 30% 流量。',
    '用户中心 Token 会话安全优化通过评审，6/15 全量上线。',
    '新增接口源：物流中心-订单路由 接入完成，共 24 个接口。',
  ],
  risks: [
    '风控 AppId 强制校验仍有 3 个调用方未完成改造，截止日期 6/14，需重点跟进。',
    '营销中心活动引擎扫描暂停 11 天，建议尽快恢复 3.0.0-beta 版回归。',
  ],
  progress: [
    '已关闭工单 17 件，其中破坏性变更 6 件。',
    '平均处理时长环比下降 12%。',
    '本周新增规则「核心接口鉴权与状态码变更」短信告警通道。',
  ],
  bySystem: [
    { system: '支付中台', changes: 18, breaking: 5 },
    { system: '用户中心', changes: 22, breaking: 8 },
    { system: '商品中心', changes: 11, breaking: 0 },
    { system: '营销中心', changes: 6, breaking: 1 },
    { system: '风控中心', changes: 24, breaking: 7 },
    { system: '物流中心', changes: 7, breaking: 2 },
  ],
  trend: mockMonthlyTrend.slice(-7),
};

export interface HeatmapCell {
  system: string;
  category: string;
  value: number;
}

export const mockReports: WeeklyReport[] = [
  mockWeeklyReport,
  {
    weekStart: '2026-05-26',
    weekEnd: '2026-06-01',
    summary: {
      totalSources: 5,
      totalChanges: 76,
      breakingCount: 25,
      resolvedRate: 0.68,
      avgHandleHours: 20.1,
    },
    highlights: [
      '商品中心完成价格体系重构，全部接口向后兼容。',
      '网关层新增自动熔断策略覆盖 12 个核心接口。',
    ],
    risks: [
      '支付中台回调地址变更仍有 2 个消费方未完成适配。',
    ],
    progress: [
      '已关闭工单 12 件，其中破坏性变更 4 件。',
      '平均处理时长环比下降 8%。',
    ],
    bySystem: [
      { system: '支付中台', changes: 14, breaking: 6 },
      { system: '用户中心', changes: 19, breaking: 9 },
      { system: '商品中心', changes: 15, breaking: 2 },
      { system: '风控中心', changes: 21, breaking: 6 },
      { system: '物流中心', changes: 7, breaking: 2 },
    ],
    trend: mockMonthlyTrend.slice(-14, -7),
  },
  {
    weekStart: '2026-05-19',
    weekEnd: '2026-05-25',
    summary: {
      totalSources: 5,
      totalChanges: 62,
      breakingCount: 18,
      resolvedRate: 0.71,
      avgHandleHours: 21.8,
    },
    highlights: [
      '用户中心注册流程拆分改造完成。',
      '新增 3 个告警规则，覆盖参数校验场景。',
    ],
    risks: [],
    progress: [
      '已关闭工单 9 件。',
      '接入数据源自 5 个扩至 6 个。',
    ],
    bySystem: [
      { system: '支付中台', changes: 11, breaking: 3 },
      { system: '用户中心', changes: 18, breaking: 5 },
      { system: '商品中心', changes: 12, breaking: 4 },
      { system: '风控中心', changes: 16, breaking: 4 },
      { system: '物流中心', changes: 5, breaking: 2 },
    ],
    trend: mockMonthlyTrend.slice(-21, -14),
  },
];

export const mockHeatmapData: HeatmapCell[] = [
  { system: '支付中台', category: '路径', value: 2 },
  { system: '支付中台', category: '参数', value: 6 },
  { system: '支付中台', category: '字段', value: 8 },
  { system: '支付中台', category: '状态码', value: 3 },
  { system: '支付中台', category: '鉴权', value: 1 },
  { system: '支付中台', category: '示例', value: 4 },
  { system: '用户中心', category: '路径', value: 4 },
  { system: '用户中心', category: '参数', value: 7 },
  { system: '用户中心', category: '字段', value: 12 },
  { system: '用户中心', category: '状态码', value: 2 },
  { system: '用户中心', category: '鉴权', value: 6 },
  { system: '用户中心', category: '示例', value: 3 },
  { system: '商品中心', category: '路径', value: 0 },
  { system: '商品中心', category: '参数', value: 3 },
  { system: '商品中心', category: '字段', value: 5 },
  { system: '商品中心', category: '状态码', value: 1 },
  { system: '商品中心', category: '鉴权', value: 0 },
  { system: '商品中心', category: '示例', value: 6 },
  { system: '风控中心', category: '路径', value: 1 },
  { system: '风控中心', category: '参数', value: 10 },
  { system: '风控中心', category: '字段', value: 7 },
  { system: '风控中心', category: '状态码', value: 4 },
  { system: '风控中心', category: '鉴权', value: 3 },
  { system: '风控中心', category: '示例', value: 2 },
  { system: '物流中心', category: '路径', value: 1 },
  { system: '物流中心', category: '参数', value: 2 },
  { system: '物流中心', category: '字段', value: 4 },
  { system: '物流中心', category: '状态码', value: 0 },
  { system: '物流中心', category: '鉴权', value: 1 },
  { system: '物流中心', category: '示例', value: 2 },
];
