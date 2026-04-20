import { initials } from '../../utils/utils';

const COLORS = [
  'bg-violet-600', 'bg-brand', 'bg-emerald-600',
  'bg-pink-600', 'bg-amber-600', 'bg-cyan-600',
];

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'busy' | 'offline' | null;
}

const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
const dotMap  = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
const statusDotColor = { online: 'bg-emerald-500', busy: 'bg-amber-500', offline: 'bg-gray-400' };

export function Avatar({ name, size = 'md', status }: AvatarProps) {
  const idx = name.charCodeAt(0) % COLORS.length;
  return (
    <div className="relative shrink-0">
      <div className={`${sizeMap[size]} ${COLORS[idx]} rounded-full flex items-center justify-center font-semibold text-white`}>
        {initials(name)}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotMap[size]} ${statusDotColor[status]} rounded-full ring-2`}
          style={{ '--tw-ring-color': 'var(--sidebar)' } as React.CSSProperties}
        />
      )}
    </div>
  );
}