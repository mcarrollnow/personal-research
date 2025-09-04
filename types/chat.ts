export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline?: boolean;
  role?: 'patient' | 'admin' | 'support' | 'coordinator' | 'super_admin';
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  isFromCurrentUser: boolean;
  messageType?: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ChatConversation {
  id: string;
  participants: ChatUser[];
  lastMessage: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
  status?: 'active' | 'closed' | 'archived';
}

export type ChatState = "collapsed" | "expanded" | "conversation";

export interface ChatData {
  currentUser: ChatUser;
  conversations: ChatConversation[];
}

// Extended types for admin messaging compatibility
export interface AdminChatUser extends ChatUser {
  role: 'admin' | 'support' | 'coordinator' | 'super_admin';
  department?: string;
  permissions: string[];
}

export interface PatientChatUser extends ChatUser {
  role: 'patient';
  patientId: string;
  peptideType?: string;
  currentWeek?: number;
}
