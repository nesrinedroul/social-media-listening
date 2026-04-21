import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { conversationsApi } from '../../api/services';
import type { ConversationStatus } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fullName, timeAgo } from '../../utils/utils';
import { useAuthStore } from '../../store/authStore';

const TABS: { label: string; value: ConversationStatus | undefined }[] = [
  { label: 'All',      value: undefined },
  { label: 'Open',     value: 'open' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
];

export function ConversationsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ConversationStatus | undefined>('open');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', activeTab],
    queryFn: () => conversationsApi.list(activeTab).then(r => r.data),
    refetchInterval: 15_000,
  });

  const isSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-1">Conversations</h1>
          <StatusBadge status={activeTab ?? 'open'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme px-5">
        {TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-brand text-brand'
                : 'border-transparent text-2 hover:text-1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-(--border)">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-3 text-sm">
            Loading…
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-3 gap-3">
            <p className="text-sm">There are no active conversations in this group.</p>
          </div>
        )}

        {conversations.map(conv => {
          const clientName = fullName(conv.client) || conv.client.sender_id;
          const agentName  = conv.agent ? fullName(conv.agent) : null;
          return (
            <Link
              key={conv.id}
              to={`/conversations/${conv.id}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-active transition-colors group"
            >
              <Avatar name={clientName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-medium text-1 truncate">{clientName}</span>
                  <span className="text-[11px] text-3 shrink-0">{timeAgo(conv.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <PlatformBadge platform={conv.channel.platform} />
                  <StatusBadge status={conv.status} />
                </div>
                {isSupervisor && agentName && (
                  <p className="text-[11px] text-3 truncate">Agent: {agentName}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}