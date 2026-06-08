import { useState, useRef } from 'react';
import { PageContainer } from '@/components/Layout';
import { mockReports, mockWeeklyReport } from '@/mock/reports';
import type { WeeklyReport } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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
  Loader2,
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

function buildPdfReportDom(report: WeeklyReport, history: WeeklyReport[]): HTMLDivElement {
  const { summary, weekStart, weekEnd, risks, bySystem, highlights, progress } = report;
  const resolvedRate = Math.round(summary.resolvedRate * 100);

  const statColors = [
    { bg: 'linear-gradient(135deg,#165DFF 0%,#4080FF 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg,#00B42A 0%,#23C343 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg,#F53F3F 0%,#FF6B6B 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg,#722ED1 0%,#9F56F5 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg,#FF7D00 0%,#FF9A2E 100%)', text: '#ffffff' },
  ];

  const stats = [
    { label: '数据源总数', value: summary.totalSources },
    { label: '本周变更数', value: summary.totalChanges },
    { label: '破坏性变更', value: summary.breakingCount },
    { label: '变更解决率', value: `${resolvedRate}%` },
    { label: '平均处理时长', value: `${summary.avgHandleHours}h` },
  ];

  const maxChanges = Math.max(...bySystem.map((s) => s.changes), 1);
  const maxBreaking = Math.max(...bySystem.map((s) => s.breaking), 1);

  const historyRows = history.slice(0, 8).map((r) => `
    <tr>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;">${r.weekStart}</td>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;">${r.weekEnd}</td>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;text-align:center;">${r.summary.totalChanges}</td>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;text-align:center;">${r.summary.breakingCount}</td>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;text-align:center;">${Math.round(r.summary.resolvedRate * 100)}%</td>
      <td style="padding:10px 12px;border:1px solid #E5E6EB;text-align:center;">${r.summary.avgHandleHours}h</td>
    </tr>
  `).join('');

  const systemRows = bySystem.map((s) => {
    const changeWidth = (s.changes / maxChanges) * 100;
    const breakWidth = maxBreaking > 0 ? (s.breaking / maxBreaking) * 60 : 0;
    return `
      <tr>
        <td style="padding:10px 12px;border:1px solid #E5E6EB;font-weight:500;">${s.system}</td>
        <td style="padding:10px 12px;border:1px solid #E5E6EB;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:36px;text-align:right;font-weight:600;color:#165DFF;">${s.changes}</span>
            <div style="flex:1;height:8px;background:#F2F3F5;border-radius:4px;overflow:hidden;">
              <div style="width:${changeWidth}%;height:100%;background:linear-gradient(90deg,#165DFF,#4080FF);border-radius:4px;"></div>
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;border:1px solid #E5E6EB;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:28px;text-align:right;font-weight:600;color:#F53F3F;">${s.breaking}</span>
            <div style="flex:1;height:8px;background:#FFF1F0;border-radius:4px;overflow:hidden;">
              <div style="width:${breakWidth}%;height:100%;background:linear-gradient(90deg,#F53F3F,#FF6B6B);border-radius:4px;"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const riskItems = risks.length
    ? risks.map((r) => `<li style="margin:6px 0;padding-left:4px;">● ${r}</li>`).join('')
    : '<li style="margin:6px 0;padding-left:4px;">● 本周无风险提示</li>';

  const highlightItems = highlights.length
    ? highlights.map((h) => `<li style="margin:6px 0;padding-left:4px;">✓ ${h}</li>`).join('')
    : '<li style="margin:6px 0;padding-left:4px;">—</li>';

  const progressItems = progress.length
    ? progress.map((p, i) => `<li style="margin:6px 0;padding-left:4px;">${i + 1}. ${p}</li>`).join('')
    : '<li style="margin:6px 0;padding-left:4px;">—</li>';

  const statsHtml = stats.map((s, i) => `
    <div style="
      flex:1;
      min-width:0;
      padding:18px 16px;
      border-radius:12px;
      background:${statColors[i].bg};
      color:${statColors[i].text};
      box-shadow:0 2px 8px rgba(0,0,0,0.08);
    ">
      <div style="font-size:12px;opacity:0.9;margin-bottom:6px;">${s.label}</div>
      <div style="font-size:26px;font-weight:700;line-height:1.2;">${s.value}</div>
    </div>
  `).join('');

  const html = `
    <div style="
      width:794px;
      background:#ffffff;
      padding:40px 48px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
      color:#1d2129;
      line-height:1.6;
      box-sizing:border-box;
    ">
      <div style="
        background:linear-gradient(135deg,#0E42D2 0%,#165DFF 40%,#4080FF 100%);
        border-radius:16px;
        padding:28px 32px;
        color:#ffffff;
        margin-bottom:28px;
        position:relative;
        overflow:hidden;
      ">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>
        <div style="position:absolute;bottom:-60px;right:80px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
        <div style="position:relative;">
          <div style="font-size:22px;font-weight:700;margin-bottom:8px;letter-spacing:1px;">API 变更雷达</div>
          <div style="font-size:18px;font-weight:600;opacity:0.95;">API 变更周报 (${weekStart} ~ ${weekEnd})</div>
          <div style="font-size:12px;opacity:0.8;margin-top:10px;">
            生成时间：${new Date().toLocaleString('zh-CN')} · 共 ${summary.totalSources} 个数据源接入
          </div>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="
          font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
          padding-left:10px;border-left:4px solid #165DFF;
        ">摘要统计</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">${statsHtml}</div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="
          font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
          padding-left:10px;border-left:4px solid #F53F3F;
        ">⚠ 风险提示</div>
        <div style="
          background:#FFF3E8;border:1px solid #FFD5B0;border-radius:12px;
          padding:16px 20px;color:#7A3B00;
        ">
          <ul style="margin:0;padding-left:0;list-style:none;">${riskItems}</ul>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="
          font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
          padding-left:10px;border-left:4px solid #165DFF;
        ">按系统分布</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th style="background:#165DFF;color:#ffffff;font-weight:600;padding:10px 12px;text-align:left;border:1px solid #165DFF;">系统</th>
              <th style="background:#165DFF;color:#ffffff;font-weight:600;padding:10px 12px;text-align:left;border:1px solid #165DFF;width:40%;">变更数</th>
              <th style="background:#165DFF;color:#ffffff;font-weight:600;padding:10px 12px;text-align:left;border:1px solid #165DFF;width:32%;">破坏性</th>
            </tr>
          </thead>
          <tbody>${systemRows}</tbody>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <div style="
          font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
          padding-left:10px;border-left:4px solid #00B42A;
        ">历史周报汇总</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:left;border:1px solid #0E42D2;">周开始</th>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:left;border:1px solid #0E42D2;">周结束</th>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:center;border:1px solid #0E42D2;">总变更</th>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:center;border:1px solid #0E42D2;">破坏性</th>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:center;border:1px solid #0E42D2;">解决率</th>
              <th style="background:#0E42D2;color:#fff;font-weight:600;padding:8px 12px;text-align:center;border:1px solid #0E42D2;">平均时长</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="
            font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
            padding-left:10px;border-left:4px solid #00B42A;
          ">本周亮点</div>
          <div style="background:#F2FFFA;border:1px solid #B7F5DA;border-radius:12px;padding:14px 18px;color:#007A5A;">
            <ul style="margin:0;padding-left:0;list-style:none;">${highlightItems}</ul>
          </div>
        </div>
        <div>
          <div style="
            font-size:15px;font-weight:600;color:#1d2129;margin-bottom:14px;
            padding-left:10px;border-left:4px solid #722ED1;
          ">推进进度</div>
          <div style="background:#F9F0FF;border:1px solid #D3ADF7;border-radius:12px;padding:14px 18px;color:#4C1F99;">
            <ul style="margin:0;padding-left:0;list-style:none;">${progressItems}</ul>
          </div>
        </div>
      </div>

      <div style="
        margin-top:36px;padding-top:16px;border-top:1px solid #E5E6EB;
        font-size:12px;color:#7A8494;text-align:center;
      ">
        © 2026 API 治理平台 · 本报告由系统自动生成
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.zIndex = '-1';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  return wrapper as HTMLDivElement;
}

async function generatePdfReport(report: WeeklyReport, history: WeeklyReport[]): Promise<void> {
  const wrapper = buildPdfReportDom(report, history);
  const content = wrapper.firstElementChild as HTMLDivElement;

  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = position - contentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
    }

    const filename = `API变更周报_${getFileDateRange(report)}_完整版.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}

async function generatePdfReportArchive(report: WeeklyReport, history: WeeklyReport[]): Promise<void> {
  const wrapper = buildPdfReportDom(report, history);
  const content = wrapper.firstElementChild as HTMLDivElement;

  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = position - contentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
    }

    const filename = `API变更周报_${getFileDateRange(report)}_周报归档.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}

function generateExcelReport(report: WeeklyReport, history: WeeklyReport[]): void {
  const { summary, weekStart, weekEnd, risks, bySystem } = report;

  const overviewData: (string | number)[][] = [
    ['WeekStart', 'WeekEnd', 'TotalSources', 'TotalChanges', 'Breaking', 'ResolvedRate', 'AvgHandleHours'],
    [
      weekStart,
      weekEnd,
      summary.totalSources,
      summary.totalChanges,
      summary.breakingCount,
      `${(summary.resolvedRate * 100).toFixed(2)}%`,
      summary.avgHandleHours,
    ],
  ];

  const bySystemData: (string | number)[][] = [
    ['System', 'Changes', 'Breaking', 'NonBreaking', 'BreakingRate'],
    ...bySystem.map((s) => [
      s.system,
      s.changes,
      s.breaking,
      s.changes - s.breaking,
      s.changes > 0 ? `${((s.breaking / s.changes) * 100).toFixed(1)}%` : '0%',
    ]),
  ];

  const riskData: (string | number)[][] = [
    ['ID', 'RiskLevel', 'Description'],
    ...risks.map((r, i) => [`R-${String(i + 1).padStart(3, '0')}`, 'High', r]),
  ];

  const historyTop8 = history.slice(0, 8);
  const historyData: (string | number)[][] = [
    ['WeekStart', 'WeekEnd', 'TotalChanges', 'Breaking', 'ResolvedRate', 'AvgHandleHours'],
    ...historyTop8.map((r) => [
      r.weekStart,
      r.weekEnd,
      r.summary.totalChanges,
      r.summary.breakingCount,
      `${(r.summary.resolvedRate * 100).toFixed(2)}%`,
      r.summary.avgHandleHours,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  const ws2 = XLSX.utils.aoa_to_sheet(bySystemData);
  const ws3 = XLSX.utils.aoa_to_sheet(riskData);
  const ws4 = XLSX.utils.aoa_to_sheet(historyData);

  ws1['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];
  ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  ws3['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 60 }];
  ws4['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, ws1, '概览');
  XLSX.utils.book_append_sheet(wb, ws2, '按系统分布');
  XLSX.utils.book_append_sheet(wb, ws3, '风险项');
  XLSX.utils.book_append_sheet(wb, ws4, '历史周报汇总');

  const filename = `API变更周报_${getFileDateRange(report)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function generateWordReport(report: WeeklyReport, history: WeeklyReport[]): void {
  const { summary, weekStart, weekEnd, risks, bySystem, highlights, progress } = report;
  const resolvedRate = Math.round(summary.resolvedRate * 100);

  const statColors = ['#165DFF', '#00B42A', '#F53F3F', '#722ED1', '#FF7D00'];
  const stats = [
    { label: '数据源总数', value: summary.totalSources },
    { label: '本周变更数', value: summary.totalChanges },
    { label: '破坏性变更', value: summary.breakingCount },
    { label: '变更解决率', value: `${resolvedRate}%` },
    { label: '平均处理时长', value: `${summary.avgHandleHours}h` },
  ];

  const statsHtml = stats.map((s, i) => `
    <td style="
      width:20%;
      padding:16px 12px;
      border:1px solid #E5E6EB;
      background:#F7F8FA;
      text-align:center;
      vertical-align:top;
    ">
      <div style="font-size:12px;color:#7A8494;margin-bottom:6px;">${s.label}</div>
      <div style="font-size:24px;font-weight:700;color:${statColors[i]};">${s.value}</div>
    </td>
  `).join('');

  const systemRows = bySystem.map((s) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ccc;">${s.system}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${s.changes}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${s.breaking}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${s.changes - s.breaking}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">
        ${s.changes > 0 ? ((s.breaking / s.changes) * 100).toFixed(1) : 0}%
      </td>
    </tr>
  `).join('');

  const historyRows = history.slice(0, 8).map((r) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ccc;">${r.weekStart}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;">${r.weekEnd}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${r.summary.totalChanges}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${r.summary.breakingCount}</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${Math.round(r.summary.resolvedRate * 100)}%</td>
      <td style="padding:8px 12px;border:1px solid #ccc;text-align:center;">${r.summary.avgHandleHours}h</td>
    </tr>
  `).join('');

  const highlightHtml = highlights.length
    ? highlights.map((h) => `<li style="margin:4px 0;">${h}</li>`).join('')
    : '<li>—</li>';

  const riskHtml = risks.length
    ? risks.map((r) => `<li style="margin:4px 0;">${r}</li>`).join('')
    : '<li>无</li>';

  const progressHtml = progress.length
    ? progress.map((p) => `<li style="margin:4px 0;">${p}</li>`).join('')
    : '<li>—</li>';

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>API 变更周报（${weekStart} ~ ${weekEnd}）</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  body {
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    line-height: 1.7;
    color: #1d2129;
    padding: 20px 30px;
    mso-line-height-rule: exactly;
  }
  .header {
    background: #165DFF;
    color: #ffffff;
    padding: 24px 28px;
    margin-bottom: 28px;
    border-radius: 8px;
    mso-element: para-border-div;
  }
  .header .brand {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .header .sub {
    font-size: 16px;
    opacity: 0.95;
  }
  .header .meta {
    font-size: 11px;
    opacity: 0.8;
    margin-top: 8px;
  }
  h2 {
    color: #1d2129;
    font-size: 15px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
    padding-left: 10px;
    border-left: 4px solid #165DFF;
    mso-border-left-alt: solid #165DFF 4px;
  }
  table.stats-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  table.data-table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 8px;
    mso-table-layout-alt: fixed;
  }
  table.data-table th {
    background: #165DFF;
    color: #ffffff;
    font-weight: 600;
    padding: 8px 12px;
    text-align: left;
    border: 1px solid #165DFF;
  }
  table.data-table td {
    padding: 8px 12px;
    border: 1px solid #ccc;
  }
  table.data-table tr:nth-child(even) td {
    background: #F7F8FA;
  }
  .risk-box {
    background: #FFF3E8;
    border: 1px solid #FFD5B0;
    padding: 14px 18px;
    color: #7A3B00;
    border-radius: 8px;
  }
  .highlight-box {
    background: #F2FFFA;
    border: 1px solid #B7F5DA;
    padding: 14px 18px;
    color: #007A5A;
    border-radius: 8px;
  }
  .progress-box {
    background: #F9F0FF;
    border: 1px solid #D3ADF7;
    padding: 14px 18px;
    color: #4C1F99;
    border-radius: 8px;
  }
  .two-col {
    display: table;
    width: 100%;
    margin-top: 8px;
  }
  .two-col .col {
    display: table-cell;
    width: 50%;
    padding: 0 8px;
    vertical-align: top;
  }
  .two-col .col:first-child { padding-left: 0; }
  .two-col .col:last-child { padding-right: 0; }
  ul { margin: 0; padding-left: 22px; }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #E5E6EB;
    font-size: 11px;
    color: #7A8494;
    text-align: center;
    mso-border-top-alt: solid #E5E6EB 1px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">API 变更雷达</div>
    <div class="sub">API 变更周报（${weekStart} ~ ${weekEnd}）</div>
    <div class="meta">生成时间：${new Date().toLocaleString('zh-CN')} · 共 ${summary.totalSources} 个数据源接入</div>
  </div>

  <h2>摘要统计</h2>
  <table class="stats-table" cellpadding="0" cellspacing="0">
    <tr>${statsHtml}</tr>
  </table>

  <h2 style="border-left-color:#F53F3F;mso-border-left-alt:solid #F53F3F 4px;">风险提示</h2>
  <div class="risk-box">
    <ul>${riskHtml}</ul>
  </div>

  <h2>按系统分布</h2>
  <table class="data-table" border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr>
        <th>系统</th>
        <th>变更数</th>
        <th>破坏性</th>
        <th>非破坏性</th>
        <th>破坏率</th>
      </tr>
    </thead>
    <tbody>${systemRows}</tbody>
  </table>

  <h2>本周亮点</h2>
  <div class="highlight-box">
    <ul>${highlightHtml}</ul>
  </div>

  <h2 style="border-left-color:#722ED1;mso-border-left-alt:solid #722ED1 4px;">推进进度</h2>
  <div class="progress-box">
    <ul>${progressHtml}</ul>
  </div>

  <h2 style="border-left-color:#00B42A;mso-border-left-alt:solid #00B42A 4px;">历史周报汇总</h2>
  <table class="data-table" border="1" cellpadding="6" cellspacing="0">
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
    © 2026 API 治理平台 · 本报告由系统自动生成 · ${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const filename = `API变更周报_${getFileDateRange(report)}_完整报告.doc`;
  triggerDownload(blob, filename);
}

export default function Reports() {
  const latest = mockWeeklyReport;
  const { showToast, ToastContainer } = useToast();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);
  const loadingRef = useRef(false);

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

  const handleExportPdf = async (): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingPdf(true);
    try {
      showToast('正在生成 PDF 报告...');
      await generatePdfReport(latest, mockReports);
      showToast('已生成 PDF 报告，正在下载...');
    } catch (err) {
      console.error(err);
      showToast('PDF 生成失败，请重试');
    } finally {
      setLoadingPdf(false);
      loadingRef.current = false;
    }
  };

  const handleExportExcel = (): void => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingExcel(true);
    try {
      showToast('正在生成 Excel 报告...');
      generateExcelReport(latest, mockReports);
      showToast('已生成 Excel 报告，正在下载...');
    } catch (err) {
      console.error(err);
      showToast('Excel 生成失败，请重试');
    } finally {
      setLoadingExcel(false);
      loadingRef.current = false;
    }
  };

  const handleExportWord = (): void => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingWord(true);
    try {
      showToast('正在生成 Word 报告...');
      generateWordReport(latest, mockReports);
      showToast('已生成 Word 报告，正在下载...');
    } catch (err) {
      console.error(err);
      showToast('Word 生成失败，请重试');
    } finally {
      setLoadingWord(false);
      loadingRef.current = false;
    }
  };

  const handleDownloadReport = async (report: WeeklyReport, idx: number): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setDownloadingReportId(idx);
    try {
      showToast(`正在生成 ${report.weekStart} ~ ${report.weekEnd} 周报...`);
      const otherHistory = mockReports.filter((_, i) => i !== idx);
      await generatePdfReportArchive(report, otherHistory);
      showToast(`已生成 ${report.weekStart} ~ ${report.weekEnd} 周报，正在下载...`);
    } catch (err) {
      console.error(err);
      showToast('周报生成失败，请重试');
    } finally {
      setDownloadingReportId(null);
      loadingRef.current = false;
    }
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
          <button
            className="btn-secondary"
            onClick={handleExportPdf}
            disabled={loadingPdf || loadingExcel || loadingWord || downloadingReportId !== null}
          >
            {loadingPdf ? (
              <>
                <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <FileText size={16} strokeWidth={1.8} />
                导出 PDF
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportExcel}
            disabled={loadingPdf || loadingExcel || loadingWord || downloadingReportId !== null}
          >
            {loadingExcel ? (
              <>
                <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Table size={16} strokeWidth={1.8} />
                导出 Excel
              </>
            )}
          </button>
          <button
            className="btn-primary"
            onClick={handleExportWord}
            disabled={loadingPdf || loadingExcel || loadingWord || downloadingReportId !== null}
          >
            {loadingWord ? (
              <>
                <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} strokeWidth={1.8} />
                导出 Word
              </>
            )}
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
                    onClick={() => handleDownloadReport(report, idx)}
                    disabled={downloadingReportId !== null}
                  >
                    {downloadingReportId === idx ? (
                      <>
                        <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
                        正在生成...
                      </>
                    ) : (
                      <>
                        <Download size={12} strokeWidth={1.8} />
                        下载
                      </>
                    )}
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
