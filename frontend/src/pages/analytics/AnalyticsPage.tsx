import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, Users, CheckCircle, Clock,
  TrendingUp, Download, RefreshCw, UserCheck,
} from 'lucide-react';
import { analyticsApi } from '../../api/services';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { downloadBlob } from '../../utils/utils';
import type { Platform, ExportParams } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  color?: string;
}

function KpiCard({ label, value, icon, sub, color = 'text-brand' }: KpiCardProps) {
  return (
    <div className="bg-sidebar border border-theme rounded-xl p-4 flex items-start gap-4">
      <div className={`w-9 h-9 rounded-lg bg-active flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-1 leading-none mb-1">{value}</p>
        <p className="text-xs text-2">{label}</p>
        {sub && <p className="text-[10px] text-3 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Simple bar chart using pure CSS ─────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
}

function BarChart({ data, height = 120 }: BarChartProps) {
  const max = Math.max(...data.map(d => Math.max(d.value, d.value2 ?? 0)), 1);
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-popup border border-theme rounded px-2 py-1 text-[10px] text-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
            style={{ bottom: `${Math.round((Math.max(d.value, d.value2 ?? 0) / max) * (height - 20)) + 8}px` }}
          >
            {d.label}: {d.value}{d.value2 !== undefined ? ` / ${d.value2}` : ''}
          </div>
          <div className="w-full flex gap-0.5 items-end" style={{ height: height - 20 }}>
            <div
              className="flex-1 bg-brand/60 rounded-t transition-all"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            {d.value2 !== undefined && (
              <div
                className="flex-1 bg-emerald-500/60 rounded-t transition-all"
                style={{ height: `${(d.value2 / max) * 100}%` }}
              />
            )}
          </div>
          <p className="text-[9px] text-3 truncate w-full text-center">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────

type ExportType = 'conversations' | 'agents' | 'clients' | 'full';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  type: ExportType;
}

function ExportModal({ open, onClose, type }: ExportModalProps) {
  const [dateFrom, setDateFrom] = useState(nDaysAgoStr(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const titles: Record<ExportType, string> = {
    conversations: 'Export Conversations',
    agents:        'Export Agent Performance',
    clients:       'Export Clients',
    full:          'Export Full Report',
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    const params: ExportParams = { date_from: dateFrom, date_to: dateTo, format };
    try {
      let res;
      if (type === 'conversations') res = await analyticsApi.exportConversations(params);
      else if (type === 'agents')   res = await analyticsApi.exportAgents(params);
      else if (type === 'clients')  res = await analyticsApi.exportClients(params);
      else                          res = await analyticsApi.exportFull(params);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data as Blob, `${type}-report-${dateTo}.${ext}`);
      onClose();
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={titles[type]}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {type !== 'clients' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">Format</label>
            <div className="flex gap-2">
              {(['xlsx', 'pdf'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === f
                      ? 'border-brand text-brand bg-brand-bg'
                      : 'border-theme text-3 bg-active hover:border-brand hover:text-1'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={handleExport}>
            <Download size={13} /> Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(nDaysAgoStr(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [exportType, setExportType] = useState<ExportType | null>(null);

  // Directly use nested backend response — no manual mapping required
  const { data: raw, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['analytics', dateFrom, dateTo],
    queryFn: () => analyticsApi.stats({ date_from: dateFrom, date_to: dateTo }).then(r => r.data),
  });

  const overview = raw?.overview;
  const trends = raw?.trends ?? [];
  const platforms = raw?.platform_breakdown ?? [];
  const agents = raw?.agent_performance ?? [];

  const trendChartData = trends.map(t => ({
    label: t.period,      // short date (YYYY-MM-DD), may slice if desired
    value: t.total,
    value2: t.resolved,
  }));

  const totalForPlatforms = platforms.reduce((s, p) => s + p.total, 0) || 1;

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="px-5 py-3 border-b border-theme shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-1">Analytics</h1>
            <p className="text-xs text-3 mt-0.5">Platform performance overview</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-input border border-theme rounded-lg px-3 py-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-xs text-1 outline-none"
              />
              <span className="text-3 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-xs text-1 outline-none"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw size={13} />
            </Button>
            <Button size="sm" onClick={() => setExportType('full')}>
              <Download size={13} /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-3 text-sm">Loading analytics…</div>
        )}

        {!isLoading && overview && (
          <>
            {/* KPI grid */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-3 mb-3">Overview</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                  label="Total conversations"
                  value={overview.conversations.total}
                  icon={<MessageSquare size={16} />}
                  color="text-brand"
                />
                <KpiCard
                  label="Open"
                  value={overview.conversations.open}
                  icon={<Clock size={16} />}
                  color="text-blue-400"
                />
                <KpiCard
                  label="Resolved"
                  value={overview.conversations.resolved}
                  icon={<CheckCircle size={16} />}
                  color="text-emerald-400"
                />
                <KpiCard
                  label="Pending"
                  value={overview.conversations.pending}
                  icon={<TrendingUp size={16} />}
                  color="text-yellow-400"
                />
                <KpiCard
                  label="Total clients"
                  value={overview.clients.total}
                  icon={<Users size={16} />}
                  sub={`+${overview.clients.new_today} today`}
                  color="text-pink-400"
                />
                <KpiCard
                  label="Agents online"
                  value={overview.agents.online}
                  icon={<UserCheck size={16} />}
                  sub={`${overview.agents.busy} busy · ${overview.agents.offline} offline`}
                  color="text-emerald-400"
                />
              </div>
            </div>

            {/* Trend chart */}
            {trendChartData.length > 0 && (
              <div className="bg-sidebar border border-theme rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-1">Daily Trends</p>
                  <div className="flex items-center gap-4 text-[10px] text-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-brand/60" /> Conversations
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" /> Resolved
                    </span>
                  </div>
                </div>
                <BarChart data={trendChartData} height={130} />
              </div>
            )}

            {/* Platform breakdown + Agent perf side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Platform breakdown */}
              <div className="bg-sidebar border border-theme rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-1">Platform Breakdown</p>
                  <Button variant="ghost" size="sm" onClick={() => setExportType('conversations')}>
                    <Download size={11} /> Export
                  </Button>
                </div>
                {platforms.length === 0 && (
                  <p className="text-xs text-3 py-4 text-center">No data available.</p>
                )}
                <div className="space-y-3">
                  {platforms.map(p => {
                    const pct = Math.round((p.total / totalForPlatforms) * 100);
                    return (
                      <div key={p.channel__platform}>
                        <div className="flex items-center justify-between mb-1.5">
                          <PlatformBadge platform={p.channel__platform as Platform} />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-1 font-medium">{p.total}</span>
                            <span className="text-[10px] text-3">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-active rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand/70 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agent performance */}
              <div className="bg-sidebar border border-theme rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-1">Agent Performance</p>
                  <Button variant="ghost" size="sm" onClick={() => setExportType('agents')}>
                    <Download size={11} /> Export
                  </Button>
                </div>
                {agents.length === 0 && (
                  <p className="text-xs text-3 py-4 text-center">No agent data available.</p>
                )}
                <div className="space-y-0 divide-y divide-(--border)">
                  {agents.map((a, i) => (
                    <div key={a.agent_id} className="flex items-center gap-3 py-2.5">
                      <span className="text-[10px] text-3 w-4 shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-1 truncate">{a.agent_name}</p>
                        <p className="text-[10px] text-3">{a.total_handled} handled</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-1">{a.resolution_rate}%</p>
                        <p className="text-[10px] text-3">resolution</p>
                      </div>
                      <div className="w-12 h-1.5 bg-active rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-emerald-500/70 rounded-full"
                          style={{ width: `${a.resolution_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export shortcuts */}
            <div className="bg-sidebar border border-theme rounded-xl p-4">
              <p className="text-xs font-semibold text-1 mb-3">Export Reports</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {([
                  { type: 'conversations' as ExportType, label: 'Conversations' },
                  { type: 'agents'        as ExportType, label: 'Agent Performance' },
                  { type: 'clients'       as ExportType, label: 'Clients' },
                  { type: 'full'          as ExportType, label: 'Full Report' },
                ]).map(item => (
                  <button
                    key={item.type}
                    onClick={() => setExportType(item.type)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-active hover:bg-search border border-theme rounded-lg text-xs text-1 transition-colors"
                  >
                    <Download size={12} className="text-brand shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export modal */}
      {exportType && (
        <ExportModal
          open={!!exportType}
          onClose={() => setExportType(null)}
          type={exportType}
        />
      )}
    </div>
  );
}