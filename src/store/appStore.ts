import { create } from 'zustand';
import type {
  ApiSource,
  ApiChange,
  WorkItem,
  AlertRule,
  WorkStatus,
  WorkPriority,
  Comment,
  ScanHistory,
  ImportRecord,
  DiffSnapshot,
  ChangeCategory,
} from '@/types';
import { mockSources } from '@/mock/sources';
import { mockChanges } from '@/mock/changes';
import { mockWorkItems } from '@/mock/workItems';
import { mockAlertRules } from '@/mock/alerts';
import { mockScanHistories, mockImportRecords } from '@/mock/scan';

const emptyCategoryStats = (): Record<ChangeCategory, { added: number; removed: number; modified: number; breaking: number; total: number }> => ({
  path: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
  parameter: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
  field: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
  statusCode: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
  auth: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
  example: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
});

const mockDiffSnapshots: DiffSnapshot[] = [
  {
    id: 'ds-mock-001',
    sourceId: 'src001',
    leftSourceId: 'src001',
    rightSourceId: 'src001',
    versionFrom: '2.7.3',
    versionTo: '2.8.1',
    savedAt: '2026-06-08T15:30:00+08:00',
    savedBy: '沈知行',
    label: '支付中台 2.7.3 → 2.8.1 兼容性检查',
    summary: {
      totalChanges: 28,
      added: 8,
      removed: 5,
      modified: 15,
      breaking: 2,
      byCategory: {
        path: { added: 2, removed: 1, modified: 3, breaking: 1, total: 6 },
        parameter: { added: 3, removed: 1, modified: 4, breaking: 0, total: 8 },
        field: { added: 2, removed: 2, modified: 5, breaking: 1, total: 9 },
        statusCode: { added: 0, removed: 0, modified: 2, breaking: 0, total: 2 },
        auth: { added: 1, removed: 1, modified: 1, breaking: 0, total: 3 },
        example: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      },
    },
  },
  {
    id: 'ds-mock-002',
    sourceId: 'src002',
    leftSourceId: 'src002',
    rightSourceId: 'src002',
    versionFrom: '2.2.0',
    versionTo: '2.3.0',
    savedAt: '2026-06-07T10:15:00+08:00',
    savedBy: '苏清岚',
    label: '用户中心 v2.2 → v2.3 升级变更',
    summary: {
      totalChanges: 16,
      added: 6,
      removed: 2,
      modified: 8,
      breaking: 1,
      byCategory: {
        path: { added: 1, removed: 0, modified: 2, breaking: 0, total: 3 },
        parameter: { added: 2, removed: 1, modified: 3, breaking: 1, total: 6 },
        field: { added: 3, removed: 1, modified: 2, breaking: 0, total: 6 },
        statusCode: { added: 0, removed: 0, modified: 1, breaking: 0, total: 1 },
        auth: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
        example: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      },
    },
  },
  {
    id: 'ds-mock-003',
    sourceId: 'src003',
    leftSourceId: 'src003',
    rightSourceId: 'src003',
    versionFrom: '1.9.2',
    versionTo: '1.9.4',
    savedAt: '2026-06-06T18:00:00+08:00',
    savedBy: '周慕白',
    summary: {
      totalChanges: 12,
      added: 4,
      removed: 1,
      modified: 7,
      breaking: 0,
      byCategory: {
        path: { added: 1, removed: 0, modified: 1, breaking: 0, total: 2 },
        parameter: { added: 1, removed: 0, modified: 2, breaking: 0, total: 3 },
        field: { added: 2, removed: 1, modified: 3, breaking: 0, total: 6 },
        statusCode: { added: 0, removed: 0, modified: 1, breaking: 0, total: 1 },
        auth: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
        example: { added: 0, removed: 0, modified: 0, breaking: 0, total: 0 },
      },
    },
  },
];

interface AppState {
  sources: ApiSource[];
  changes: ApiChange[];
  workItems: WorkItem[];
  alertRules: AlertRule[];
  scanHistories: ScanHistory[];
  importRecords: ImportRecord[];
  diffSnapshots: DiffSnapshot[];

  setSources: (sources: ApiSource[]) => void;
  addSource: (source: ApiSource) => void;
  updateSource: (id: string, patch: Partial<ApiSource>) => void;
  removeSource: (id: string) => void;

  setWorkItemStatus: (id: string, status: WorkStatus) => void;
  setWorkItemPriority: (id: string, priority: WorkPriority) => void;
  assignWorkItem: (id: string, assignee: string) => void;
  addWorkItemComment: (id: string, comment: Comment) => void;
  addWorkItem: (item: WorkItem) => void;

  toggleAlertRule: (id: string) => void;
  addAlertRule: (rule: AlertRule) => void;
  updateAlertRule: (id: string, patch: Partial<AlertRule>) => void;
  removeAlertRule: (id: string) => void;

