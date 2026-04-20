import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { timeAgo } from '../../utils/utils';
import type { UserStatus } from '../../types';

const statusLabel: Record<UserStatus, string> = {
  online: 'Online',
  busy: 'Busy',
  offline: 'Offline',
};

const statusCls: Record<UserStatus, string> = {
  online:  'bg-emerald-500/15 text-emerald-400',
  busy:    'bg-amber-500/15 text-amber-400',
  offline: 'bg-slate-700 text-slate-400',
};

export function AgentsPage() {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => authApi.agents().then(r => r.data),
    refetchInterval: 10_000,
  });

  const online  = agents.filter(a => a.status === 'online').length;
  const busy    = agents.filter(a => a.status === 'busy').length;
  const offline = agents.filter(a => a.status === 'offline').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-slate-100">Agents</h1>
          <span className="text-xs text-slate-500">{agents.length} total</span>
        </div>
        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">{online} online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">{busy} busy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-400">{offline} offline</span>
          </div>
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">Loading…</div>
        )}

        {!isLoading && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
            <Users size={32} className="text-slate-700" />
            <p className="text-sm">No agents found</p>
          </div>
        )}

        <div className="divide-y divide-slate-800/60">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-4 px-5 py-3.5">
              <Avatar
                name={agent.full_name || agent.email}
                size="md"
                status={agent.status ?? 'offline'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {agent.full_name || agent.email}
                </p>
                <p className="text-xs text-slate-500 truncate">{agent.email}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{agent.open_conversations}</p>
                  <p className="text-[10px] text-slate-500">open</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">
                    {agent.last_seen ? timeAgo(agent.last_seen) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-500">last seen</p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusCls[agent.status ?? 'offline']}`}>
                  {statusLabel[agent.status ?? 'offline']}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}