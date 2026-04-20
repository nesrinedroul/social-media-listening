import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Check, X } from 'lucide-react';
import type { Client } from '../../types';
import { clientsApi } from '../../api/services';
import { PlatformBadge } from '../ui/PlatformBadge';
import { timeAgo } from '../../utils/utils';

interface ClientPanelProps {
  client: Client;
}

interface EditableFieldProps {
  label: string;
  value: string;
  field: keyof Pick<Client, 'first_name' | 'last_name' | 'phone' | 'email'>;
  clientId: string;
  onSaved: (updated: Client) => void;
}

function EditableField({ label, value, field, clientId, onSaved }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const { mutate, isPending } = useMutation({
    mutationFn: () => clientsApi.update(clientId, { [field]: draft }).then(r => r.data),
    onSuccess: (updated) => { onSaved(updated); setEditing(false); },
  });

  return (
    <div className="group">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-1 bg-slate-800 border border-blue-500/50 rounded px-2 py-1 text-sm text-slate-100 outline-none"
          />
          <button onClick={() => mutate()} disabled={isPending} className="text-emerald-400 hover:text-emerald-300 p-1">
            <Check size={13} />
          </button>
          <button onClick={() => { setEditing(false); setDraft(value); }} className="text-slate-400 hover:text-slate-300 p-1">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-200">{value || <span className="text-slate-600 italic">Not set</span>}</p>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-all p-1"
          >
            <Edit2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ClientPanel({ client: initialClient }: ClientPanelProps) {
  const qc = useQueryClient();
  const [client, setClient] = useState(initialClient);

  const handleSaved = (updated: Client) => {
    setClient(updated);
    qc.invalidateQueries({ queryKey: ['client', client.id] });
  };

  return (
    <div className="w-72 shrink-0 border-l border-slate-800 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Client info</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Source</p>
          <PlatformBadge platform={client.source} />
        </div>
        <EditableField label="First name" value={client.first_name} field="first_name" clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Last name"  value={client.last_name}  field="last_name"  clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Phone"      value={client.phone}      field="phone"      clientId={client.id} onSaved={handleSaved} />
        <EditableField label="Email"      value={client.email}      field="email"      clientId={client.id} onSaved={handleSaved} />
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Sender ID</p>
          <p className="text-sm text-slate-400 font-mono break-all">{client.sender_id}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">First contact</p>
          <p className="text-sm text-slate-200">{timeAgo(client.created_at)}</p>
        </div>
      </div>
    </div>
  );
}