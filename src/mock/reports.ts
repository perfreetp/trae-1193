import type { TrendPoint, WeeklyReport } from '@/types';

export const mockMonthlyTrend: TrendPoint[] = [
  { date: '04-07', breaking: 2, normal: 4, minor: 5, total: 11 },
  { date: '04-08', breaking: 4, normal: 6, minor: 3, total: 13 },
  { date: '04-09', breaking: 1, normal: 3, minor: 7, total: 11 },
  { date: '04-10', breaking: 3, normal: 5, minor: 4, total: 12 },
  { date: '04-11', breaking: 1, normal: 4, minor: 6, total: 11 },
  { date: '04-12', breaking: 5, normal: 7, minor: 3, total: 15 },
  { date: '04-13', breaking: 2, normal: 3, minor: 5, total: 10 },
  { date: '04-14', breaking: 0, normal: 2, minor: 4, total: 6 },
  { date: '04-15', breaking: 4, normal: 6, minor: 2, total: 12 },
  { date: '04-16', breaking: 1, normal: 5, minor: 7, total: 13 },
  { date: '04-17', breaking: 3, normal: 8, minor: 5, total: 16 },
  { date: '04-18', breaking: 6, normal: 4, minor: 3, total: 13 },
  { date: '04-19', breaking: 2, normal: 3, minor: 6, total: 11 },
  { date: '04-20', breaking: 1, normal: 7, minor: 4, total: 12 },
  { date: '04-21', breaking: 4, normal: 5, minor: 5, total: 14 },
  { date: '04-22', breaking: 0, normal: 2, minor: 8, total: 10 },
  { date: '04-23', breaking: 2, normal: 4, minor: 3, total: 9 },
  { date: '04-24', breaking: 5, normal: 6, minor: 2, total: 13 },
  { date: '04-25', breaking: 3, normal: 8, minor: 4, total: 15 },
  { date: '04-26', breaking: 1, normal: 3, minor: 7, total: 11 },
  { date: '04-27', breaking: 4, normal: 5, minor: 6, total: 15 },
  { date: '04-28', breaking: 2, normal: 7, minor: 4, total: 13 },
  { date: '04-29', breaking: 0, normal: 2, minor: 3, total: 5 },
  { date: '04-30', breaking: 3, normal: 6, minor: 5, total: 14 },
  { date: '05-01', breaking: 2, normal: 4, minor: 6, total: 12 },
  { date: '05-02', breaking: 5, normal: 8, minor: 2, total: 15 },
  { date: '05-03', breaking: 1, normal: 5, minor: 7, total: 13 },
  { date: '05-04', breaking: 3, normal: 4, minor: 3, total: 10 },
  { date: '05-05', breaking: 4, normal: 6, minor: 5, total: 15 },
  { date: '05-06', breaking: 2, normal: 3, minor: 6, total: 11 },
  { date: '05-07', breaking: 6, normal: 7, minor: 4, total: 17 },
  { date: '05-08', breaking: 3, normal: 5, minor: 2, total: 10 },
  { date: '05-09', breaking: 5, normal: 3, minor: 2, total: 10 },
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

const systemsPool = ['支付中台', '用户中心', '商品中心', '营销中心', '风控中心', '物流中心'];

function genBySystem(seed: number) {
  return systemsPool.map((system, i) => {
    const changes = 5 + ((seed * 3 + i * 7) % 25);
    const breaking = Math.floor(changes * (0.1 + ((seed + i) % 5) * 0.08));
    return { system, changes, breaking };
  });
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
      '风控中心模型升级完成，误报率下降 15%。',
    ],
    risks: [
      '支付中台回调地址变更仍有 2 个消费方未完成适配，截止 6/5。',
      '用户中心登录接口超时告警连续 3 天出现，需排查。',
    ],
    progress: [
      '已关闭工单 12 件，其中破坏性变更 4 件。',
      '平均处理时长环比下降 8%。',
      '新增告警规则 2 条，覆盖参数缺失与返回码异常。',
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
      '用户中心注册流程拆分改造完成，接口响应提升 40%。',
      '新增 3 个告警规则，覆盖参数校验与鉴权异常场景。',
      '商品中心类目接口标准化完成，统一分页规范。',
    ],
    risks: [
      '营销中心优惠券发放接口存在竞态条件风险。',
    ],
    progress: [
      '已关闭工单 9 件，破坏性变更处理率 85%。',
      '接入数据源自 4 个扩至 5 个，新增营销中心。',
      '文档中心上线接口变更历史查询功能。',
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
  {
    weekStart: '2026-05-12',
    weekEnd: '2026-05-18',
    summary: {
      totalSources: 4,
      totalChanges: 54,
      breakingCount: 16,
      resolvedRate: 0.65,
      avgHandleHours: 24.3,
    },
    highlights: [
      '风控中心规则引擎 V2 上线，支持实时规则变更。',
      '支付中台对账接口重构，性能提升 3 倍。',
      'API 网关统一接入 trace 链路追踪。',
    ],
    risks: [
      '物流中心运单接口字段命名不一致，需跨团队协调统一。',
      '商品中心库存接口 QPS 上限告警，评估扩容方案。',
    ],
    progress: [
      '已关闭工单 7 件，解决率环比提升 3%。',
      '完成所有接口响应码标准化梳理。',
      '接入告警飞书通知通道，触达时效提升。',
    ],
    bySystem: genBySystem(4).slice(0, 4),
    trend: mockMonthlyTrend.slice(-28, -21),
  },
  {
    weekStart: '2026-05-05',
    weekEnd: '2026-05-11',
    summary: {
      totalSources: 4,
      totalChanges: 47,
      breakingCount: 14,
      resolvedRate: 0.62,
      avgHandleHours: 26.7,
    },
    highlights: [
      '用户中心 OAuth2.0 授权流程改造完成。',
      '新增接口健康度仪表盘，实时观测可用率。',
      '支付中台提现接口增加防重放机制。',
    ],
    risks: [
      '风控中心名单接口平均响应时间超阈值 30%。',
    ],
    progress: [
      '已关闭工单 6 件，积压工单清零。',
      '完成 API 版本管理规范初稿评审。',
      '上线接口变更周报自动推送邮件。',
    ],
    bySystem: genBySystem(5).slice(0, 4),
    trend: mockMonthlyTrend.slice(-35, -28),
  },
  {
    weekStart: '2026-04-28',
    weekEnd: '2026-05-04',
    summary: {
      totalSources: 3,
      totalChanges: 41,
      breakingCount: 12,
      resolvedRate: 0.58,
      avgHandleHours: 29.1,
    },
    highlights: [
      '商品中心搜索接口升级支持多维过滤。',
      '统一错误码规范落地，系统覆盖率 80%。',
      'API 文档自动生成工具上线 v1.0。',
    ],
    risks: [
      '支付中台子商户进件接口存在字段缺失兼容问题。',
      '用户中心短信验证码存在重复发送风险。',
    ],
    progress: [
      '已关闭工单 5 件，平均响应时长下降 5%。',
      '新增鉴权变更自动检测规则。',
      '数据源自 3 个扩至 4 个，接入风控中心。',
    ],
    bySystem: genBySystem(6).slice(0, 3),
    trend: mockMonthlyTrend.slice(-42, -35),
  },
  {
    weekStart: '2026-04-21',
    weekEnd: '2026-04-27',
    summary: {
      totalSources: 3,
      totalChanges: 35,
      breakingCount: 10,
      resolvedRate: 0.55,
      avgHandleHours: 31.4,
    },
    highlights: [
      '支付中台交易流水查询接口支持分页。',
      '用户中心账号冻结/解冻接口上线。',
      '商品中心批量操作接口优化，减少 50% 网络请求。',
    ],
    risks: [
      '商品中心类目树深度超阈值，评估重构方案。',
    ],
    progress: [
      '已关闭工单 4 件。',
      '完成 API 变更治理流程规范初稿。',
      '接入钉钉告警通知通道。',
    ],
    bySystem: genBySystem(7).slice(0, 3),
    trend: mockMonthlyTrend.slice(-49, -42),
  },
  {
    weekStart: '2026-04-14',
    weekEnd: '2026-04-20',
    summary: {
      totalSources: 2,
      totalChanges: 28,
      breakingCount: 8,
      resolvedRate: 0.52,
      avgHandleHours: 33.8,
    },
    highlights: [
      '治理平台 MVP 版本发布，支持 OpenAPI3 解析。',
      '支付中台与用户中心首批接入扫描。',
      '周度报表模板 v1 定稿。',
    ],
    risks: [
      '扫描引擎解析大型 Spec 超时，优化分片策略中。',
      '变更检测误报率偏高，持续调优规则。',
    ],
    progress: [
      '平台基础功能上线，支持变更检测。',
      '建立风险分级标准（P0-P3）。',
      '完成首次治理流程演练。',
    ],
    bySystem: genBySystem(8).slice(0, 2),
    trend: mockMonthlyTrend.slice(-56, -49),
  },
  {
    weekStart: '2026-04-07',
    weekEnd: '2026-04-13',
    summary: {
      totalSources: 1,
      totalChanges: 15,
      breakingCount: 4,
      resolvedRate: 0.5,
      avgHandleHours: 36.2,
    },
    highlights: [
      '治理平台立项启动，完成技术选型评审。',
      'OpenAPI 解析引擎 PoC 验证通过。',
      '支付中台独家中枢接口源接入试点。',
    ],
    risks: [
      '项目排期紧张，需提前协调前后端资源。',
    ],
    progress: [
      '完成需求文档 v0.5 评审。',
      '搭建前后端基础脚手架。',
      '确定周报推送机制与格式。',
    ],
    bySystem: genBySystem(9).slice(0, 1),
    trend: mockMonthlyTrend.slice(-63, -56),
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
