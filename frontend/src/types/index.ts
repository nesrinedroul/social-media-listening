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

export type ClientSource = 'facebook' | 'instagram' | 'whatsapp' | 'email';

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

export type Platform = 'facebook' | 'instagram' | 'whatsapp' | 'email';
export type GroupPlatform = Platform | 'all';

export interface Channel {
  id: string;
  platform: Platform;
  page_id: string;
  name: string;
  is_active: boolean;
}

// ─── Agent Group ─────────────────────────────────────────────────────────────

export interface AgentGroup {
  id: string;
  name: string;
  platform: GroupPlatform;
  agents: User[];
  agent_count: number;
  is_active: boolean;
  created_at: string;
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

// ─── Analytics (matches backend response exactly) ───────────────────────────

export interface AnalyticsOverview {
  conversations: {
    total: number;
    open: number;
    pending: number;
    resolved: number;
    closed: number;
  };
  clients: {
    total: number;
    new_today: number;
    by_source: { source: string; count: number }[];
  };
  agents: {
    total: number;
    online: number;
    busy: number;
    offline: number;
  };
  today: {
    new_conversations: number;
    resolved_today: number;
  };
}

export interface TrendPoint {
  period: string;          // e.g., "2026-05-05"
  total: number;
  open: number;
  pending: number;
  resolved: number;
}

export interface PlatformStat {
  channel__platform: string;
  total: number;
  open: number;
  resolved: number;
}

export interface AgentPerformanceStat {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  total_handled: number;
  resolved: number;
  open: number;
  resolution_rate: number;
  current_status: string;
  open_conversations: number;
}

export interface AnalyticsStats {
  overview: AnalyticsOverview;
  trends: TrendPoint[];
  platform_breakdown: PlatformStat[];
  agent_performance: AgentPerformanceStat[];
}

export interface ExportParams {
  date_from?: string;
  date_to?: string;
  status?: ConversationStatus;
  platform?: Platform;
  agent_id?: string;
  format?: 'xlsx' | 'pdf';
}