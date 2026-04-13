import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { fullName, timeAgo } from '../../utils/utils';
import type { Role } from '../../types';

const schema = z.object({
  email:      z.string().email(),
  password:   z.string().min(8, 'Min 8 characters'),
  password2:  z.string(),
  first_name: z.string().optional(),
  last_name:  z.string().optional(),
  role:       z.enum(['admin', 'supervisor', 'agent']),
}).refine(d => d.password === d.password2, {
  message: 'Passwords do not match', path: ['password2'],
});
type FormData = z.infer<typeof schema>;

const roleBadge: Record<Role, string> = {
  admin:      'bg-purple-500/15 text-purple-400',
  supervisor: 'bg-blue-500/15 text-blue-400',
  agent:      'bg-slate-700 text-slate-300',
};

export function UsersPage() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'agent' },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => authApi.register({
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-slate-100">Users</h1>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus size={13} /> Add user
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-300 outline-none"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">Loading…</div>
        )}
        {filtered.map(u => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
            <Avatar name={fullName(u)} size="md" status={u.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-slate-200 truncate">{fullName(u)}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                  {u.role}
                </span>
                {!u.is_active && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500">Joined {timeAgo(u.created_at)}</span>
              {u.is_active && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deactivateMutation.mutate(u.id)}
                  loading={deactivateMutation.isPending}
                >
                  Deactivate
                </Button>
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
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Role</label>
            <select
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              {...register('role')}
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
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
    </div>
  );
}
