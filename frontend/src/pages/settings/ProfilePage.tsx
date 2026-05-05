import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fullName } from '../../utils/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserStatus } from '../../types';

const statusOptions: { value: UserStatus; label: string; activeCls: string }[] = [
  { value: 'online',  label: 'Online',  activeCls: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
  { value: 'busy',    label: 'Busy',    activeCls: 'border-amber-500  text-amber-500  bg-amber-500/10'     },
  { value: 'offline', label: 'Offline', activeCls: 'border-theme      text-3          bg-active'           },
];

const changePasswordSchema = z.object({
  old_password:  z.string().min(1, 'Current password is required'),
  new_password:  z.string().min(8, 'Minimum 8 characters'),
  new_password2: z.string().min(1, 'Please confirm your new password'),
}).refine(d => d.new_password === d.new_password2, {
  message: 'Passwords do not match',
  path: ['new_password2'],
});
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName,  setLastName]  = useState(user?.last_name  ?? '');
  const [saved, setSaved] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwApiError, setPwApiError] = useState('');

  const isAgent = user?.role === 'agent';

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
    onSuccess: ({ data }) => {
      setUser(data);
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetPwForm,
    formState: { errors, isSubmitting: pwSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    setPwApiError('');
    setPwSuccess(false);
    try {
      await authApi.changePassword(data.old_password, data.new_password, data.new_password2);
      setPwSuccess(true);
      resetPwForm();
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwApiError('Current password is incorrect or request failed.');
    }
  };

  if (!user) return null;

  const name = fullName(user);

  return (
    <div className="h-full overflow-y-auto bg-page">
      <div className="max-w-xl mx-auto px-5 py-8 space-y-6">

        {/* Profile header */}
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" status={user.status} />
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
              value={isAgent ? user.first_name : firstName}
              onChange={e => !isAgent && setFirstName(e.target.value)}
              disabled={isAgent}
              className={isAgent ? 'opacity-50 cursor-not-allowed' : ''}
            />
            <Input
              label="Last name"
              value={isAgent ? user.last_name : lastName}
              onChange={e => !isAgent && setLastName(e.target.value)}
              disabled={isAgent}
              className={isAgent ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </div>
          <Input label="Email" value={user.email} disabled className="opacity-50 cursor-not-allowed" />
          {!isAgent && (
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

        {/* Change password — all roles */}
        <section className="bg-sidebar border border-theme rounded-xl p-5">
          <h2 className="text-sm font-semibold text-1 mb-1">Change password</h2>
          <p className="text-xs text-2 mb-4">
            Enter your current password to set a new one.
          </p>
          <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-3">
            <Input
              label="Current password"
              type="password"
              placeholder="••••••••"
              error={errors.old_password?.message}
              {...register('old_password')}
            />
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              error={errors.new_password?.message}
              {...register('new_password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              error={errors.new_password2?.message}
              {...register('new_password2')}
            />
            {pwApiError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {pwApiError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                Password changed successfully!
              </p>
            )}
            <div className="flex justify-end pt-1">
              <Button size="sm" type="submit" loading={pwSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </section>

        {/* Status — agents only */}
        {isAgent && (
          <section className="bg-sidebar border border-theme rounded-xl p-5">
            <h2 className="text-sm font-semibold text-1 mb-1">Availability</h2>
            <p className="text-xs text-2 mb-4">
              Your status is automatically managed by your WebSocket connection.
              Use this to manually override it.
            </p>
            <div className="flex gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => statusMutation.mutate(opt.value)}
                  disabled={statusMutation.isPending}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    user.status === opt.value
                      ? opt.activeCls
                      : 'border-theme text-3 bg-active hover:border-brand hover:text-1'
                  }`}
                >
                  {opt.label}
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