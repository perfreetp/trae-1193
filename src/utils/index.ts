import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export const formatDateTime = (iso: string, format = 'YYYY-MM-DD HH:mm') =>
  dayjs(iso).format(format);

export const formatDate = (iso: string, format = 'YYYY-MM-DD') =>
  dayjs(iso).format(format);

export const formatFromNow = (iso: string) => dayjs(iso).fromNow();

export const formatNumber = (n: number, digits = 0) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(digits);
};

export const formatPercent = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

export const cn = (...args: (string | false | undefined | null)[]) =>
  args.filter(Boolean).join(' ');

export const cronToHuman = (cron: string) => {
  const parts = cron.split(/\s+/);
  if (parts.length < 5) return cron;
  const [, m, h, ,] = parts;
  if (h === '*' && m === '0') return '每小时整点';
  if (h.startsWith('*/') && m === '0') return `每 ${h.slice(2)} 小时`;
  if (/^\d+$/.test(h) && /^\d+$/.test(m))
    return `每天 ${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  return cron;
};
