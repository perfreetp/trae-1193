import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronRight,
  Home,
  LogOut,
  User as UserIcon,
  Settings,
  HelpCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  time: string;
  read: boolean;
}

const routeMap: Record<string, BreadcrumbItem> = {
  dashboard: { label: '仪表盘', path: '/dashboard' },
  sources: { label: '数据源管理', path: '/sources' },
  changes: { label: '变更记录', path: '/changes' },
  workitems: { label: '工作项', path: '/workitems' },
  topology: { label: '系统拓扑', path: '/topology' },
  alerts: { label: '告警规则', path: '/alerts' },
  reports: { label: '周报统计', path: '/reports' },
};

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'warning',
    title: '检测到 3 个破坏性变更需人工审核',
    time: '5 分钟前',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: '数据源「订单服务」扫描完成',
    time: '32 分钟前',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: '新版本 API 规范已发布',
    time: '2 小时前',
    read: true,
  },
  {
    id: '4',
    type: 'warning',
    title: '告警规则「高危变更」已触发 2 次',
    time: '昨天',
    read: true,
  },
];

export default function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '首页', path: '/dashboard' },
    ...pathSegments
      .map((seg) => routeMap[seg])
      .filter(Boolean) as BreadcrumbItem[],
  ];

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-warning-500" size={16} />;
      case 'success':
        return <CheckCircle2 className="text-success-500" size={16} />;
      case 'info':
        return <Info className="text-brand-500" size={16} />;
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-3 min-w-0">
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const content = (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                  isLast
                    ? 'font-semibold text-ink-700'
                    : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50 cursor-pointer'
                )}
              >
                {index === 0 && <Home size={14} strokeWidth={1.8} />}
                {item.label}
              </span>
            );
            return (
              <span key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight
                    className="text-ink-300 mx-0.5"
                    size={14}
                    strokeWidth={2}
                  />
                )}
                {item.path && !isLast ? (
                  <Link to={item.path}>{content}</Link>
                ) : (
                  content
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-white shadow-glow px-3 py-1.5 w-72 animate-fade-in">
              <Search size={16} className="text-ink-400" strokeWidth={1.8} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 API、数据源、变更..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-300"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-400 hover:border-brand-300 hover:text-ink-600 transition-all w-56"
            >
              <Search size={16} strokeWidth={1.8} />
              <span className="flex-1 text-left">搜索...</span>
              <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-mono text-ink-400">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              notifOpen
                ? 'bg-brand-50 text-brand-600'
                : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
            )}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
                <span className="absolute h-full w-full rounded-full bg-danger-400 animate-ping opacity-75" />
                <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-ink-100 bg-white shadow-cardHover overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <h3 className="font-display font-semibold text-ink-700">
                  通知中心
                </h3>
                <span className="chip chip-outline">
                  {unreadCount} 条未读
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 border-b border-ink-50 transition-colors cursor-pointer hover:bg-ink-50',
                      !notif.read && 'bg-brand-50/30'
                    )}
                  >
                    <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-relaxed',
                          notif.read ? 'text-ink-500' : 'text-ink-700 font-medium'
                        )}
                      >
                        {notif.title}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-100 px-4 py-2">
                <button className="w-full py-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors rounded-lg hover:bg-brand-50">
                  查看全部通知
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-ink-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-semibold shadow-sm">
              ZL
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-medium text-ink-700 leading-tight">
                张磊
              </span>
              <span className="text-[11px] text-ink-400 leading-tight">
                管理员
              </span>
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-ink-100 bg-white shadow-cardHover overflow-hidden animate-fade-in-up">
              <div className="border-b border-ink-100 px-4 py-3">
                <p className="font-display font-semibold text-ink-700">张磊</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  zhanglei@example.com
                </p>
                <span className="chip chip-outline mt-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                  平台管理员
                </span>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors text-left">
                  <UserIcon size={16} strokeWidth={1.8} />
                  个人资料
                </button>
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors text-left">
                  <Settings size={16} strokeWidth={1.8} />
                  系统设置
                </button>
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800 transition-colors text-left">
                  <HelpCircle size={16} strokeWidth={1.8} />
                  使用帮助
                </button>
              </div>
              <div className="border-t border-ink-100 p-2">
                <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors text-left">
                  <LogOut size={16} strokeWidth={1.8} />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
