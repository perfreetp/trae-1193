import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/Layout';
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  ChevronRight,
  X,
  Send,
  User,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Timer,
  Eye,
  Link2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { mockUsers } from '@/mock/users';
import { changeCategoryLabels, mockChanges } from '@/mock/changes';
import type { WorkStatus, WorkPriority, ApiChange, Comment } from '@/types';
import { PriorityBadge, SeverityBadge, StatusBadge, MethodBadge } from '@/components/UI/Badges';
import { formatFromNow } from '@/utils';
import { cn } from '@/lib/utils';

const workStatusConfig: Record<WorkStatus, { label: string; accentClass: string; iconClass: string }> = {
  pending_review: {
    label: '待评审',
    accentClass: 'bg-warning-500',
    iconClass: 'text-warning-600 bg-warning-100',
  },
  in_progress: {
    label: '处理中',
    accentClass: 'bg-brand-500',
    iconClass: 'text-brand-600 bg-brand-100',
  },
  awaiting_verify: {
    label: '待验证',
    accentClass: 'bg-violet-500',
    iconClass: 'text-violet-600 bg-violet-100',
  },
  closed: {
    label: '已关闭',
    accentClass: 'bg-success-500',
    iconClass: 'text-success-600 bg-success-100',
  },
};

const priorityList: (WorkPriority | 'all')[] = ['all', 'critical', 'high', 'medium', 'low'];
const priorityLabels: Record<WorkPriority | 'all', string> = {
  all: '全部',
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const statusIcons: Record<WorkStatus, typeof Circle> = {
  pending_review: AlertCircle,
  in_progress: Timer,
  awaiting_verify: Eye,
  closed: CheckCircle2,
};

const avatarColors = [
  'from-brand-400 to-brand-600',
  'from-violet-400 to-violet-600',
  'from-success-400 to-success-600',
  'from-warning-400 to-warning-600',
  'from-danger-400 to-danger-600',
  'from-pink-400 to-pink-600',
  'from-cyan-400 to-cyan-600',
  'from-amber-400 to-amber-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.slice(0, 2);
  const sizes = {
    sm: 'h-5 w-5 text-[9px]',
    md: 'h-7 w-7 text-[11px]',
    lg: 'h-10 w-10 text-sm',
  };
  return (
    <div
      className={cn(
        'shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white',
        getAvatarColor(name),
        sizes[size]
      )}
    >
      {initials}
    </div>
  );
}

function getWorkItemChanges(changeIds: string[]): ApiChange[] {
  return mockChanges.filter((c) => changeIds.includes(c.id));
}

export default function Review() {
  const workItems = useAppStore((s) => s.workItems);
  const setWorkItemStatus = useAppStore((s) => s.setWorkItemStatus);
  const setWorkItemPriority = useAppStore((s) => s.setWorkItemPriority);
  const assignWorkItem = useAppStore((s) => s.assignWorkItem);
  const addWorkItemComment = useAppStore((s) => s.addWorkItemComment);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<WorkPriority | 'all'>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string | 'all'>('all');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [assigneeDrawerDropdownOpen, setAssigneeDrawerDropdownOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [dragOverStatus, setDragOverStatus] = useState<WorkStatus | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const drawerWrapperRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    return workItems.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.assignee && item.assignee.toLowerCase().includes(searchText.toLowerCase())) ||
        item.reporter.toLowerCase().includes(searchText.toLowerCase());
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesAssignee =
        selectedAssignee === 'all' || item.assignee === selectedAssignee;
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [workItems, searchText, selectedPriority, selectedAssignee]);

  const groupedItems = useMemo(() => {
    const groups: Record<WorkStatus, typeof workItems> = {
      pending_review: [],
      in_progress: [],
      awaiting_verify: [],
      closed: [],
    };
    filteredItems.forEach((item) => {
      groups[item.status].push(item);
    });
    return groups;
  }, [filteredItems]);

  const selectedItem = workItems.find((w) => w.id === selectedId);
  const selectedItemChanges = selectedItem ? getWorkItemChanges(selectedItem.changeIds) : [];
  const firstChangeSeverity = selectedItemChanges[0]?.severity;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, status: WorkStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: WorkStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setWorkItemStatus(id, status);
    }
    setDragOverStatus(null);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDragOverStatus(null);
    setDraggedId(null);
  };

  const handleSendComment = () => {
    if (!selectedItem || !commentText.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: '林若曦',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    addWorkItemComment(selectedItem.id, comment);
    setCommentText('');
  };

  return (
    <div className="gradient-mesh-bg min-h-[calc(100vh-4rem)]">
      <PageContainer
        title="评审协作看板"
        description="跨团队协作，推进 API 变更工单从评审到落地的全流程管理"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                size={14}
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="搜索工单标题、负责人..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 rounded-xl border border-ink-200 bg-white text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div className="flex items-center gap-1">
              {priorityList.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    selectedPriority === p
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-white border border-ink-200 text-ink-600 hover:border-brand-300 hover:text-brand-600'
                  )}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>

            <div className="relative" ref={assigneeDropdownRef}>
              <button
                onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ink-200 bg-white text-sm text-ink-700 hover:border-brand-300 transition-colors"
              >
                <User size={14} strokeWidth={2} className="text-ink-400" />
                <span className={selectedAssignee === 'all' ? 'text-ink-500' : ''}>
                  {selectedAssignee === 'all' ? '全部负责人' : selectedAssignee}
                </span>
                <ChevronDown size={14} strokeWidth={2} className="text-ink-400" />
              </button>
              {assigneeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-2 w-52 rounded-xl border border-ink-100 bg-white shadow-cardHover p-1.5 z-50"
                >
                  <button
                    onClick={() => {
                      setSelectedAssignee('all');
                      setAssigneeDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedAssignee === 'all'
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    全部负责人
                  </button>
                  {mockUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedAssignee(u.name);
                        setAssigneeDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedAssignee === u.name
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-600 hover:bg-ink-50'
                      )}
                    >
                      <Avatar name={u.name} size="sm" />
                      <span className="flex-1 text-left">{u.name}</span>
                      <span className="text-[10px] text-ink-400">{u.department}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <button className="btn-primary">
              <Plus size={16} strokeWidth={1.8} />
              新建工单
            </button>
          </div>
        }
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-14rem)]">
          {(Object.keys(groupedItems) as WorkStatus[]).map((status, colIdx) => {
            const Icon = statusIcons[status];
            const config = workStatusConfig[status];
            const items = groupedItems[status];
            const isDragOver = dragOverStatus === status;

            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: colIdx * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                className={cn(
                  'kanban-column transition-all duration-200',
                  isDragOver && 'ring-2 ring-brand-400 ring-offset-2 bg-brand-50/60 border-brand-200'
                )}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        config.iconClass
                      )}
                    >
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold text-ink-700">{config.label}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-md text-[11px] font-bold text-white min-w-[20px] text-center',
                        config.accentClass
                      )}
                    >
                      {items.length}
                    </span>
                  </div>
                  <button className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-400 hover:bg-white hover:text-ink-600 transition-colors">
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>

                <div className="flex-1 space-y-2.5 min-h-[100px]">
                  {items.map((item, cardIdx) => {
                    const changes = getWorkItemChanges(item.changeIds);
                    const firstChange = changes[0];
                    const isDragging = draggedId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e as unknown as React.DragEvent, item.id)
                        }
                        onDragEnd={handleDragEnd as unknown as () => void}
                        onClick={() => setSelectedId(item.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: isDragging ? 0.4 : 1,
                          y: 0,
                          scale: isDragging ? 0.98 : 1,
                        }}
                        transition={{
                          duration: 0.25,
                          delay: cardIdx * 0.03,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                        className={cn(
                          'kanban-card animate-fade-in-up',
                          selectedId === item.id && 'ring-2 ring-brand-400 ring-offset-1'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <PriorityBadge priority={item.priority} />
                          <div className="flex items-center gap-1 shrink-0">
                            {firstChange && firstChangeSeverity && (
                              <SeverityBadge severity={firstChange.severity} />
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-ink-700 mb-1.5 leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        {firstChange && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <CodeIcon />
                            <code className="text-[11px] text-ink-500 font-mono truncate max-w-[180px]">
                              {firstChange.endpoint}
                            </code>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-ink-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={item.assignee ?? item.reporter} size="sm" />
                            <span className="text-xs text-ink-500 truncate max-w-[80px]">
                              {item.assignee ?? item.reporter}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-ink-400">
                              <MessageSquare size={11} strokeWidth={2} />
                              {item.comments.length}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-ink-400">
                              <Clock size={11} strokeWidth={2} />
                              {formatFromNow(item.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 text-ink-300">
                      <AlertTriangle size={18} strokeWidth={1.5} className="mb-1" />
                      <span className="text-xs">拖拽工单到此列</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </PageContainer>

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <motion.aside
              ref={drawerWrapperRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[520px] max-w-[92vw] bg-white shadow-[0_0_0_1px_rgba(29,33,41,0.06),-8px_0_40px_rgba(29,33,41,0.12)] flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      #{selectedItem.id}
                    </p>
                    <div className="relative">
                      <button
                        onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                        className="transition-transform hover:scale-105"
                      >
                        <PriorityBadge priority={selectedItem.priority} />
                      </button>
                      {priorityDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 mt-1.5 rounded-xl border border-ink-100 bg-white shadow-cardHover p-1 z-50 min-w-[100px]"
                        >
                          {(['critical', 'high', 'medium', 'low'] as WorkPriority[]).map((p) => (
                            <button
                              key={p}
                              onClick={() => {
                                setWorkItemPriority(selectedItem.id, p);
                                setPriorityDropdownOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
                                selectedItem.priority === p
                                  ? 'bg-brand-50'
                                  : 'hover:bg-ink-50'
                              )}
                            >
                              <PriorityBadge priority={p} />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <StatusBadge status={selectedItem.status} />
                  </div>
                  <h2 className="text-lg font-bold text-ink-700 leading-snug">
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">
                        负责人
                      </p>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setAssigneeDrawerDropdownOpen(!assigneeDrawerDropdownOpen)
                          }
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-ink-200 bg-white hover:border-brand-300 transition-colors text-left"
                        >
                          <Avatar
                            name={selectedItem.assignee ?? '未分配'}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-700 truncate">
                              {selectedItem.assignee ?? '未分配'}
                            </p>
                            {selectedItem.assignee && (
                              <p className="text-[10px] text-ink-400">
                                {mockUsers.find((u) => u.name === selectedItem.assignee)
                                  ?.department ?? ''}
                              </p>
                            )}
                          </div>
                          <ChevronDown
                            size={14}
                            strokeWidth={2}
                            className="text-ink-400 shrink-0"
                          />
                        </button>
                        {assigneeDrawerDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-ink-100 bg-white shadow-cardHover p-1.5 z-50 max-h-60 overflow-y-auto"
                          >
                            <button
                              onClick={() => {
                                assignWorkItem(selectedItem.id, '');
                                setAssigneeDrawerDropdownOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                                !selectedItem.assignee
                                  ? 'bg-brand-50 text-brand-700'
                                  : 'text-ink-600 hover:bg-ink-50'
                              )}
                            >
                              <div className="h-5 w-5 rounded-full bg-ink-100 flex items-center justify-center">
                                <User size={10} strokeWidth={2} className="text-ink-400" />
                              </div>
                              <span>未分配</span>
                            </button>
                            {mockUsers.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  assignWorkItem(selectedItem.id, u.name);
                                  setAssigneeDrawerDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                                  selectedItem.assignee === u.name
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-ink-600 hover:bg-ink-50'
                                )}
                              >
                                <Avatar name={u.name} size="sm" />
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="truncate">{u.name}</p>
                                  <p className="text-[10px] text-ink-400">{u.department}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">
                        提交者
                      </p>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-ink-50 border border-ink-100">
                        <Avatar name={selectedItem.reporter} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-ink-700">
                            {selectedItem.reporter}
                          </p>
                          <p className="text-[10px] text-ink-400">
                            {formatFromNow(selectedItem.createdAt)}创建
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedItem.relatedRequirement && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100/70"
                    >
                      <p className="text-xs font-semibold text-brand-700 mb-1 flex items-center gap-1.5">
                        <Link2 size={11} strokeWidth={2} />
                        关联需求
                      </p>
                      <p className="text-sm text-ink-700 flex items-center gap-1.5">
                        {selectedItem.relatedRequirement}
                        <ChevronRight size={12} strokeWidth={2} className="text-brand-500" />
                      </p>
                    </motion.div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-ink-400 mb-2 uppercase tracking-wide">
                      工单描述
                    </p>
                    <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        关联变更
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-ink-100 text-ink-500">
                          {selectedItemChanges.length}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedItemChanges.map((change, idx) => (
                        <motion.div
                          key={change.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3.5 rounded-xl border border-ink-100 bg-ink-50/40 hover:bg-white hover:border-ink-200 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <MethodBadge method={change.method} />
                            <code className="text-xs text-ink-600 font-mono">
                              {change.endpoint}
                            </code>
                            <div className="ml-auto">
                              <SeverityBadge severity={change.severity} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="chip bg-ink-100 text-ink-600 text-[10px]">
                              {changeCategoryLabels[change.category] ?? change.category}
                            </span>
                            {change.fieldPath && (
                              <span className="text-[11px] text-ink-500 font-mono truncate max-w-[260px]">
                                {change.fieldPath}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-500 leading-relaxed">
                            {change.description}
                          </p>
                          {(change.oldValue || change.newValue) && (
                            <div className="mt-2 pt-2 border-t border-ink-100 flex items-start gap-2 text-[11px]">
                              {change.oldValue && (
                                <div className="flex-1 min-w-0">
                                  <span className="text-danger-500 font-semibold mr-1">−</span>
                                  <code className="text-ink-500 truncate">{change.oldValue}</code>
                                </div>
                              )}
                              {change.oldValue && change.newValue && (
                                <ArrowRight
                                  size={12}
                                  strokeWidth={2}
                                  className="text-ink-300 mt-0.5 shrink-0"
                                />
                              )}
                              {change.newValue && (
                                <div className="flex-1 min-w-0">
                                  <span className="text-success-500 font-semibold mr-1">+</span>
                                  <code className="text-ink-600 truncate">{change.newValue}</code>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        评论
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-ink-100 text-ink-500">
                          {selectedItem.comments.length}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      {selectedItem.comments.length === 0 ? (
                        <div className="py-8 text-center rounded-xl border border-dashed border-ink-200">
                          <MessageSquare
                            size={22}
                            strokeWidth={1.5}
                            className="mx-auto text-ink-300 mb-2"
                          />
                          <p className="text-xs text-ink-400">暂无评论，添加第一条讨论吧</p>
                        </div>
                      ) : (
                        selectedItem.comments.map((comment, idx) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex gap-3 animate-fade-in-up"
                          >
                            <Avatar name={comment.author} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-ink-700">
                                  {comment.author}
                                </span>
                                <span className="text-[10px] text-ink-400">
                                  {formatFromNow(comment.createdAt)}
                                </span>
                              </div>
                              <div className="rounded-xl rounded-tl-sm bg-ink-50 border border-ink-100 p-3">
                                <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-ink-100 p-4 bg-ink-50/60">
                <div className="flex gap-2 items-end">
                  <div className="shrink-0">
                    <Avatar name="林若曦" size="md" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSendComment();
                        }
                      }}
                      placeholder="添加评论... (Ctrl/Cmd + Enter 发送)"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-ink-200 bg-white text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendComment}
                    disabled={!commentText.trim()}
                    className={cn(
                      'h-11 shrink-0 px-4 flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all',
                      commentText.trim()
                        ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                        : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    )}
                  >
                    <Send size={15} strokeWidth={2} />
                    发送
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-400 shrink-0"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
