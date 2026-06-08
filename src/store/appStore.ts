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
} from '@/types';
import { mockSources } from '@/mock/sources';
import { mockChanges } from '@/mock/changes';
import { mockWorkItems } from '@/mock/workItems';
import { mockAlertRules } from '@/mock/alerts';
import { mockScanHistories, mockImportRecords } from '@/mock/scan';

interface AppState {
  sources: ApiSource[];
  changes: ApiChange[];
  workItems: WorkItem[];
  alertRules: AlertRule[];
  scanHistories: ScanHistory[];
  importRecords: ImportRecord[];

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
}

export const useAppStore = create<AppState>((set, get) => ({
  sources: mockSources,
  changes: mockChanges,
  workItems: mockWorkItems,
  alertRules: mockAlertRules,
  scanHistories: mockScanHistories,
  importRecords: mockImportRecords,

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
}));
