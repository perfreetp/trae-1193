import type { ScanHistory, ImportRecord } from '@/types';
import { mockSources } from '@/mock/sources';
import { mockUsers } from '@/mock/users';

const userNames = mockUsers.map((u) => u.name);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genScanHistoriesForSource(
  source: (typeof mockSources)[number],
): ScanHistory[] {
  const count = randInt(4, 6);
  const histories: ScanHistory[] = [];
  let currentApiCount = Math.max(5, source.apiCount - randInt(10, 20));

  const startDate = new Date('2026-01-15T10:00:00+08:00');
  const endDate = new Date(source.lastScanAt);
  const totalMs = endDate.getTime() - startDate.getTime();

  const versionParts = source.currentVersion
    .replace('-beta', '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  let [major, minor, patch] = versionParts;
  patch = Math.max(0, patch - (count - 1));

  for (let i = 0; i < count; i++) {
    const progress = count === 1 ? 1 : i / (count - 1);
    const scanTime = new Date(startDate.getTime() + totalMs * progress);
    const isLast = i === count - 1;
    const failIndex = count >= 5 ? Math.floor(count / 2) : -1;
    const isFail = i === failIndex;

    const version = `${major}.${minor}.${patch}${source.currentVersion.includes('beta') && isLast ? '-beta' : ''}`;
    patch++;

    let apiCountDelta = 0;
    let newApis = 0;
    let modifiedApis = 0;
    let removedApis = 0;
    let breakingChanges = 0;

    if (isFail) {
      apiCountDelta = 0;
    } else {
      newApis = randInt(0, 6);
      modifiedApis = randInt(1, 8);
      removedApis = Math.random() > 0.6 ? randInt(0, 3) : 0;
      apiCountDelta = newApis - removedApis + (Math.random() > 0.8 ? randInt(-2, 2) : 0);
      breakingChanges = Math.random() > 0.7 ? randInt(1, 3) : 0;
      currentApiCount = Math.max(3, currentApiCount + apiCountDelta);
    }

    const totalChanges = newApis + modifiedApis + removedApis;

    const status: ScanHistory['status'] = isFail ? 'failed' : 'success';

    const triggeredByOptions: ScanHistory['triggeredBy'][] = isLast
      ? ['manual', 'scheduled', 'import']
      : ['scheduled', 'scheduled', 'manual'];
    const triggeredBy = pick(triggeredByOptions);

    const history: ScanHistory = {
      id: `sh-${source.id}-${i + 1}`,
      sourceId: source.id,
      version,
      scanAt: scanTime.toISOString(),
      status,
      triggeredBy,
      durationMs: randInt(2000, 30000),
      apiCount: currentApiCount,
      apiCountDelta,
      newApis,
      modifiedApis,
      removedApis,
      totalChanges,
      breakingChanges,
    };

    if (isFail) {
      history.failReason = '连接超时：基地址 504 Gateway Timeout';
    }

    if (triggeredBy === 'manual') {
      history.operator = pick(userNames);
    }

    histories.push(history);
  }

  return histories;
}

export const mockScanHistories: ScanHistory[] =
  mockSources.flatMap(genScanHistoriesForSource);

const importTemplates: Array<{
  sourceId: string;
  fileName: string;
  docType: ImportRecord['docType'];
  importMode: ImportRecord['importMode'];
  versionBefore: string;
  versionAfter: string;
  parsedApiCount: number;
  apiCountDelta: number;
  conflictCount?: number;
  notes?: string;
}> = [
  {
    sourceId: 'src001',
    fileName: 'pay-api-v1.json',
    docType: 'openapi3',
    importMode: 'overwrite',
    versionBefore: '2.5.0',
    versionAfter: '2.6.0',
    parsedApiCount: 35,
    apiCountDelta: 5,
    conflictCount: 2,
    notes: '支付接口重构，新增退款查询批量接口',
  },
  {
    sourceId: 'src001',
    fileName: 'pay-api-v2-patch.yaml',
    docType: 'openapi3',
    importMode: 'append',
    versionBefore: '2.7.3',
    versionAfter: '2.7.4',
    parsedApiCount: 4,
    apiCountDelta: 3,
    notes: '追加对账相关接口',
  },
  {
    sourceId: 'src002',
    fileName: 'user-account.yaml',
    docType: 'swagger2',
    importMode: 'overwrite',
    versionBefore: '2.0.0',
    versionAfter: '2.1.0',
    parsedApiCount: 22,
    apiCountDelta: 4,
    notes: '用户账户服务 OpenAPI 2.0 迁移导入',
  },
  {
    sourceId: 'src003',
    fileName: 'goods-postman-collection.json',
    docType: 'postman',
    importMode: 'append',
    versionBefore: '1.7.0',
    versionAfter: '1.7.1',
    parsedApiCount: 12,
    apiCountDelta: 8,
    conflictCount: 1,
    notes: '从 Postman 集合导入商品批量操作接口',
  },
  {
    sourceId: 'src004',
    fileName: 'marketing-activity.md',
    docType: 'markdown',
    importMode: 'overwrite',
    versionBefore: '2.9.0',
    versionAfter: '3.0.0',
    parsedApiCount: 28,
    apiCountDelta: 6,
    notes: 'Markdown 格式文档解析，v3 大版本升级',
  },
];

export const mockImportRecords: ImportRecord[] = importTemplates.map(
  (tpl, idx) => {
    const source = mockSources.find((s) => s.id === tpl.sourceId)!;
    const importDate = new Date(source.createdAt);
    importDate.setMonth(importDate.getMonth() + randInt(1, 4));
    importDate.setDate(randInt(1, 28));

    return {
      id: `ir-${idx + 1}`,
      sourceId: tpl.sourceId,
      fileName: tpl.fileName,
      docType: tpl.docType,
      importMode: tpl.importMode,
      importedBy: pick(userNames),
      importedAt: importDate.toISOString(),
      parsedApiCount: tpl.parsedApiCount,
      versionBefore: tpl.versionBefore,
      versionAfter: tpl.versionAfter,
      apiCountDelta: tpl.apiCountDelta,
      conflictCount: tpl.conflictCount,
      notes: tpl.notes,
    };
  },
);
