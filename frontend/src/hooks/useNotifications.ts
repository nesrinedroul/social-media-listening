import { toast } from '../utils/toast';
import type { WsNewConversation } from '../types';

/** Call once after login to request browser notification permission. */
export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/** Show a native browser notification (if permitted) for a new conversation. */
function showBrowserNotification(event: WsNewConversation) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const sourceLabel: Record<string, string> = {
    facebook:  'Facebook',
    instagram: 'Instagram',
    whatsapp:  'WhatsApp',
    email:     'Email',
  };

  const title = `New ${sourceLabel[event.source] ?? event.source} conversation`;
  const body  = `${event.client_name}: ${event.preview}`;

  try {
    const n = new Notification(title, { body, icon: '/favicon.ico' });
    setTimeout(() => n.close(), 6_000);
  } catch {
    // constructor can throw in some environments
  }
}

/** Called when a `new_conversation` WebSocket event arrives. */
export function handleNewConversationNotification(event: WsNewConversation) {
  const sourceLabel: Record<string, string> = {
    facebook:  'Facebook',
    instagram: 'Instagram',
    whatsapp:  'WhatsApp',
    email:     'Email',
  };
  const label   = sourceLabel[event.source] ?? event.source;
  const preview = event.preview ? `: ${event.preview}` : '';
  toast(`New ${label} conversation from ${event.client_name}${preview}`, 'info');
  showBrowserNotification(event);
}