import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  GitCompareArrows,
  Network,
  BellRing,
  Users,
  FileBarChart2,
  Hexagon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '总览', icon: LayoutDashboard },
  { path: '/sources', label: '接口源', icon: Database },
  { path: '/diff', label: '版本对比', icon: GitCompareArrows },
  { path: '/impact', label: '影响分析', icon: Network },
  { path: '/alerts', label: '提醒规则', icon: BellRing },
  { path: '/review', label: '评审协作', icon: Users },
  { path: '/reports', label: '报告中心', icon: FileBarChart2 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-ink-100 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
          <Hexagon className="text-white" size={20} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-base font-semibold text-ink-700 leading-tight">
            Radar
          </span>
          <span className="text-[11px] text-ink-400 leading-tight">
            API 变更雷达
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          导航菜单
        </div>
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn('nav-item', isActive && 'nav-item-active')}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-3 border border-brand-100/60">
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success-400 animate-pulse-soft" />
            <span className="text-xs font-semibold text-ink-600">系统状态</span>
          </div>
          <p className="text-[11px] text-ink-500 leading-relaxed">
            全量扫描运行中，共 12 个数据源待检测
          </p>
        </div>
      </div>
    </aside>
  );
}
