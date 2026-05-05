import { api } from './client';
import type {
  TokenPair, User, AgentListItem,
  Client, Conversation, Message, ConversationStatus,
  AgentGroup, GroupPlatform, AnalyticsStats, ExportParams,
} from '../types';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenPair>('/api/auth/login/', { email, password }),

  logout: (refresh: string) =>
    api.post('/api/auth/logout/', { refresh }),

  me: () =>
    api.get<User>('/api/auth/me/'),

  updateStatus: (status: string) =>
    api.patch<User>('/api/auth/me/status/', { status }),

  register: (data: {
    email: string; password: string; password2: string;
    first_name: string; last_name: string; role: string;
  }) => api.post<User>('/api/auth/register/', data),

  users: (role?: string) =>
    api.get<User[]>('/api/auth/users/', { params: role ? { role } : {} }),

  user: (id: string) =>
    api.get<User>(`/api/auth/users/${id}/`),

  updateUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/api/auth/users/${id}/`, data),

  agents: () =>
    api.get<AgentListItem[]>('/api/auth/agents/'),

  resetPassword: (id: string, password: string) =>
    api.post(`/api/auth/users/${id}/reset-password/`, { password }),   // FIXED: backend expects { password }

  changePassword: (old_password: string, new_password: string, new_password2: string) =>
    api.post('/api/auth/password/change/', { old_password, new_password, new_password2 }),

  // ─── Groups ────────────────────────────────────────────────────────────────

  groups: () =>
    api.get<AgentGroup[]>('/api/auth/groups/'),

  group: (id: string) =>
    api.get<AgentGroup>(`/api/auth/groups/${id}/`),

  createGroup: (data: { name: string; platform: GroupPlatform }) =>
    api.post<AgentGroup>('/api/auth/groups/', data),

  updateGroup: (id: string, data: Partial<Pick<AgentGroup, 'name' | 'is_active'>>) =>
    api.patch<AgentGroup>(`/api/auth/groups/${id}/`, data),

  deleteGroup: (id: string) =>
    api.delete(`/api/auth/groups/${id}/`),

  addAgentToGroup: (groupId: string, agent_id: string) =>
    api.post<AgentGroup>(`/api/auth/groups/${groupId}/add-agent/`, { agent_id }),

  removeAgentFromGroup: (groupId: string, agent_id: string) =>
    api.post<AgentGroup>(`/api/auth/groups/${groupId}/remove-agent/`, { agent_id }),

  groupByPlatform: (platform: GroupPlatform) =>
    api.get<AgentGroup>(`/api/auth/groups/platform/${platform}/`),
};

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsApi = {
  list: (search?: string) =>
    api.get<Client[]>('/api/clients/', { params: search ? { search } : {} }),

  get: (id: string) =>
    api.get<Client>(`/api/clients/${id}/`),

  update: (id: string, data: Partial<Client>) =>
    api.patch<Client>(`/api/clients/${id}/`, data),
};

// ─── Conversations ───────────────────────────────────────────────────────────

export const conversationsApi = {
  list: (status?: ConversationStatus) =>
    api.get<Conversation[]>('/api/conversations/', {
      params: status ? { status } : {},
    }),

  get: (id: string) =>
    api.get<Conversation>(`/api/conversations/${id}/`),

  messages: (id: string) =>
    api.get<Message[]>(`/api/conversations/${id}/messages/`),

  resolve: (id: string) =>
    api.post(`/api/conversations/${id}/resolve/`),

  reassign: (id: string, agent_id: string) =>
    api.post(`/api/conversations/${id}/reassign/`, { agent_id }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  stats: (params?: { date_from?: string; date_to?: string }) =>
    api.get<AnalyticsStats>('/api/analytics/stats/', { params }),

  exportConversations: (params?: ExportParams) =>
    api.get('/api/analytics/export/conversations/', { params, responseType: 'blob' }),

  exportAgents: (params?: Pick<ExportParams, 'date_from' | 'date_to' | 'format'>) =>
    api.get('/api/analytics/export/agents/', { params, responseType: 'blob' }),

  exportClients: (params?: Pick<ExportParams, 'date_from' | 'date_to' | 'format'>) =>
    api.get('/api/analytics/export/clients/', { params, responseType: 'blob' }),

  exportFull: (params?: Pick<ExportParams, 'date_from' | 'date_to' | 'format'>) =>
    api.get('/api/analytics/export/full/', { params, responseType: 'blob' }),
};
