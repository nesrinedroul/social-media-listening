import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCheck, UserCog, Send } from 'lucide-react';
import { conversationsApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
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
  const [replyTab, setReplyTab] = useState<'reply'|'note'>('reply');
  const [reassignOpen, setReassignOpen] = useState(false);

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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

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

  const isSupervisor = user?.role === 'admin' || user?.role === 'supervisor';
  const isResolved = conversation?.status === 'resolved' || conversation?.status === 'closed';
  const clientName = conversation ? (fullName(conversation.client) || conversation.client.sender_id) : '…';
  const agentName  = conversation?.agent ? fullName(conversation.agent) : 'Unassigned';

  return (
    <div className="flex h-full" style={{ background: 'var(--page)' }}>
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--sidebar)' }}>
          <button onClick={() => navigate('/conversations')}
            className="transition-colors" style={{ color: 'var(--text-2)' }}>
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
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>Agent: {agentName}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSupervisor && (
                  <Button variant="secondary" size="sm" onClick={() => setReassignOpen(true)}>
                    <UserCog size={13} /> Reassign
                  </Button>
                )}
                {!isResolved && (
                  <Button variant="secondary" size="sm"
                    loading={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate()}
                    style={{ color: '#4ade80', borderColor: '#16a34a44', background: '#14532d22' }}>
                    <CheckCheck size={13} /> Resolve
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: 'var(--page)' }}>
          {msgsLoading && (
            <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
              Loading messages…
            </div>
          )}
          {!msgsLoading && messages.length === 0 && (
            <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
              No messages yet.
            </div>
          )}

          {messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            return (
              <div key={msg.id} className={`flex gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                {!isOutbound && conversation && <Avatar name={clientName} size="sm" />}
                <div className="max-w-[72%]">
                  {/* ── message colors intentionally unchanged (blue outbound, dark inbound) ── */}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOutbound
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={!isOutbound ? { background: 'var(--active)', color: 'var(--text-1)' } : {}}>
                    {msg.text || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>[{msg.type}]</span>}
                  </div>
                  <p className={`text-[10px] mt-1 ${isOutbound ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-3)' }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                {isOutbound && user && <Avatar name={fullName(user)} size="sm" />}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {!isResolved ? (
          <div className="shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--sidebar)' }}>
            {/* reply / note tabs */}
            <div className="flex px-4" style={{ borderBottom: '1px solid var(--border)' }}>
              {(['reply', 'note'] as const).map(t => (
                <button key={t} onClick={() => setReplyTab(t)}
                  className="px-4 py-2 text-xs font-medium border-b-2 transition-colors capitalize"
                  style={{
                    borderColor: replyTab === t ? 'var(--brand)' : 'transparent',
                    color: replyTab === t ? 'var(--brand)' : 'var(--text-2)',
                  }}>
                  {t === 'reply' ? 'Reply' : 'Private Note'}
                </button>
              ))}
            </div>
            <div className="p-3">
              <div className="flex gap-2 items-end rounded-xl px-3 py-2"
                style={{ background: 'var(--search)', border: '1px solid var(--border)' }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={replyTab === 'reply' ? 'Write a reply… (⌘↵ to send)' : 'Write a private note…'}
                  rows={2} style={{ flex: 1, background: 'transparent', color: 'var(--text-1)', fontSize: 13,
                    resize: 'none', outline: 'none', lineHeight: 1.5 }} />
                <button onClick={handleSendReply} disabled={!replyText.trim()}
                  className="shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors pb-0.5"
                  style={{ color: 'var(--brand)' }}>
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] mt-1.5 text-right" style={{ color: 'var(--text-3)' }}>⌘↵ to send</p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              This conversation has been {conversation?.status}.
            </p>
          </div>
        )}
      </div>

      {/* Client panel */}
      {conversation && <ClientPanel client={conversation.client} />}

      {/* Reassign modal */}
      {id && <ReassignModal conversationId={id} open={reassignOpen} onClose={() => setReassignOpen(false)} />}
    </div>
  );
}
