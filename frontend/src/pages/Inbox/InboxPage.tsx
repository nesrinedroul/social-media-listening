import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { conversationsApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fullName, timeAgo } from '../../utils/utils';

export function InboxPage() {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', 'open'],
    queryFn: () => conversationsApi.list('open').then(r => r.data),
    refetchInterval: 15_000,
  });

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
        <h1 className="font-semibold text-1">My Inbox</h1>
        <span className="text-xs text-3">{conversations.length} open</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-(--border)">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-3 text-sm">Loading…</div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-3 gap-3">
            <div className="w-14 h-14 rounded-full bg-active flex items-center justify-center">
              <Inbox size={24} className="text-3" />
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
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-active transition-colors"
            >
              <Avatar name={clientName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-medium text-1 truncate">{clientName}</span>
                  <span className="text-[11px] text-3 shrink-0">{timeAgo(conv.updated_at)}</span>
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