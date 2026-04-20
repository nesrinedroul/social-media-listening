import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { clientsApi, conversationsApi } from '../../api/services';
import { ClientPanel } from '../../components/conversations/ClientPanel';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { fullName, timeAgo } from '../../utils/utils';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.list().then(r => r.data),
  });

  const clientConversations = conversations.filter(c => c.client.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-3 text-sm">Loading…</div>
    );
  }

  if (!client) return null;

  const name = fullName(client) || client.sender_id;

  return (
    <div className="flex h-full bg-page">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-theme">
          <button onClick={() => navigate(-1)} className="text-3 hover:text-1 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <Avatar name={name} size="md" />
          <div>
            <p className="text-sm font-semibold text-1">{name}</p>
            <PlatformBadge platform={client.source} />
          </div>
        </div>

        {/* Previous conversations */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-3 mb-3">
            Previous conversations ({clientConversations.length})
          </h2>
          {clientConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-3 gap-2">
              <MessageSquare size={28} className="text-3" />
              <p className="text-sm">No conversations found</p>
            </div>
          )}
          <div className="space-y-2">
            {clientConversations.map(conv => (
              <Link
                key={conv.id}
                to={`/conversations/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 bg-active rounded-xl hover:bg-search transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PlatformBadge platform={conv.channel.platform} />
                    <StatusBadge status={conv.status} />
                  </div>
                  <p className="text-xs text-3">
                    Agent: {conv.agent ? fullName(conv.agent) : 'Unassigned'} · {timeAgo(conv.updated_at)}
                  </p>
                </div>
                <MessageSquare size={14} className="text-3 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Client info panel */}
      <ClientPanel client={client} />
    </div>
  );
}