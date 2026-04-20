import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { clientsApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { fullName, timeAgo } from '../../utils/utils';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const q = search.length >= 2 ? search : undefined;

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', q],
    queryFn: () => clientsApi.list(q).then(r => r.data),
  });

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="px-5 py-3 border-b border-theme">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-1">Clients</h1>
          <span className="text-xs text-3">{clients.length} contacts</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-3" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full bg-input border border-theme rounded-lg pl-8 pr-3 py-2 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">Loading…</div>
        )}

        {!isLoading && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-3 gap-3">
            <Users size={32} className="text-3" />
            <p className="text-sm">No clients found</p>
          </div>
        )}

        <div className="divide-y divide-(--border)">
          {clients.map(client => {
            const name = fullName(client) || client.sender_id;
            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-active transition-colors"
              >
                <Avatar name={name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-1 truncate">{name}</p>
                  <p className="text-xs text-3 truncate">
                    {client.phone && `${client.phone} · `}
                    {client.email || client.sender_id}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <PlatformBadge platform={client.source} />
                  <span className="text-xs text-3">{timeAgo(client.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}