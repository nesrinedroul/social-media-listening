import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Check, X } from 'lucide-react';
import type { Client } from '../../types';
import { clientsApi } from '../../api/services';
import { PlatformBadge } from '../ui/PlatformBadge';
import { timeAgo } from '../../utils/utils';

function EditableField({ label, value, field, clientId, onSaved }:
  { label: string; value: string; field: keyof Pick<Client,'first_name'|'last_name'|'phone'|'email'>; clientId: string; onSaved: (u: Client) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const { mutate, isPending } = useMutation({
    mutationFn: () => clientsApi.update(clientId, { [field]: draft }).then(r => r.data),
    onSuccess: (updated) => { onSaved(updated); setEditing(false); },
  });

  return (
    <div className="group">
      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--brand)',
              borderRadius: 6, padding: '4px 8px', fontSize: 13, color: 'var(--text-1)', outline: 'none' }} />
          <button onClick={() => mutate()} disabled={isPending} className="text-emerald-400 hover:text-emerald-300 p-1"><Check size={13} /></button>
          <button onClick={() => { setEditing(false); setDraft(value); }} className="p-1" style={{ color: 'var(--text-3)' }}><X size={13} /></button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-1">{value || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Not set</span>}</p>
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-all p-1" style={{ color: 'var(--text-3)' }}>
            <Edit2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ClientPanel({ client: initialClient }: { client: Client }) {
  const qc = useQueryClient();
  const [client, setClient] = useState(initialClient);

  const handleSaved = (updated: Client) => {
    setClient(updated);
    qc.invalidateQueries({ queryKey: ['client', client.id] });
  };

  return (
    <div className="w-72 shrink-0 flex flex-col h-full"
      style={{ borderLeft: '1px solid var(--border)', background: 'var(--sidebar)' }}>
      {/* tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className="flex-1 py-2.5 text-xs font-semibold border-b-2"
          style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>Contact</button>
        <button className="flex-1 py-2.5 text-xs" style={{ color: 'var(--text-3)', borderBottom: '2px solid transparent' }}>Copilot</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Source</p>
          <PlatformBadge platform={client.source} />
        </div>
        <EditableField label="First name" value={client.first_name} field="first_name" clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Last name"  value={client.last_name}  field="last_name"  clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Phone"      value={client.phone}      field="phone"      clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Email"      value={client.email}      field="email"      clientId={client.id} onSaved={handleSaved} />
        <div>
          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Sender ID</p>
          <p className="text-sm font-mono break-all text-1">{client.sender_id}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>First contact</p>
          <p className="text-sm text-1">{timeAgo(client.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
