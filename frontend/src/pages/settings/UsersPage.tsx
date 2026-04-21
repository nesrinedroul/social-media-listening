import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { fullName, timeAgo } from '../../utils/utils';
import type { Role, User } from '../../types';

// Schema for adding new user 
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

// Schema for editing user 
const editUserSchema = z.object({
  first_name: z.string().optional(),
  last_name:  z.string().optional(),
});
type EditUserFormData = z.infer<typeof editUserSchema>;

const roleBadge: Record<Role, string> = {
  admin:      'bg-brand-bg text-brand',
  supervisor: 'bg-active text-2',
  agent:      'bg-active text-3',
};

export function UsersPage() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => authApi.users(roleFilter || undefined).then(r => r.data),
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return fullName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => authApi.updateUser(id, { is_active: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeactivateUserId(null);
    },
  });

  // Add user form
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: 'agent' },
  });

  const createMutation = useMutation({
    mutationFn: (data: AddUserFormData) => authApi.register({
      ...data,
      first_name: data.first_name ?? '',
      last_name:  data.last_name  ?? '',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false);
      reset();
    },
  });

  // Edit user form
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue, formState: { isSubmitting: editSubmitting } } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserFormData }) => authApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      resetEdit();
    },
  });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setValue('first_name', user.first_name);
    setValue('last_name', user.last_name);
  };

  const handleEditSubmit = (data: EditUserFormData) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data });
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-input border border-theme rounded-lg pl-8 pr-3 py-1.5 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-input border border-theme rounded-lg px-2 py-1.5 text-sm text-2 outline-none focus:border-brand"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-(--border)">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-3 text-sm">Loading…</div>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(u)}
                  >
                    <Edit size={13} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeactivateUserId(u.id)}
                  >
                    Deactivate
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add user modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add new user">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="Jane" {...register('first_name')} />
            <Input label="Last name"  placeholder="Doe"  {...register('last_name')} />
          </div>
          <Input label="Email" type="email" placeholder="jane@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm password" type="password" placeholder="••••••••" error={errors.password2?.message} {...register('password2')} />
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

      {/* Edit user modal */}
      <Modal
        open={!!editingUser}
        onClose={() => { setEditingUser(null); resetEdit(); }}
        title="Edit user"
      >
        <form onSubmit={handleSubmitEdit(handleEditSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="Jane" {...registerEdit('first_name')} />
            <Input label="Last name"  placeholder="Doe"  {...registerEdit('last_name')} />
          </div>
          <Input
            label="Email"
            type="email"
            value={editingUser?.email ?? ''}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">Role</label>
            <input
              type="text"
              value={editingUser?.role ?? ''}
              disabled
              className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 opacity-60 cursor-not-allowed outline-none capitalize"
            />
            <p className="text-[10px] text-3 mt-0.5">Role cannot be changed after creation</p>
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

      {/* Deactivate confirmation modal */}
      <Modal
        open={!!deactivateUserId}
        onClose={() => setDeactivateUserId(null)}
        title="Deactivate User"
      >
        <p className="text-sm text-2 mb-6">
          Are you sure you want to deactivate this user? They will no longer be able to log in.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeactivateUserId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
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