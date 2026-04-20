import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import { clientsApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { fullName } from '../../utils/utils';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const search = query.length >= 2 ? query : undefined;

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', 'search', search],
    queryFn: () => clientsApi.list(search).then(r => r.data),
    enabled: !!search,
  });

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header with search bar */}
      <div className="px-5 py-4 border-b border-theme">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-3 hover:text-1 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-2">Back</span>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-3" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type 2 or more characters to search"
            className="w-full bg-input border border-theme rounded-xl pl-9 pr-4 py-3 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-3">/to focus</span>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!search && (
          <div className="flex flex-col items-center justify-center py-20 text-3 gap-3">
            <Search size={32} className="text-3" />
            <p className="text-sm">Search by name, email, or phone number</p>
          </div>
        )}

        {search && isLoading && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">Searching…</div>
        )}

        {search && !isLoading && clients.length === 0 && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">
            No results for "{query}"
          </div>
        )}

        {clients.length > 0 && (
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-3 mb-3">
              Clients — {clients.length} found
            </p>
            <div className="space-y-1">
              {clients.map(client => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-active transition-colors"
                >
                  <Avatar name={fullName(client) || client.sender_id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-1 truncate">
                      {fullName(client) || <span className="text-3">Unknown</span>}
                    </p>
                    <p className="text-xs text-3 truncate">
                      {client.phone && `${client.phone} · `}{client.email}
                    </p>
                  </div>
                  <PlatformBadge platform={client.source} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}