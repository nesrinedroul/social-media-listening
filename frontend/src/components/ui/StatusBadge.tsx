import type { ConversationStatus } from '../../types';
import { statusBadge } from '../../utils/utils';

export function StatusBadge({ status }: { status: ConversationStatus }) {
  const { label, cls } = statusBadge[status] ?? statusBadge.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
