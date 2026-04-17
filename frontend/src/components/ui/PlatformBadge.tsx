import type { Platform } from '../../types';

const cfg: Record<Platform, { label: string; cls: string; dot: string }> = {
  facebook:  { label: 'Facebook',  cls: 'bg-blue-500/15 text-blue-500',   dot: 'bg-blue-500' },
  instagram: { label: 'Instagram', cls: 'bg-pink-500/15 text-pink-500',   dot: 'bg-pink-500' },
  whatsapp:  { label: 'WhatsApp',  cls: 'bg-emerald-500/15 text-emerald-500', dot: 'bg-emerald-500' },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, cls, dot } = cfg[platform] ?? cfg.facebook;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
