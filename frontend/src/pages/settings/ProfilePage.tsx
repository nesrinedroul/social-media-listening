import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fullName } from '../../utils/utils';
import type { UserStatus } from '../../types';

const statusOptions: { value: UserStatus; label: string; activeCls: string }[] = [
  {
    value: 'online',
    label: 'Online',
    activeCls: 'border-emerald-500 text-emerald-500 bg-emerald-500/10',
  },
  {
    value: 'busy',
    label: 'Busy',
    activeCls: 'border-amber-500 text-amber-500 bg-amber-500/10',
  },
  {
    value: 'offline',
    label: 'Offline',
    activeCls: 'border-gray-400 text-gray-400 bg-gray-400/10',
  },
];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [saved, setSaved] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  const updateMutation = useMutation({
    mutationFn: () =>
      authApi.updateUser(user!.id, { first_name: firstName, last_name: lastName }),
    onSuccess: ({ data }) => {
      setUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => authApi.updateStatus(status),
    onSuccess: ({ data }) => {
      setUser(data);
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  if (!user) return null;

  const name = fullName(user);

  return (
    <div className="h-full overflow-y-auto bg-page">
      <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" status={user.status} key={user.status} />
          <div>
            <h1 className="font-semibold text-1">{name}</h1>
            <p className="text-sm text-2">{user.email}</p>
            <span className="text-xs text-3 capitalize">{user.role}</span>
          </div>
        </div>

        {/* General info */}
        <section className="bg-sidebar border border-theme rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-1">General settings</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isAdmin}
              className={!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isAdmin}
              className={!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}
            />
          </div>
          <Input
            label="Email"
            value={user.email}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          {isAdmin && (
            <div className="flex items-center justify-between pt-1">
              {saved && <p className="text-xs text-emerald-500">Changes saved!</p>}
              <div className="ml-auto">
                <Button
                  size="sm"
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  Update settings
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Status */}
        {isAgent && (
          <section className="bg-sidebar border border-theme rounded-xl p-5">
            <h2 className="text-sm font-semibold text-1 mb-3">Availability</h2>
            <p className="text-xs text-2 mb-4">
              Your status is automatically managed by your WebSocket connection. Use this to
              manually override it.
            </p>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => statusMutation.mutate(opt.value)}
                  disabled={statusMutation.isPending}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    user.status === opt.value
                      ? opt.activeCls
                      : 'border-active text-3 bg-active hover:border-brand hover:text-1'
                  }`}
                >
                  {statusMutation.isPending && statusMutation.variables === opt.value
                    ? '...'
                    : opt.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Account info */}
        <section className="bg-sidebar border border-theme rounded-xl p-5">
          <h2 className="text-sm font-semibold text-1 mb-3">Account info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-2">Account ID</span>
              <span className="text-1 font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-2">Role</span>
              <span className="text-1 capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-2">Open conversations</span>
              <span className="text-1">{user.open_conversations}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}