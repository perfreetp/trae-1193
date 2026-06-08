import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  SearchX,
  Compass,
  FileQuestion,
} from 'lucide-react';
import { motion } from 'framer-motion';

const quickLinks = [
  { label: '返回仪表盘', path: '/dashboard', icon: Home },
  { label: '数据源管理', path: '/sources', icon: Compass },
  { label: '变更记录', path: '/changes', icon: FileQuestion },
];

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex h-full items-center justify-center py-12"
    >
      <div className="w-full max-w-xl text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative inline-block mb-8"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-brand-100 blur-3xl opacity-60 scale-150" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-xl shadow-brand-500/30 mx-auto">
            <SearchX className="text-white" size={48} strokeWidth={1.6} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
            错误代码 404
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl font-bold text-ink-700 mb-3"
        >
          页面走丢了
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-ink-500 text-base mb-2"
        >
          很抱歉，您访问的页面不存在或已被移除
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-50 border border-ink-200 px-3.5 py-2 mb-8"
        >
          <span className="text-xs text-ink-400">请求路径</span>
          <code className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
            {location.pathname}
          </code>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            返回上一页
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            <Home size={16} strokeWidth={1.8} />
            回到首页
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">
            您可能在找：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <motion.button
                  key={link.path}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.08 }}
                  onClick={() => navigate(link.path)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:shadow-cardHover hover:-translate-y-0.5 transition-all text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-medium text-ink-700 group-hover:text-brand-700 transition-colors">
                    {link.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
