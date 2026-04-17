import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authApi, conversationsApi } from '../../api/services';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

const statusDot: Record<string, string> = {
  online: 'bg-emerald-500', busy: 'bg-amber-500', offline: 'bg-gray-500',
};

interface Props { conversationId: string; open: boolean; onClose: () => void }

export function ReassignModal({ conversationId, open, onClose }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => authApi.agents().then(r => r.data),
    enabled: open,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => conversationsApi.reassign(conversationId, selected!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Reassign Conversation">
      <p className="text-xs mb-4" style={{ color: 'var(--text-2)' }}>Select an agent to reassign this conversation to.</p>
      <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
        {agents.map(agent => (
          <button key={agent.id} onClick={() => setSelected(agent.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{
              background: selected === agent.id ? 'var(--brand-bg)' : 'transparent',
              border: `1px solid ${selected === agent.id ? 'var(--brand)' : 'transparent'}`,
            }}
            onMouseEnter={e => { if (selected !== agent.id) (e.currentTarget as HTMLElement).style.background = 'var(--active)'; }}
            onMouseLeave={e => { if (selected !== agent.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div className="relative">
              <Avatar name={agent.full_name || agent.email} size="sm" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ${statusDot[agent.status ?? 'offline']}`}
                style={{ '--tw-ring-color': 'var(--popup)' } as React.CSSProperties} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm text-1 truncate">{agent.full_name || agent.email}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{agent.open_conversations} open</p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={agent.status === 'online' ? { background: '#14532d22', color: '#4ade80' }
                   : agent.status === 'busy'   ? { background: '#92400e22', color: '#fbbf24' }
                   :                             { background: 'var(--active)', color: 'var(--text-3)' }}>
              {agent.status ?? 'offline'}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={!selected} loading={isPending} onClick={() => mutate()}
          style={{ background: 'var(--brand)', color: '#fff' }}>
          Reassign
        </Button>
      </div>
    </Modal>
  );
}
