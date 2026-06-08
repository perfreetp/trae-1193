import { create } from 'zustand';
import type {
  ApiSource,
  ApiChange,
  WorkItem,
  AlertRule,
  WorkStatus,
  WorkPriority,
  Comment,
} from '@/types';
import { mockSources } from '@/mock/sources';
import { mockChanges } from '@/mock/changes';
import { mockWorkItems } from '@/mock/workItems';
import { mockAlertRules } from '@/mock/alerts';

interface AppState {
  sources: ApiSource[];
  changes: ApiChange[];
  workItems: WorkItem[];
  alertRules: AlertRule[];

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
}

export const useAppStore = create<AppState>((set, get) => ({
  sources: mockSources,
  changes: mockChanges,
  workItems: mockWorkItems,
  alertRules: mockAlertRules,

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

  getChangesForWorkItem: (workItemId: string) => {
    const wi = get().workItems.find((w) => w.id === workItemId);
    if (!wi) return [];
    return get().changes.filter((c) => wi.changeIds.includes(c.id));
  },
}));
