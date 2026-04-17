import { api } from './client';
import type {
  TokenPair, User, AgentListItem,
  Client, Conversation, Message, ConversationStatus,
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
    api.get<Conversation[]>('/api/conversations/', { params: status ? { status } : {} }),

  get: (id: string) =>
    api.get<Conversation>(`/api/conversations/${id}/`),

  messages: (id: string) =>
    api.get<Message[]>(`/api/conversations/${id}/messages/`),

  resolve: (id: string) =>
    api.post(`/api/conversations/${id}/resolve/`),
  simulate: (data?: {
  sender_id?: string;
  source?: 'facebook' | 'instagram' | 'whatsapp';
  page_id?: string;
  text?: string;
  first_name?: string;
  last_name?: string;
}) =>
  api.post('/api/conversations/simulate/', data ?? {}),
  
  reassign: (id: string, agent_id: string) =>
    api.post(`/api/conversations/${id}/reassign/`, { agent_id }),
};