  addScanHistory: (scan: ScanHistory) => void;
  updateScanHistory: (id: string, patch: Partial<ScanHistory>) => void;
  addImportRecord: (rec: ImportRecord) => void;
  getScanHistoriesBySource: (sourceId: string) => ScanHistory[];
  getImportRecordsBySource: (sourceId: string) => ImportRecord[];
  setAlertRuleLastTested: (id: string, at: string) => void;

  getChangesForWorkItem: (workItemId: string) => ApiChange[];
  addChange: (change: Omit<ApiChange, 'id'> & { id?: string }) => string;
  addDiffSnapshot: (snap: DiffSnapshot) => string;
  removeDiffSnapshot: (id: string) => void;
  getDiffSnapshotsBySource: (sourceId: string) => DiffSnapshot[];
}

export const useAppStore = create<AppState>((set, get) => ({
  sources: mockSources,
  changes: mockChanges,
  workItems: mockWorkItems,
  alertRules: mockAlertRules,
  scanHistories: mockScanHistories,
  importRecords: mockImportRecords,
  diffSnapshots: mockDiffSnapshots,

  setSources: (sources) => set({ sources }),
  addSource: (source) =>
    set((state) => ({ sources: [source, ...state.sources] })),
  updateSource: (id, patch) =>
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    })),
  removeSource: (id) =>
    set((state) => ({ sources: state.sources.filter((s) => s.id !== id) })),

  setWorkItemStatus: (id, status) =>
    set((state) => ({
      workItems: state.workItems.map((w) =>
        w.id === id
          ? { ...w, status, updatedAt: new Date().toISOString() }
          : w,
      ),
    })),
  setWorkItemPriority: (id, priority) =>
    set((state) => ({
      workItems: state.workItems.map((w) =>
        w.id === id
          ? { ...w, priority, updatedAt: new Date().toISOString() }
          : w,
      ),
    })),
  assignWorkItem: (id, assignee) =>
    set((state) => ({
      workItems: state.workItems.map((w) =>
        w.id === id
          ? { ...w, assignee, updatedAt: new Date().toISOString() }
          : w,
      ),
    })),
  addWorkItemComment: (id, comment) =>
    set((state) => ({
      workItems: state.workItems.map((w) =>
        w.id === id
          ? {
              ...w,
              comments: [...w.comments, comment],
              updatedAt: new Date().toISOString(),
            }
          : w,
      ),
    })),
  addWorkItem: (item) =>
    set((state) => ({ workItems: [item, ...state.workItems] })),

  toggleAlertRule: (id) =>
    set((state) => ({
      alertRules: state.alertRules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r,
      ),
    })),
  addAlertRule: (rule) =>
    set((state) => ({ alertRules: [rule, ...state.alertRules] })),
  updateAlertRule: (id, patch) =>
    set((state) => ({
      alertRules: state.alertRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    })),
  removeAlertRule: (id) =>
    set((state) => ({
      alertRules: state.alertRules.filter((r) => r.id !== id),
    })),

  addScanHistory: (scan) =>
    set((state) => ({ scanHistories: [scan, ...state.scanHistories] })),
  updateScanHistory: (id, patch) =>
    set((state) => ({
      scanHistories: state.scanHistories.map((h) =>
        h.id === id ? { ...h, ...patch } : h,
      ),
    })),
  addImportRecord: (rec) =>
    set((state) => ({ importRecords: [rec, ...state.importRecords] })),
  getScanHistoriesBySource: (id) =>
    get()
      .scanHistories.filter((h) => h.sourceId === id)
      .sort((a, b) => new Date(b.scanAt).getTime() - new Date(a.scanAt).getTime()),
  getImportRecordsBySource: (id) =>
    get()
      .importRecords.filter((r) => r.sourceId === id)
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()),
  setAlertRuleLastTested: (id, at) =>
    set((state) => ({
      alertRules: state.alertRules.map((r) =>
        r.id === id ? { ...r, lastTestedAt: at } : r,
      ),
    })),

  getChangesForWorkItem: (workItemId: string) => {
    const wi = get().workItems.find((w) => w.id === workItemId);
    if (!wi) return [];
    return get().changes.filter((c) => wi.changeIds.includes(c.id));
  },
  addChange: (change) => {
    const id = change.id || ('ch-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    set((state) => ({ changes: [{ ...change, id }, ...state.changes] }));
    return id;
  },
  addDiffSnapshot: (snap) => {
    set((state) => ({ diffSnapshots: [snap, ...state.diffSnapshots] }));
    return snap.id;
  },
  removeDiffSnapshot: (id) =>
    set((state) => ({
      diffSnapshots: state.diffSnapshots.filter((s) => s.id !== id),
    })),
  getDiffSnapshotsBySource: (id) =>
    get()
      .diffSnapshots.filter((s) => s.sourceId === id)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
}));
