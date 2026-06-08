import { useState } from 'react';
import { PageContainer } from '@/components/Layout';
import { mockReports, mockWeeklyReport } from '@/mock/reports';
import type { WeeklyReport } from '@/types';
import {
  FileBarChart2,
  Download,
  Calendar,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Table,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

function formatDateCompact(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function getFileDateRange(report: WeeklyReport): string {
  return `${formatDateCompact(report.weekStart)}-${formatDateCompact(report.weekEnd)}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

interface ToastItem {
  id: number;
  message: string;
}

let toastSeq = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string): void => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const ToastContainer = (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto px-4 py-3 rounded-xl backdrop-blur-xl bg-white/70 border border-white/60 shadow-lg text-sm text-ink-700 font-medium animate-fade-in"
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function generatePdfReportHtml(report: WeeklyReport, history: WeeklyReport[]): string {
  const { summary, weekStart, weekEnd, risks, bySystem } = report;
  const resolvedRate = Math.round(summary.resolvedRate * 100);

  const stats = [
    { label: '数据源总数', value: summary.totalSources },
    { label: '本周变更数', value: summary.totalChanges },
    { label: '破坏性变更', value: summary.breakingCount },
    { label: '变更解决率', value: `${resolvedRate}%` },
    { label: '平均处理时长', value: `${summary.avgHandleHours}h` },
  ];

  const historyRows = history.slice(0, 4).map((r) => `
    <tr>
      <td>${r.weekStart}</td>
      <td>${r.weekEnd}</td>
      <td>${r.summary.totalChanges}</td>
      <td>${r.summary.breakingCount}</td>
      <td>${Math.round(r.summary.resolvedRate * 100)}%</td>
      <td>${r.summary.avgHandleHours}h</td>
    </tr>
  `).join('');

  const systemRows = bySystem.map((s) => `
    <tr>
      <td>${s.system}</td>
      <td>${s.changes}</td>
      <td>${s.breaking}</td>
    </tr>
  `).join('');

  const riskItems = risks.length
    ? risks.map((r) => `<li>${r}</li>`).join('')
    : '<li>本周无风险提示</li>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>API 变更周报（${weekStart} ~ ${weekEnd}）</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 48px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #ffffff;
    color: #1d2129;
    line-height: 1.6;
  }
  .header {
    border-bottom: 3px solid #165DFF;
    padding-bottom: 18px;
    margin-bottom: 28px;
  }
  .header .brand {
    font-size: 12px;
    color: #7A8494;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .header h1 {
    margin: 0;
    font-size: 26px;
    color: #1d2129;
    font-weight: 700;
  }
  .header .sub {
    margin-top: 6px;
    color: #4E5969;
    font-size: 13px;
  }
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
    margin: 28px 0 12px 0;
    padding-left: 10px;
    border-left: 4px solid #165DFF;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
  .stat-card {
    border: 1px solid #E5E6EB;
    border-radius: 10px;
    padding: 16px;
    background: linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%);
  }
  .stat-card .label {
    font-size: 12px;
    color: #7A8494;
    margin-bottom: 6px;
  }
  .stat-card .value {
    font-size: 22px;
    font-weight: 700;
    color: #165DFF;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  table th {
    background: #165DFF;
    color: #ffffff;
    font-weight: 600;
    padding: 10px 12px;
    text-align: left;
    border: 1px solid #165DFF;
  }
  table td {
    padding: 10px 12px;
    border: 1px solid #E5E6EB;
    color: #1d2129;
  }
  table tbody tr:nth-child(even) td {
    background: #F7F8FA;
  }
  .risks {
    background: #FFF3E8;
    border: 1px solid #FFD5B0;
    border-radius: 10px;
    padding: 16px 20px;
  }
  .risks ul {
    margin: 0;
    padding-left: 22px;
  }
  .risks li {
    color: #7A3B00;
    margin: 6px 0;
  }
  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #E5E6EB;
    font-size: 12px;
    color: #7A8494;
    text-align: center;
  }
  @media print {
    body { padding: 20px; }
    .stats { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">API Governance Weekly Report</div>
    <h1>API 变更周报（${weekStart} ~ ${weekEnd}）</h1>
    <div class="sub">生成时间：${new Date().toLocaleString('zh-CN')} · 共 ${summary.totalSources} 个数据源接入</div>
  </div>

  <div class="section-title">摘要统计</div>
  <div class="stats">
    ${stats.map((s) => `
      <div class="stat-card">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>
    `).join('')}
  </div>

  <div class="section-title">风险提示</div>
  <div class="risks">
    <ul>${riskItems}</ul>
  </div>

  <div class="section-title">按系统分布</div>
  <table>
    <thead>
      <tr>
        <th>系统</th>
        <th>全部变更</th>
        <th>破坏性变更</th>
      </tr>
    </thead>
    <tbody>${systemRows}</tbody>
  </table>

  <div class="section-title">历史周报概览</div>
  <table>
    <thead>
      <tr>
        <th>周开始</th>
        <th>周结束</th>
        <th>总变更</th>
        <th>破坏性</th>
        <th>解决率</th>
        <th>平均时长</th>
      </tr>
    </thead>
    <tbody>${historyRows}</tbody>
  </table>

  <div class="footer">
    © 2026 API 治理平台 · 本报告为自动生成，使用浏览器 Ctrl+P 可另存为 PDF
  </div>
</body>
</html>`;
}

function generateCsv(report: WeeklyReport, history: WeeklyReport[]): string {
  const lines: string[] = [];
  const s = report.summary;

  lines.push([
    'Summary',
    report.weekStart,
    report.weekEnd,
    s.totalSources,
    s.totalChanges,
    s.breakingCount,
    (s.resolvedRate * 100).toFixed(2) + '%',
    s.avgHandleHours,
  ].map(escapeCsv).join(','));

  lines.push('');
  lines.push(['System', 'Changes', 'Breaking'].map(escapeCsv).join(','));
  for (const row of report.bySystem) {
    lines.push([row.system, row.changes, row.breaking].map(escapeCsv).join(','));
  }

  lines.push('');
  lines.push([
    'WeekStart',
    'WeekEnd',
    'TotalChanges',
    'Breaking',
    'ResolvedRate',
    'AvgHours',
  ].map(escapeCsv).join(','));
  for (const r of history) {
    lines.push([
      r.weekStart,
      r.weekEnd,
      r.summary.totalChanges,
      r.summary.breakingCount,
      (r.summary.resolvedRate * 100).toFixed(2) + '%',
      r.summary.avgHandleHours,
    ].map(escapeCsv).join(','));
  }

  return '\ufeff' + lines.join('\r\n');
}

function generateWordHtml(report: WeeklyReport): string {
  const { summary, weekStart, weekEnd, risks, bySystem, highlights, progress } = report;
  const resolvedRate = Math.round(summary.resolvedRate * 100);

  const stats = [
    `数据源总数：${summary.totalSources}`,
    `本周变更数：${summary.totalChanges}`,
    `破坏性变更：${summary.breakingCount}`,
    `变更解决率：${resolvedRate}%`,
    `平均处理时长：${summary.avgHandleHours}h`,
  ];

  const systemRows = bySystem.map((s) => `
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">${s.system}</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${s.changes}</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${s.breaking}</td>
    </tr>
  `).join('');

  const highlightHtml = highlights.length
    ? highlights.map((h) => `<li>${h}</li>`).join('')
    : '<li>—</li>';

  const riskHtml = risks.length
    ? risks.map((r) => `<li>${r}</li>`).join('')
    : '<li>无</li>';

  const progressHtml = progress.length
    ? progress.map((p) => `<li>${p}</li>`).join('')
    : '<li>—</li>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>API 变更周报（${weekStart} ~ ${weekEnd}）</title>
<style>
  body {
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    line-height: 1.7;
    color: #1d2129;
    padding: 30px 40px;
  }
  h1 {
    color: #165DFF;
    border-bottom: 2px solid #165DFF;
    padding-bottom: 10px;
    font-size: 22px;
  }
  h2 {
    color: #1d2129;
    font-size: 16px;
    margin-top: 22px;
    border-left: 4px solid #165DFF;
    padding-left: 10px;
  }
  ul { padding-left: 22px; }
  li { margin: 5px 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
  }
  th {
    background: #165DFF;
    color: #fff;
    border: 1px solid #165DFF;
    padding: 8px 12px;
    text-align: left;
  }
</style>
</head>
<body>
  <h1>API 变更周报（${weekStart} ~ ${weekEnd}）</h1>

  <h2>摘要统计</h2>
  <ul>${stats.map((s) => `<li>${s}</li>`).join('')}</ul>

  <h2>本周亮点</h2>
  <ul>${highlightHtml}</ul>

  <h2>风险提示</h2>
  <ul>${riskHtml}</ul>

  <h2>推进进度</h2>
  <ul>${progressHtml}</ul>

  <h2>按系统分布</h2>
  <table>
    <thead>
      <tr>
        <th>系统</th>
        <th>全部变更</th>
        <th>破坏性变更</th>
      </tr>
    </thead>
    <tbody>${systemRows}</tbody>
  </table>

  <p style="margin-top:30px;color:#7A8494;font-size:12px;text-align:center;">
    由 API 治理平台自动生成 · ${new Date().toLocaleString('zh-CN')}
  </p>
</body>
</html>`;
}

export default function Reports() {
  const latest = mockWeeklyReport;
  const { showToast, ToastContainer } = useToast();

  const statCards = [
    {
      label: '数据源总数',
      value: latest.summary.totalSources,
      icon: Target,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: '本周变更数',
      value: latest.summary.totalChanges,
      icon: TrendingUp,
      color: 'text-success-600',
      bg: 'bg-success-50',
      trend: '+8',
      trendUp: true,
    },
    {
      label: '破坏性变更',
      value: latest.summary.breakingCount,
      icon: AlertTriangle,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      trend: '-2',
      trendUp: false,
    },
    {
      label: '变更解决率',
      value: `${Math.round(latest.summary.resolvedRate * 100)}%`,
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      label: '平均处理时长',
      value: `${latest.summary.avgHandleHours}h`,
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      trend: '-1.5h',
      trendUp: true,
    },
  ];

  const handleExportPdf = (): void => {
    const html = generatePdfReportHtml(latest, mockReports);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `API变更周报_${getFileDateRange(latest)}_printable.html`;
    triggerDownload(blob, filename);
    showToast('PDF 格式报告已导出（浏览器打印 Ctrl+P 可转 PDF），正在下载...');
  };

  const handleExportExcel = (): void => {
    const csv = generateCsv(latest, mockReports);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = `API变更周报_${getFileDateRange(latest)}_summary.xlsx`;
    triggerDownload(blob, filename);
    showToast('已生成 Excel 报告，正在下载...');
  };

  const handleExportWord = (): void => {
    const html = generateWordHtml(latest);
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const filename = `API变更周报_${getFileDateRange(latest)}_summary.doc`;
    triggerDownload(blob, filename);
    showToast('已生成 Word 报告，正在下载...');
  };

  const handleDownloadReport = (report: WeeklyReport): void => {
    const html = generatePdfReportHtml(report, mockReports.filter((r) => r !== report));
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `API变更周报_${getFileDateRange(report)}_printable.html`;
    triggerDownload(blob, filename);
    showToast(`已生成 ${report.weekStart} ~ ${report.weekEnd} 周报，正在下载...`);
  };

  return (
    <PageContainer
      title="报告中心"
      description="按周汇总 API 变更治理情况，分析趋势并识别改进空间"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Calendar size={16} strokeWidth={1.8} />
            本周
            <ChevronDown size={14} strokeWidth={2} />
          </button>
          <button className="btn-secondary" onClick={handleExportPdf}>
            <FileText size={16} strokeWidth={1.8} />
            导出 PDF
          </button>
          <button className="btn-secondary" onClick={handleExportExcel}>
            <Table size={16} strokeWidth={1.8} />
            导出 Excel
          </button>
          <button className="btn-primary" onClick={handleExportWord}>
            <FileSpreadsheet size={16} strokeWidth={1.8} />
            导出 Word
          </button>
        </div>
      }
    >
      {ToastContainer}
      <div className="space-y-5">
        <div className="glass-card p-6 border-t-4 border-t-brand-500">
          <div className="flex flex-wrap items-start justify-between gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                  <Sparkles className="text-brand-600" size={16} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                  本周报告摘要
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-700 mb-1">
                {latest.weekStart} 至 {latest.weekEnd}
              </h2>
              <p className="text-sm text-ink-500">
                第 23 周 · 共 5 个工作日 · 治理整体达标
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-brand-50 text-brand-700 border border-brand-200">
                治理达标
              </span>
              <span className="chip bg-success-50 text-success-700 border border-success-200">
                较上周改善
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50/50 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        card.bg
                      )}
                    >
                      <Icon
                        className={card.color}
                        size={16}
                        strokeWidth={1.8}
                      />
                    </div>
                    {card.trend && (
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-xs font-semibold',
                          card.trendUp
                            ? 'text-success-600'
                            : 'text-danger-600'
                        )}
                      >
                        {card.trendUp ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownRight size={11} />
                        )}
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {card.value}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-50">
                <CheckCircle2
                  className="text-success-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">本周亮点</h3>
            </div>
            <ul className="space-y-3">
              {latest.highlights.map((h, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600 text-[10px] font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-ink-600 leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-50">
                <AlertTriangle
                  className="text-danger-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">风险提示</h3>
            </div>
            <ul className="space-y-3">
              {latest.risks.map((r, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600 text-[11px] font-bold mt-0.5">
                    !
                  </span>
                  <span className="text-ink-600 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                <TrendingUp
                  className="text-brand-600"
                  size={14}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-sm font-semibold text-ink-700">推进进度</h3>
            </div>
            <ul className="space-y-3">
              {latest.progress.map((p, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-ink-600 leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">变更趋势</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-danger-500" />
                  破坏性
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-warning-500" />
                  普通
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full bg-ink-400" />
                  轻微
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latest.trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#7A8494', fontSize: 11 }}
                    axisLine={{ stroke: '#DADFE6' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#7A8494', fontSize: 11 }}
                    axisLine={{ stroke: '#DADFE6' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #DADFE6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(29,33,41,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="breaking"
                    stroke="#D91A1A"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normal"
                    stroke="#FF7D00"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="minor"
                    stroke="#7A8494"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-warning-500" size={16} strokeWidth={1.8} />
              <h3 className="section-title">快速概览</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">总变更数</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {latest.summary.totalChanges}
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-success-600">
                    <ArrowUpRight size={11} />
                    +8
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-danger-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">破坏性变更占比</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {Math.round((latest.summary.breakingCount / latest.summary.totalChanges) * 100)}%
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-danger-600">
                    <ArrowDownRight size={11} />
                    -2.3%
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-success-50/50 to-white p-4">
                <p className="text-xs text-ink-500 mb-1">已解决率</p>
                <div className="flex items-end justify-between">
                  <p className="font-display text-2xl font-bold text-ink-700">
                    {Math.round(latest.summary.resolvedRate * 100)}%
                  </p>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-success-600">
                    <ArrowUpRight size={11} />
                    +5.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">按系统变更分布</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                全部变更
              </span>
              <span className="flex items-center gap-1.5 text-ink-500">
                <span className="h-2 w-2 rounded-full bg-danger-500" />
                破坏性
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latest.bySystem} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                <XAxis
                  dataKey="system"
                  tick={{ fill: '#7A8494', fontSize: 12 }}
                  axisLine={{ stroke: '#DADFE6' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#7A8494', fontSize: 11 }}
                  axisLine={{ stroke: '#DADFE6' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #DADFE6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(29,33,41,0.08)',
                  }}
                  cursor={{ fill: 'rgba(22, 93, 255, 0.04)' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
                <Bar
                  dataKey="changes"
                  name="全部变更"
                  fill="#165DFF"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="breaking"
                  name="破坏性变更"
                  fill="#D91A1A"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <div className="flex items-center gap-2">
              <FileBarChart2
                className="text-brand-500"
                size={16}
                strokeWidth={1.8}
              />
              <h3 className="section-title">历史周报归档</h3>
            </div>
            <span className="text-sm text-ink-400">
              共 {mockReports.length} 期
            </span>
          </div>
          <div className="divide-y divide-ink-50">
            {mockReports.map((report, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50/50 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 text-xs font-bold shrink-0">
                  #{mockReports.length - idx}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-700 group-hover:text-brand-700 transition-colors">
                    {report.weekStart} ~ {report.weekEnd}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                    <span>{report.summary.totalChanges} 变更</span>
                    <span>
                      {report.summary.breakingCount} 破坏性
                    </span>
                    <span>
                      解决率 {Math.round(report.summary.resolvedRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.summary.breakingCount > 0 && (
                    <span className="chip bg-danger-50 text-danger-700 border border-danger-200">
                      需关注
                    </span>
                  )}
                  <button
                    className="btn-ghost h-8 px-3 text-xs"
                    onClick={() => handleDownloadReport(report)}
                  >
                    <Download size={12} strokeWidth={1.8} />
                    下载
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
