import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Edit, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { fullName, timeAgo } from '../../utils/utils';
import type { Role, User} from '../../types';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const addUserSchema = z.object({
  email:      z.string().email(),
  password:   z.string().min(8, 'Min 8 characters'),
  password2:  z.string(),
  first_name: z.string().optional(),
  last_name:  z.string().optional(),
  role:       z.enum(['admin', 'supervisor', 'agent']),
}).refine(d => d.password === d.password2, {
  message: 'Passwords do not match', path: ['password2'],
});
type AddUserFormData = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
  first_name: z.string().optional(),
  last_name:  z.string().optional(),
  email:      z.string().email('Invalid email'),
  role:       z.enum(['admin', 'supervisor', 'agent']),
  status:     z.enum(['online', 'busy', 'offline']),
});
type EditUserFormData = z.infer<typeof editUserSchema>;

const resetPasswordSchema = z.object({
  new_password:  z.string().min(8, 'Min 8 characters'),
  new_password2: z.string(),
}).refine(d => d.new_password === d.new_password2, {
  message: 'Passwords do not match', path: ['new_password2'],
});
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Badge helpers ────────────────────────────────────────────────────────────

const roleBadge: Record<Role, string> = {
  admin:      'bg-brand-bg text-brand',
  supervisor: 'bg-active text-2',
  agent:      'bg-active text-3',
};

// ─── Shared select class ──────────────────────────────────────────────────────

const selectCls =
  'bg-input border border-theme rounded-lg px-2 py-1.5 text-sm text-2 outline-none focus:border-brand';

// ─── UsersPage ────────────────────────────────────────────────────────────────

