// pages/conversations/ConversationDetailPage.tsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Send, MoreVertical, CheckCircle, UserPlus } from 'lucide-react';
import { conversationsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ClientPanel } from '../../components/conversations/ClientPanel';
import { ReassignModal } from '../../components/conversations/ReassignModal';
import { fullName, formatTime } from '../../utils/utils';
import type { WsEvent } from '../../types';

export function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversationsApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => conversationsApi.messages(id!).then(r => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const { sendReply } = useConversationSocket({
    onEvent: (event: WsEvent) => {
      if (event.type === 'new_message' && event.conversation_id === id) {
        qc.invalidateQueries({ queryKey: ['messages', id] });
      }
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => conversationsApi.resolve(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendReply = () => {
    const text = replyText.trim();
    if (!text || !id) return;
    sendReply(id, text);
    setReplyText('');
    setTimeout(() => qc.invalidateQueries({ queryKey: ['messages', id] }), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply();
  };

  const isResolved = conversation?.status === 'resolved' || conversation?.status === 'closed';
  const clientName = conversation ? (fullName(conversation.client) || conversation.client.sender_id) : '…';
  const agentName = conversation?.agent ? fullName(conversation.agent) : 'Unassigned';
  const canModify = user?.role !== 'agent' || conversation?.agent?.id === user?.id;
  const isSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  return (
    <div className="flex h-full bg-page">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-theme shrink-0">
          <button
            onClick={() => navigate('/conversations')}
            className="text-3 hover:text-1 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>

          {conversation && (
            <>
              <Avatar name={clientName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-1 truncate">{clientName}</p>
                  <PlatformBadge platform={conversation.channel.platform} />
                  <StatusBadge status={conversation.status} />
                </div>
                <p className="text-xs text-3 truncate">Agent: {agentName}</p>
              </div>

              {/* Actions dropdown – only for open/pending conversations */}
              {!isResolved && canModify && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1.5 rounded-lg hover:bg-active text-2 hover:text-1 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-popup border border-theme rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            resolveMutation.mutate();
                          }}
                          disabled={resolveMutation.isPending}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-1 hover:bg-active transition-colors"
                        >
                          <CheckCircle size={14} className="text-emerald-500" />
                          Resolve
                        </button>
                        {isSupervisor && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setReassignOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-1 hover:bg-active transition-colors"
                          >
                            <UserPlus size={14} className="text-brand" />
                            Reassign
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Messages thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {msgsLoading && (
            <div className="flex items-center justify-center py-8 text-3 text-sm">
              Loading messages…
            </div>
          )}

          {!msgsLoading && messages.length === 0 && (
            <div className="flex items-center justify-center py-8 text-3 text-sm">
              No messages yet.
            </div>
          )}

          {messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            return (
              <div key={msg.id} className={`flex gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                {!isOutbound && conversation && (
                  <Avatar name={clientName} size="sm" />
                )}
                <div className="max-w-[72%] group">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOutbound
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.text || <span className="italic text-slate-400">[{msg.type}]</span>}
                  </div>
                  <p className={`text-[10px] text-3 mt-1 ${isOutbound ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                {isOutbound && user && (
                  <Avatar name={fullName(user)} size="sm" />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {!isResolved && (
          <div className="border-t border-theme p-3 shrink-0">
            <div className="flex gap-2 items-end bg-input rounded-xl px-3 py-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply… (⌘↵ to send)"
                rows={2}
                className="flex-1 bg-transparent text-sm text-1 placeholder:text-3 resize-none outline-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="shrink-0 text-brand hover:text-brand-h disabled:text-3 disabled:cursor-not-allowed transition-colors pb-0.5"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-3 mt-1.5 text-right">⌘↵ to send</p>
          </div>
        )}

        {isResolved && (
          <div className="border-t border-theme p-4 text-center">
            <p className="text-xs text-3">This conversation has been {conversation?.status}.</p>
          </div>
        )}
      </div>

      {/* Client info panel */}
      {conversation && <ClientPanel client={conversation.client} />}

      {/* Reassign modal */}
      {id && (
        <ReassignModal
          conversationId={id}
          open={reassignOpen}
          onClose={() => setReassignOpen(false)}
        />
      )}
    </div>
  );
}