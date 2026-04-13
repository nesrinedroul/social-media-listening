// ─── Auth / User ────────────────────────────────────────────────────────────

export type Role = 'admin' | 'supervisor' | 'agent';
export type UserStatus = 'online' | 'busy' | 'offline';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  status: UserStatus;
  open_conversations: number;
  is_active: boolean;
  created_at: string;
}

export interface AgentListItem extends User {
  full_name: string;
  last_seen: string | null;
  is_active: boolean;
}

// ─── Auth tokens ────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string;
  refresh: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export type ClientSource = 'facebook' | 'instagram' | 'whatsapp';

export interface Client {
  id: string;
  sender_id: string;
  source: ClientSource;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ─── Channel ────────────────────────────────────────────────────────────────

export type Platform = 'facebook' | 'instagram' | 'whatsapp';

export interface Channel {
  id: string;
  platform: Platform;
  page_id: string;
  name: string;
  is_active: boolean;
}

// ─── Conversation ────────────────────────────────────────────────────────────

export type ConversationStatus = 'pending' | 'open' | 'resolved' | 'closed';

export interface Assignment {
  id: string;
  agent: User;
  assigned_by: 'system' | 'supervisor';
  assigned_at: string;
}

export interface Conversation {
  id: string;
  client: Client;
  agent: User | null;
  channel: Channel;
  status: ConversationStatus;
  mongo_conv_id: string;
  created_at: string;
  updated_at: string;
  assignments: Assignment[];
}

// ─── Message ─────────────────────────────────────────────────────────────────

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  external_id: string;
  sender_id: string;
  direction: MessageDirection;
  type: string;
  text: string;
  attachments: unknown[];
  timestamp: string | null;
  read_at: string | null;
}

// ─── WebSocket events ────────────────────────────────────────────────────────

export interface WsNewConversation {
  type: 'new_conversation';
  conversation_id: string;
  client_name: string;
  source: Platform;
  preview: string;
}

export interface WsNewMessage {
  type: 'new_message';
  conversation_id: string;
  message: Message;
}

export type WsEvent = WsNewConversation | WsNewMessage;
