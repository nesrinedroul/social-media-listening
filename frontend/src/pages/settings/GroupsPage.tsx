import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users, Plus, Edit2, Trash2, UserPlus, UserMinus,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { authApi } from '../../api/services';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { fullName } from '../../utils/utils';
import { useAuthStore } from '../../store/authStore';
import type { AgentGroup, GroupPlatform } from '../../types';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createGroupSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  platform: z.enum(['facebook', 'instagram', 'whatsapp', 'email', 'all']),
});
type CreateGroupForm = z.infer<typeof createGroupSchema>;

const editGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
type EditGroupForm = z.infer<typeof editGroupSchema>;

const PLATFORM_OPTIONS: { value: GroupPlatform; label: string }[] = [
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp',  label: 'WhatsApp'  },
  { value: 'email',     label: 'Email'     },
  { value: 'all',       label: 'All'       },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupCard({ group, isAdmin }: { group: AgentGroup; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Edit group form
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditGroupForm>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: { name: group.name },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditGroupForm) => authApi.updateGroup(group.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setEditOpen(false);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => authApi.updateGroup(group.id, { is_active: !group.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteGroup(group.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setDeleteOpen(false);
    },
  });

  const removeAgentMutation = useMutation({
    mutationFn: (agent_id: string) => authApi.removeAgentFromGroup(group.id, agent_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const addAgentMutation = useMutation({
    mutationFn: (agent_id: string) => authApi.addAgentToGroup(group.id, agent_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setAddAgentOpen(false);
      setSelectedAgent(null);
    },
  });

  // All agents (for add-agent dropdown)
  const { data: allAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => authApi.agents().then(r => r.data),
    enabled: addAgentOpen,
  });

  const groupAgentIds = new Set(group.agents.map(a => a.id));
  const availableAgents = allAgents.filter(a => !groupAgentIds.has(a.id));

  return (
    <>
      <div className="bg-sidebar border border-theme rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-1">{group.name}</p>
              {group.platform !== 'all'
                ? <PlatformBadge platform={group.platform} />
                : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-active text-2">
                    All platforms
                  </span>
                )
              }
              {group.is_active
                ? <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><CheckCircle size={9} /> Active</span>
                : <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full"><XCircle size={9} /> Inactive</span>
              }
            </div>
            <p className="text-xs text-3 mt-0.5">{group.agent_count} agent{group.agent_count !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => { reset({ name: group.name }); setEditOpen(true); }}
                  className="p-1.5 rounded-lg hover:bg-active text-3 hover:text-1 transition-colors"
                  title="Edit group"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => toggleActiveMutation.mutate()}
                  disabled={toggleActiveMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-active text-3 hover:text-1 transition-colors"
                  title={group.is_active ? 'Deactivate' : 'Activate'}
                >
                  {group.is_active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-active text-red-500 hover:text-red-400 transition-colors"
                  title="Delete group"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => setAddAgentOpen(true)}
              className="p-1.5 rounded-lg hover:bg-active text-3 hover:text-brand transition-colors"
              title="Add agent"
            >
              <UserPlus size={13} />
            </button>
            <button
              onClick={() => setExpanded(o => !o)}
              className="p-1.5 rounded-lg hover:bg-active text-3 hover:text-1 transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Expanded agent list */}
        {expanded && (
          <div className="border-t border-theme divide-y divide-(--border)">
            {group.agents.length === 0 && (
              <p className="px-4 py-3 text-xs text-3 italic">No agents in this group yet.</p>
            )}
            {group.agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={fullName(agent)} size="sm" status={agent.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-1 truncate">{fullName(agent)}</p>
                  <p className="text-xs text-3 truncate">{agent.email}</p>
                </div>
                <button
                  onClick={() => removeAgentMutation.mutate(agent.id)}
                  disabled={removeAgentMutation.isPending}
                  className="p-1 rounded text-3 hover:text-red-400 transition-colors"
                  title="Remove from group"
                >
                  <UserMinus size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit group">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <Input label="Group name" placeholder="Support team…" error={errors.name?.message} {...register('name')} />
          {updateMutation.isError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              Failed to update. Please try again.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={isSubmitting || updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete group">
        <p className="text-sm text-2 mb-6">
          Are you sure you want to permanently delete <strong className="text-1">{group.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Add agent modal */}
      <Modal open={addAgentOpen} onClose={() => { setAddAgentOpen(false); setSelectedAgent(null); }} title="Add agent to group">
        <p className="text-xs text-2 mb-4">Select an agent to add to <strong className="text-1">{group.name}</strong>.</p>
        {availableAgents.length === 0 ? (
          <p className="text-sm text-3 text-center py-6">All agents are already in this group.</p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto mb-4">
            {availableAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-brand-bg border border-brand'
                    : 'hover:bg-active border border-transparent'
                }`}
              >
                <Avatar name={agent.full_name || agent.email} size="sm" status={agent.status ?? 'offline'} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-1 truncate">{agent.full_name || agent.email}</p>
                  <p className="text-xs text-3">{agent.open_conversations} open conversations</p>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setAddAgentOpen(false); setSelectedAgent(null); }}>Cancel</Button>
          <Button
            size="sm"
            disabled={!selectedAgent || availableAgents.length === 0}
            loading={addAgentMutation.isPending}
            onClick={() => selectedAgent && addAgentMutation.mutate(selectedAgent)}
          >
            Add agent
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function GroupsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const [createOpen, setCreateOpen] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => authApi.groups().then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { platform: 'all' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateGroupForm) => authApi.createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setCreateOpen(false);
      reset();
    },
  });

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="px-5 py-3 border-b border-theme flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-1">Agent Groups</h1>
          <p className="text-xs text-3 mt-0.5">Assign agents to platform channels</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> New group
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-3 text-sm">Loading…</div>
        )}

        {!isLoading && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-3 gap-3">
            <Users size={32} />
            <p className="text-sm">No groups created yet</p>
            {isAdmin && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={13} /> Create first group
              </Button>
            )}
          </div>
        )}

        <div className="space-y-3 max-w-2xl">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} isAdmin={isAdmin} />
          ))}
        </div>
      </div>

      {/* Create group modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Create agent group">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <Input
            label="Group name"
            placeholder="e.g. Facebook Support"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-2 uppercase tracking-wide">Platform</label>
            <select
              className="bg-input border border-theme rounded-lg px-3 py-2 text-sm text-1 outline-none focus:border-brand"
              {...register('platform')}
            >
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-3 mt-0.5">Each platform can only have one active group.</p>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              Failed to create group. A group for this platform may already exist.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => { setCreateOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isSubmitting || createMutation.isPending}>
              Create group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