export function UsersPage() {
  const qc = useQueryClient();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [roleFilter,   setRoleFilter]   = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');   // '' | 'online' | 'busy' | 'offline'
  const [activeFilter, setActiveFilter] = useState<string>('');   // '' | 'true' | 'false'
  const [search,       setSearch]       = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [addOpen,          setAddOpen]          = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [editingUser,      setEditingUser]      = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetSuccess,     setResetSuccess]     = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => authApi.users(roleFilter || undefined).then(r => r.data),
  });

  // Client-side filtering (role filter is done server-side; status + active + search here)
  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      if (!fullName(u).toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && u.status !== statusFilter) return false;
    if (activeFilter !== '') {
      const wantActive = activeFilter === 'true';
      if (u.is_active !== wantActive) return false;
    }
    return true;
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => authApi.updateUser(id, { is_active: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeactivateUserId(null); },
  });

  const createMutation = useMutation({
    mutationFn: (data: AddUserFormData) => authApi.register({
      ...data,
      first_name: data.first_name ?? '',
      last_name:  data.last_name  ?? '',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setAddOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserFormData }) =>
      authApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      resetEdit();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      authApi.resetPassword(id, password),
    onSuccess: () => {
      setResetSuccess(true);
      resetPwForm();
      setTimeout(() => {
        setResetPasswordUser(null);
        setResetSuccess(false);
      }, 1800);
    },
  });

  // ── Add-user form ─────────────────────────────────────────────────────────
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'agent' },
  });

  // ── Edit-user form ────────────────────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<EditUserFormData>({ resolver: zodResolver(editUserSchema) });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditValue('first_name', user.first_name);
    setEditValue('last_name',  user.last_name);
    setEditValue('email',      user.email);
    setEditValue('role',       user.role);
    setEditValue('status',     user.status);
  };

  const handleEditSubmit = (data: EditUserFormData) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data });
  };

  // ── Reset password form ───────────────────────────────────────────────────
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetPwForm,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const handleResetPassword = (data: ResetPasswordFormData) => {
    if (!resetPasswordUser) return;
    resetPasswordMutation.mutate({ id: resetPasswordUser.id, password: data.new_password });
  };

  return (
    <div className="flex flex-col h-full bg-page">

      {/* Header */}
      <div className="px-5 py-3 border-b border-theme">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-1">Users</h1>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus size={13} /> Add user
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-36">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-input border border-theme rounded-lg pl-8 pr-3 py-1.5 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Role */}
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="agent">Agent</option>
          </select>

          {/* Status — client-side */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All statuses</option>
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>

          {/* Active — client-side */}
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className={selectCls}>
            <option value="">All users</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto divide-y divide-(--border)">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">
            No users match the current filters.
          </div>
        )}

        {filtered.map(u => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
            <Avatar name={fullName(u)} size="md" status={u.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-1 truncate">{fullName(u)}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                  {u.role}
                </span>
                {!u.is_active && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-3 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-3">Joined {timeAgo(u.created_at)}</span>
              {u.is_active && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(u)} title="Edit user">
                    <Edit size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setResetPasswordUser(u)} title="Reset password">
                    <KeyRound size={13} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeactivateUserId(u.id)}>
                    Deactivate
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Add user modal ──────────────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add new user">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="Jane" {...register('first_name')} />
            <Input label="Last name"  placeholder="Doe"  {...register('last_name')} />
          </div>
          <Input
            label="Email" type="email" placeholder="jane@company.com"
            error={errors.email?.message} {...register('email')}
          />
          <Input
            label="Password" type="password" placeholder="••••••••"
            error={errors.password?.message} {...register('password')}
          />
          <Input
            label="Confirm password" type="password" placeholder="••••••••"
            error={errors.password2?.message} {...register('password2')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">Role</label>
            <select
              className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand"
              {...register('role')}
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              Failed to create user. Check inputs and try again.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" type="button" onClick={() => { setAddOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isSubmitting || createMutation.isPending}>
              Create user
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit user modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!editingUser}
        onClose={() => { setEditingUser(null); resetEdit(); }}
        title="Edit user"
      >
        <form onSubmit={handleSubmitEdit(handleEditSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name" placeholder="Jane"
              error={editErrors.first_name?.message}
              {...registerEdit('first_name')}
            />
            <Input
              label="Last name" placeholder="Doe"
              error={editErrors.last_name?.message}
              {...registerEdit('last_name')}
            />
          </div>
          <Input
            label="Email" type="email"
            error={editErrors.email?.message}
            {...registerEdit('email')}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-2 uppercase tracking-wide">Role</label>
              <select
                className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand"
                {...registerEdit('role')}
              >
                <option value="agent">Agent</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
              {editErrors.role && <p className="text-xs text-red-500">{editErrors.role.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-2 uppercase tracking-wide">Status</label>
              <select
                className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand"
                {...registerEdit('status')}
              >
                <option value="online">Online</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          {updateMutation.isError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              Failed to update user. Please try again.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" type="button" onClick={() => { setEditingUser(null); resetEdit(); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={editSubmitting || updateMutation.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Reset password modal ────────────────────────────────────────────── */}
      <Modal
        open={!!resetPasswordUser}
        onClose={() => { setResetPasswordUser(null); resetPwForm(); setResetSuccess(false); }}
        title="Reset password"
      >
        {resetPasswordUser && (
          <>
            <p className="text-xs text-2 mb-4">
              Setting a new password for{' '}
              <span className="font-semibold text-1">{fullName(resetPasswordUser)}</span>.
              They will need to use this new password on their next login.
            </p>
            <form onSubmit={handleSubmitReset(handleResetPassword)} className="space-y-3">
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                error={resetErrors.new_password?.message}
                {...registerReset('new_password')}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                error={resetErrors.new_password2?.message}
                {...registerReset('new_password2')}
              />
              {resetPasswordMutation.isError && (
                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  Failed to reset password. Please try again.
                </p>
              )}
              {resetSuccess && (
                <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
                  Password reset successfully!
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="secondary" size="sm" type="button"
                  onClick={() => { setResetPasswordUser(null); resetPwForm(); setResetSuccess(false); }}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" loading={resetSubmitting || resetPasswordMutation.isPending}>
                  Reset password
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* ── Deactivate confirmation modal ───────────────────────────────────── */}
      <Modal
        open={!!deactivateUserId}
        onClose={() => setDeactivateUserId(null)}
        title="Deactivate user"
      >
        <p className="text-sm text-2 mb-6">
          Are you sure you want to deactivate this user? They will no longer be able to log in.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeactivateUserId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger" size="sm"
            loading={deactivateMutation.isPending}
            onClick={() => deactivateUserId && deactivateMutation.mutate(deactivateUserId)}
          >
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}