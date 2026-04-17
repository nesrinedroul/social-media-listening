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
    <div className="flex flex-col h-full" style={{ background: 'var(--page)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            className="transition-colors" style={{ color: 'var(--text-2)' }}>
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-1">Back</span>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-3)' }} />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Type 3 or more characters to search"
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: '1px solid var(--brand)',
              borderRadius: 12,
              paddingLeft: 36, paddingRight: 60, paddingTop: 10, paddingBottom: 10,
              fontSize: 13, color: 'var(--text-1)', outline: 'none',
            }} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
            style={{ color: 'var(--text-3)' }}>/to focus</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!search && (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-3)' }}>
            <Search size={32} />
            <p className="text-sm">Search by name, email, or phone number</p>
          </div>
        )}
        {search && isLoading && (
          <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>Searching…</div>
        )}
        {search && !isLoading && clients.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>
            No results for "{query}"
          </div>
        )}
        {clients.length > 0 && (
          <div className="px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-3)' }}>
              Clients — {clients.length} found
            </p>
            <div className="space-y-1">
              {clients.map(client => (
                <Link key={client.id} to={`/clients/${client.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--active)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Avatar name={fullName(client) || client.sender_id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-1 truncate">{fullName(client) || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Unknown</span>}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
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



















// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { Search, ArrowLeft } from 'lucide-react';
// import { clientsApi } from '../../api/services';
// import { Avatar } from '../../components/ui/Avatar';
// import { PlatformBadge } from '../../components/ui/PlatformBadge';
// import { fullName } from '../../utils/utils';

// export function SearchPage() {
//   const navigate = useNavigate();
//   const [query, setQuery] = useState('');
//   const search = query.length >= 2 ? query : undefined;

//   const { data: clients = [], isLoading } = useQuery({
//     queryKey: ['clients', 'search', search],
//     queryFn: () => clientsApi.list(search).then(r => r.data),
//     enabled: !!search,
//   });

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header with search bar */}
//       <div className="px-5 py-4 border-b border-slate-800">
//         <div className="flex items-center gap-3 mb-4">
//           <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-200 transition-colors">
//             <ArrowLeft size={16} />
//           </button>
//           <span className="text-sm font-medium text-slate-300">Back</span>
//         </div>
//         <div className="relative">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
//           <input
//             autoFocus
//             value={query}
//             onChange={e => setQuery(e.target.value)}
//             placeholder="Type 3 or more characters to search"
//             className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
//           />
//           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">/to focus</span>
//         </div>
//       </div>

//       {/* Results */}
//       <div className="flex-1 overflow-y-auto">
//         {!search && (
//           <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
//             <Search size={32} className="text-slate-700" />
//             <p className="text-sm">Search by name, email, or phone number</p>
//           </div>
//         )}

//         {search && isLoading && (
//           <div className="flex items-center justify-center py-12 text-slate-500 text-sm">Searching…</div>
//         )}

//         {search && !isLoading && clients.length === 0 && (
//           <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
//             No results for "{query}"
//           </div>
//         )}

//         {clients.length > 0 && (
//           <div className="px-5 py-3">
//             <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
//               Clients — {clients.length} found
//             </p>
//             <div className="space-y-1">
//               {clients.map(client => (
//                 <Link
//                   key={client.id}
//                   to={`/clients/${client.id}`}
//                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
//                 >
//                   <Avatar name={fullName(client) || client.sender_id} size="sm" />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm text-slate-200 truncate">
//                       {fullName(client) || <span className="text-slate-500">Unknown</span>}
//                     </p>
//                     <p className="text-xs text-slate-500 truncate">
//                       {client.phone && `${client.phone} · `}{client.email}
//                     </p>
//                   </div>
//                   <PlatformBadge platform={client.source} />
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
