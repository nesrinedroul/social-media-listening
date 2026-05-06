import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fullName } from '../../utils/utils';
import type { UserStatus } from '../../types';

// ─── Change-password schema ───────────────────────────────────────────────────

const changePasswordSchema = z.object({
  old_password:  z.string().min(1, 'Current password is required'),
  new_password:  z.string().min(8, 'Min 8 characters'),
  new_password2: z.string(),
}).refine(d => d.new_password === d.new_password2, {
  message: 'Passwords do not match',
  path: ['new_password2'],
});
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ─── Status options ───────────────────────────────────────────────────────────

const statusOptions: { value: UserStatus; label: string; activeCls: string }[] = [
  { value: 'online',  label: 'Online',  activeCls: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
  { value: 'busy',    label: 'Busy',    activeCls: 'border-amber-500  text-amber-500  bg-amber-500/10'     },
  { value: 'offline', label: 'Offline', activeCls: 'border-theme      text-3          bg-active'           },
];

// ─── Password field with toggle ───────────────────────────────────────────────

function PasswordInput({
  label, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-2 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`w-full bg-input border ${error ? 'border-red-500' : 'border-theme'} rounded-lg px-3 py-2 pr-9 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors`}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-3 hover:text-2"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName,  setLastName]  = useState(user?.last_name  ?? '');
  const [saved,     setSaved]     = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const isAgent = user?.role === 'agent';

  // ── Name update ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () =>
      authApi.updateUser(user!.id, { first_name: firstName, last_name: lastName }),
    onSuccess: ({ data }) => {
      setUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // ── Status update — refetch full user so store is never partially corrupted ─
  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => authApi.updateStatus(status),
    onSuccess: async () => {
      try {
        const { data: fullUser } = await authApi.me();
        setUser(fullUser);
      } catch {
        // If the refetch fails we still have the old user in store — not critical
      }
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // ── Change password ────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset: resetPw,
    setError: setPwError,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const changePwMutation = useMutation({
    mutationFn: (d: ChangePasswordForm) =>
      authApi.changePassword(d.old_password, d.new_password, d.new_password2),
    onSuccess: () => {
      resetPw();
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: () => {
      setPwError('old_password', { message: 'Current password is incorrect' });
    },
  });

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
                <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                  Update settings
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Availability — agents only */}
        {isAgent && (
          <section className="bg-sidebar border border-theme rounded-xl p-5">
            <h2 className="text-sm font-semibold text-1 mb-3">Availability</h2>
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

        {/* Change password — all roles */}
        <section className="bg-sidebar border border-theme rounded-xl p-5">
          <h2 className="text-sm font-semibold text-1 mb-1">Change password</h2>
          <p className="text-xs text-3 mb-4">You will need your current password to update it.</p>
          <form onSubmit={handleSubmit(d => changePwMutation.mutate(d))} className="space-y-3">
            <PasswordInput
              label="Current password"
              placeholder="••••••••"
              error={pwErrors.old_password?.message}
              {...register('old_password')}
            />
            <PasswordInput
              label="New password"
              placeholder="••••••••"
              error={pwErrors.new_password?.message}
              {...register('new_password')}
            />
            <PasswordInput
              label="Confirm new password"
              placeholder="••••••••"
              error={pwErrors.new_password2?.message}
              {...register('new_password2')}
            />
            {pwSuccess && (
              <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
                Password changed successfully!
              </p>
            )}
            {changePwMutation.isError && !pwErrors.old_password && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                Failed to change password. Please try again.
              </p>
            )}
            <div className="flex justify-end pt-1">
              <Button size="sm" type="submit" loading={pwSubmitting || changePwMutation.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </section>

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