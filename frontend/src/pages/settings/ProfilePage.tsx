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














// import { useState } from 'react';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { useAuthStore } from '../../store/authStore';
// import { authApi } from '../../api/services';
// import { Avatar } from '../../components/ui/Avatar';
// import { Button } from '../../components/ui/Button';
// import { Input } from '../../components/ui/Input';
// import { fullName } from '../../utils/utils';
// import type { UserStatus } from '../../types';

// const statusOptions: { value: UserStatus; label: string; cls: string }[] = [
//   { value: 'online',  label: 'Online',  cls: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
//   { value: 'busy',    label: 'Busy',    cls: 'border-amber-500  text-amber-400  bg-amber-500/10'  },
//   { value: 'offline', label: 'Offline', cls: 'border-slate-600  text-slate-400  bg-slate-800'     },
// ];

// export function ProfilePage() {
//   const { user, setUser } = useAuthStore();
//   const qc = useQueryClient();

//   const [firstName, setFirstName] = useState(user?.first_name ?? '');
//   const [lastName,  setLastName]  = useState(user?.last_name  ?? '');
//   const [saved, setSaved] = useState(false);

//   const updateMutation = useMutation({
//     mutationFn: () => authApi.updateUser(user!.id, { first_name: firstName, last_name: lastName }),
//     onSuccess: ({ data }) => {
//       setUser(data);
//       setSaved(true);
//       setTimeout(() => setSaved(false), 2000);
//     },
//   });

//   const statusMutation = useMutation({
//     mutationFn: (status: UserStatus) => authApi.updateStatus(status),
//     onSuccess: ({ data }) => {
//       setUser(data);
//       qc.invalidateQueries({ queryKey: ['agents'] });
//     },
//   });

//   if (!user) return null;

//   const name = fullName(user);

//   return (
//     <div className="h-full overflow-y-auto">
//       <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
//         {/* Profile header */}
//         <div className="flex items-center gap-4">
//           <Avatar name={name} size="lg" status={user.status} />
//           <div>
//             <h1 className="font-semibold text-slate-100">{name}</h1>
//             <p className="text-sm text-slate-400">{user.email}</p>
//             <span className="text-xs text-slate-500 capitalize">{user.role}</span>
//           </div>
//         </div>

//         {/* General info */}
//         <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
//           <h2 className="text-sm font-semibold text-slate-200">General settings</h2>
//           <div className="grid grid-cols-2 gap-3">
//             <Input
//               label="First name"
//               value={firstName}
//               onChange={e => setFirstName(e.target.value)}
//             />
//             <Input
//               label="Last name"
//               value={lastName}
//               onChange={e => setLastName(e.target.value)}
//             />
//           </div>
//           <Input label="Email" value={user.email} disabled className="opacity-50 cursor-not-allowed" />
//           <div className="flex items-center justify-between pt-1">
//             {saved && <p className="text-xs text-emerald-400">Changes saved!</p>}
//             <div className="ml-auto">
//               <Button
//                 size="sm"
//                 loading={updateMutation.isPending}
//                 onClick={() => updateMutation.mutate()}
//               >
//                 Update settings
//               </Button>
//             </div>
//           </div>
//         </section>

//         {/* Status */}
//         {user.role === 'agent' && (
//           <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
//             <h2 className="text-sm font-semibold text-slate-200 mb-3">Availability</h2>
//             <p className="text-xs text-slate-400 mb-4">
//               Your status is also automatically managed by your WebSocket connection.
//               Use this to manually override it.
//             </p>
//             <div className="flex gap-2">
//               {statusOptions.map(opt => (
//                 <button
//                   key={opt.value}
//                   onClick={() => statusMutation.mutate(opt.value)}
//                   disabled={statusMutation.isPending}
//                   className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
//                     user.status === opt.value
//                       ? opt.cls + ' border-opacity-100'
//                       : 'border-slate-700 text-slate-500 bg-slate-800 hover:border-slate-600'
//                   }`}
//                 >
//                   {opt.label}
//                 </button>
//               ))}
//             </div>
//           </section>
//         )}

//         {/* Account info */}
//         <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
//           <h2 className="text-sm font-semibold text-slate-200 mb-3">Account info</h2>
//           <div className="space-y-2 text-sm">
//             <div className="flex justify-between">
//               <span className="text-slate-400">Account ID</span>
//               <span className="text-slate-200 font-mono text-xs">{user.id}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-slate-400">Role</span>
//               <span className="text-slate-200 capitalize">{user.role}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-slate-400">Open conversations</span>
//               <span className="text-slate-200">{user.open_conversations}</span>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
