import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fullName } from '../../utils/utils';
import type { UserStatus } from '../../types';

const statusOptions: { value: UserStatus; label: string; dotCls: string; borderColor: string; textColor: string }[] = [
  { value: 'online',  label: 'Online',  dotCls: 'bg-emerald-500', borderColor: '#22c55e', textColor: '#4ade80' },
  { value: 'busy',    label: 'Busy',    dotCls: 'bg-amber-500',   borderColor: '#f59e0b', textColor: '#fbbf24' },
  { value: 'offline', label: 'Offline', dotCls: 'bg-gray-500',    borderColor: 'var(--border)', textColor: 'var(--text-2)' },
];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName,  setLastName]  = useState(user?.last_name  ?? '');
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateUser(user!.id, { first_name: firstName, last_name: lastName }),
    onSuccess: ({ data }) => {
      setUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => authApi.updateStatus(status),
    onSuccess: ({ data }) => { setUser(data); qc.invalidateQueries({ queryKey: ['agents'] }); },
  });

  if (!user) return null;
  const name = fullName(user);

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--page)' }}>
      <div className="max-w-xl mx-auto px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" status={user.status} />
          <div>
            <h1 className="font-semibold text-1">{name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{user.email}</p>
            <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{user.role}</span>
          </div>
        </div>

        {/* General info */}
        <section className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-1">General settings</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <Input label="Last name"  placeholder="Doe"  value={lastName}  onChange={e => setLastName(e.target.value)} />
          </div>
          <Input label="Email" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <div className="flex items-center justify-between pt-1">
            {saved && <p className="text-xs text-emerald-400">Changes saved!</p>}
            <div className="ml-auto">
              <Button size="sm" loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
                style={{ background: 'var(--brand)', color: '#fff' }}>
                Update settings
              </Button>
            </div>
          </div>
        </section>

        {/* Status */}
        {user.role === 'agent' && (
          <section className="rounded-xl p-5"
            style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold text-1 mb-3">Availability</h2>
            <div className="flex gap-2">
              {statusOptions.map(opt => {
                const isActive = user.status === opt.value;
                return (
                  <button key={opt.value} onClick={() => statusMutation.mutate(opt.value)}
                    disabled={statusMutation.isPending}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      border: `1px solid ${isActive ? opt.borderColor : 'var(--border)'}`,
                      color: isActive ? opt.textColor : 'var(--text-2)',
                      background: isActive ? `${opt.borderColor}15` : 'transparent',
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Account info */}
        <section className="rounded-xl p-5"
          style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-1 mb-3">Account info</h2>
          {[
            { label: 'Account ID', value: user.id, mono: true },
            { label: 'Role',       value: user.role },
            { label: 'Open conversations', value: String(user.open_conversations) },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between py-2.5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
              <span className={`text-sm text-1 ${mono ? 'font-mono text-xs' : 'capitalize'}`}>{value}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
