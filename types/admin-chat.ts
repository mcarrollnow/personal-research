import { ChatUser, ChatMessage, ChatConversation } from './chat'

// Admin User Types
export interface AdminUser {
  id: string
  admin_id: string
  name: string
  email: string
  role: 'support' | 'coordinator' | 'admin' | 'super_admin'
  department?: string
  phone?: string
  timezone: string
  active_status: boolean
  last_login?: string
  permissions: string[]
  created_at: string
}

// Message Types
export type MessageType = 'general' | 'safety' | 'dosing' | 'progress' | 'urgent'
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent'
export type ConversationStatus = 'active' | 'closed' | 'archived'

export interface AdminMessage extends ChatMessage {
  conversation_id: string
  from_user_id: string
  to_user_id: string
  message_type: MessageType
  priority: MessagePriority
  read_status: boolean
  attachments: MessageAttachment[]
  updated_at: string
}

export interface MessageAttachment {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

// Conversation Types
export interface AdminConversation extends ChatConversation {
  patient_id: string
  admin_id?: string
  last_message_at: string
  status: ConversationStatus
  created_at: string
}

export interface ConversationSummary {
  id: string
  patient_id: string
  patient_name: string
  admin_id?: string
  admin_name?: string
  last_message_at: string
  unread_count: number
  status: ConversationStatus
  last_message_preview: string
  priority: MessagePriority
}

// Message Template Types
export interface MessageTemplate {
  id: string
  admin_id: string
  title: string
  content: string
  category: string
  is_global: boolean
  usage_count: number
  created_at: string
}

export interface TemplateCategory {
  name: string
  templates: MessageTemplate[]
}

// Admin Chat State
export interface AdminChatState {
  currentAdmin: AdminUser
  conversations: AdminConversation[]
  activeConversation?: AdminConversation
  templates: MessageTemplate[]
  unreadCount: number
}

// API Response Types
export interface MessagingApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Filter and Search Types
export interface MessageFilters {
  patient_id?: string
  admin_id?: string
  message_type?: MessageType
  priority?: MessagePriority
  read_status?: boolean
  date_from?: string
  date_to?: string
  search_query?: string
}

export interface ConversationFilters {
  status?: ConversationStatus
  admin_id?: string
  patient_search?: string
  has_unread?: boolean
  priority?: MessagePriority
}

// Real-time Event Types
export interface RealtimeMessageEvent {
  type: 'message_received' | 'message_read' | 'conversation_updated'
  payload: AdminMessage | AdminConversation
  timestamp: string
}

// Patient Context for Admin View
export interface PatientContext {
  id: string
  name: string
  email: string
  peptide_type: string
  start_date: string
  current_week: number
  last_weight: number
  compliance_rate: number
  recent_side_effects: string[]
  status: 'active' | 'paused' | 'completed'
}
