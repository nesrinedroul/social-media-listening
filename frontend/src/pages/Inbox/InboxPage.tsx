import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { conversationsApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fullName, timeAgo } from '../../utils/utils';

export function InboxPage() {
  // Agents only see their own — backend filters by auth user
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', 'open'],
    queryFn: () => conversationsApi.list('open').then(r => r.data),
    refetchInterval: 15_000,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <h1 className="font-semibold text-slate-100">My Inbox</h1>
        <span className="text-xs text-slate-500">{conversations.length} open</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading…</div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
              <Inbox size={24} className="text-slate-600" />
            </div>
            <p className="text-sm">No notifications from all subscribed inboxes</p>
          </div>
        )}

        {conversations.map(conv => {
          const clientName = fullName(conv.client) || conv.client.sender_id;
          return (
            <Link
              key={conv.id}
              to={`/conversations/${conv.id}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
            >
              <Avatar name={clientName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-200 truncate">{clientName}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(conv.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={conv.channel.platform} />
                  <StatusBadge status={conv.status} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}