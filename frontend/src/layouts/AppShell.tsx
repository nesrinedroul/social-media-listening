import { Outlet } from 'react-router-dom';
import { Sidebar } from './SideBar';
import { useAuthStore } from '../store/authStore';
import { useConversationSocket } from '../hooks/useConversationSocket';
import { useQueryClient } from '@tanstack/react-query';
import type { WsEvent } from '../types/index';

export function AppShell() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const handleWsEvent = (event: WsEvent) => {
    if (event.type === 'new_conversation' || event.type === 'new_message') {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      if (event.type === 'new_message') {
        qc.invalidateQueries({ queryKey: ['messages', event.conversation_id] });
      }
    }
  };

  useConversationSocket({ onEvent: handleWsEvent, enabled: !!user });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--page)', color: 'var(--text-1)' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden" style={{ background: 'var(--page)' }}>
        <Outlet />
      </main>
    </div>
  );
}
