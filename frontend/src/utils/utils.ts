import type { Platform, UserStatus, ConversationStatus } from '../types';

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const platformColors: Record<Platform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  whatsapp: '#25D366',
};

export const platformLabels: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
};

export const statusColors: Record<UserStatus, string> = {
  online: '#44b700',
  busy: '#ff9800',
  offline: '#9e9e9e',
};

export const statusBadge: Record<ConversationStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-yellow-500/20 text-yellow-400' },
  open: { label: 'Open', cls: 'bg-blue-500/20 text-blue-400' },
  resolved: { label: 'Resolved', cls: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Closed', cls: 'bg-slate-500/20 text-slate-400' },
};

export function fullName(u: { first_name: string; last_name: string; email: string }): string {
  return `${u.first_name} ${u.last_name}`.trim() || u.email;
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}