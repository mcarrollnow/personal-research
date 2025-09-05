import { messagingService } from './messaging-service'
import { supabase } from './supabase'
import type { 
  ChatData, 
  ChatConversation, 
  ChatMessage, 
  ChatUser,
  PatientChatUser,
  AdminChatUser 
} from '@/types/chat'
import type { 
  AdminMessage, 
  AdminConversation, 
  ConversationSummary 
} from '@/types/admin-chat'

class ChatService {
  private realtimeSubscription: any = null
  private currentUserId: string | null = null
  private currentUserRole: 'admin' | 'patient' = 'patient'

  // Check if Supabase is properly configured
  private checkSupabaseConfig(): { isConfigured: boolean; error?: string } {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      return {
        isConfigured: false,
        error: 'Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local'
      }
    }

    if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
      return {
        isConfigured: false,
        error: 'Supabase Anon Key not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      }
    }

    return { isConfigured: true }
  }

  // Initialize chat service with current user context
  async initialize(userId: string, role: 'admin' | 'patient' = 'patient') {
    this.currentUserId = userId
    this.currentUserRole = role
    
    // Check Supabase configuration
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      throw new Error(`Configuration Error: ${configCheck.error}`)
    }
    
    // Clean up existing subscriptions
    this.cleanup()
  }

  // Transform Supabase conversation data to ChatConversation format
  private transformToConversation(
    conv: ConversationSummary, 
    messages: AdminMessage[] = []
  ): ChatConversation {
    // Create participant users
    const participants: ChatUser[] = []
    
    // Add patient user
    const patientUser: PatientChatUser = {
      id: conv.patient_id,
      name: conv.patient_name || `Patient ${conv.patient_id.slice(-4)}`,
      username: `@${conv.patient_id.slice(-8)}`,
      avatar: `/avatars/user_${['joyboy', 'krimson', 'mati', 'pek'][conv.patient_id.charCodeAt(0) % 4]}.png`,
      isOnline: true,
      role: 'patient',
      patientId: conv.patient_id
    }
    participants.push(patientUser)

    // Add admin user if assigned
    if (conv.admin_id && conv.admin_name) {
      const adminUser: AdminChatUser = {
        id: conv.admin_id,
        name: conv.admin_name,
        username: `@${conv.admin_name.toLowerCase().replace(' ', '')}`,
        avatar: `/avatars/user_${['joyboy', 'krimson', 'mati'][conv.admin_id?.charCodeAt(0) % 3 || 0]}.png`,
        isOnline: true,
        role: 'admin',
        department: 'Clinical Support',
        permissions: ['message', 'view_patients']
      }
      participants.push(adminUser)
    }

    // Transform messages
    const transformedMessages = messages.map(msg => this.transformToMessage(msg))
    
    // Get last message
    const lastMessage = transformedMessages.length > 0 
      ? transformedMessages[transformedMessages.length - 1]
      : {
          id: 'placeholder',
          content: conv.last_message_preview || 'No messages yet',
          timestamp: conv.last_message_at,
          senderId: conv.patient_id,
          isFromCurrentUser: false
        }

    return {
      id: conv.id,
      participants,
      lastMessage,
      unreadCount: conv.unread_count,
      messages: transformedMessages,
      status: conv.status
    }
  }

  // Transform Supabase message to ChatMessage format
  private transformToMessage(msg: any): ChatMessage {
    return {
      id: msg.id,
      content: msg.content,
      timestamp: msg.created_at || msg.timestamp || new Date().toISOString(), // Use created_at from Supabase
      senderId: msg.from_user_id,
      isFromCurrentUser: msg.from_user_id === this.currentUserId,
      messageType: msg.message_type,
      priority: msg.priority
    }
  }

  // Get all conversations for current user
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const filters = this.currentUserRole === 'admin' 
        ? {} // Admin sees all conversations
        : { patient_search: this.currentUserId || undefined } // Use patient_search filter

      const response = await messagingService.getConversations(filters)
      
      if (!response.success || !response.data) {
        console.error('Failed to fetch conversations:', response.error)
        return this.getMockConversations() // Return mock data as fallback
      }

      // Transform each conversation
      const conversations = await Promise.all(
        response.data.data.map(async (conv) => {
          // Fetch recent messages for each conversation
          const messagesResponse = await messagingService.getMessages(conv.id, 1, 20)
          const messages = messagesResponse.success ? messagesResponse.data!.data : []
          
          return this.transformToConversation(conv, messages)
        })
      )

      return conversations
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return this.getMockConversations() // Return mock data as fallback
    }
  }

  // Fallback mock conversations for when Supabase isn't configured
  private getMockConversations(): ChatConversation[] {
    const currentUser = this.getCurrentUser()
    if (!currentUser) return []

    return [
      {
        id: 'mock-conv-1',
        participants: [
          currentUser,
          {
            id: 'care-team-1',
            name: 'Dr. Sarah Chen',
            username: '@dr.chen',
            avatar: '/avatars/admin-1.png',
            isOnline: true,
            role: 'admin'
          }
        ],
        lastMessage: {
          id: 'mock-msg-1',
          content: this.currentUserRole === 'admin' 
            ? 'How are you feeling today?' 
            : 'Welcome to Results Pro! How can we help you today?',
          timestamp: new Date().toISOString(),
          senderId: this.currentUserRole === 'admin' ? currentUser.id : 'care-team-1',
          isFromCurrentUser: this.currentUserRole === 'admin'
        },
        unreadCount: this.currentUserRole === 'admin' ? 0 : 1,
        messages: [
          {
            id: 'mock-msg-1',
            content: this.currentUserRole === 'admin' 
              ? 'How are you feeling today?' 
              : 'Welcome to Results Pro! How can we help you today?',
            timestamp: new Date().toISOString(),
            senderId: this.currentUserRole === 'admin' ? currentUser.id : 'care-team-1',
            isFromCurrentUser: this.currentUserRole === 'admin'
          }
        ],
        status: 'active'
      }
    ]
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      // Check configuration first
      const configCheck = this.checkSupabaseConfig()
      if (!configCheck.isConfigured) {
        return []
      }

      const response = await messagingService.getMessages(conversationId, 1, 50)
      
      if (!response.success || !response.data) {
        console.error('Failed to fetch messages:', response.error)
        return []
      }

      return response.data.data.map(msg => this.transformToMessage(msg))
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    toUserId: string,
    messageType: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent' = 'general',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<ChatMessage | null> {
    if (!this.currentUserId) {
      console.error('No current user set')
      return null
    }

    // Check configuration first
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      console.error('Cannot send message: Supabase not configured')
      return null
    }

    try {
      const response = await messagingService.sendMessage(
        conversationId,
        this.currentUserId,
        toUserId,
        content,
        messageType,
        priority
      )

      if (!response.success || !response.data) {
        console.error('Failed to send message:', response.error)
        return null
      }

      return this.transformToMessage(response.data)
    } catch (error) {
      console.error('Error sending message:', error)
      return null
    }
  }

  // Create a new conversation (typically for admin initiating with patient)
  async createConversation(patientId: string): Promise<string | null> {
    try {
      // Check configuration first
      const configCheck = this.checkSupabaseConfig()
      if (!configCheck.isConfigured) {
        console.error('Cannot create conversation: Supabase not configured')
        return null
      }

      const response = await messagingService.createConversation(
        patientId,
        this.currentUserRole === 'admin' && this.currentUserId ? this.currentUserId : undefined
      )

      if (!response.success || !response.data) {
        console.error('Failed to create conversation:', response.error)
        return null
      }

      return response.data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  // Mark messages as read
  async markConversationAsRead(conversationId: string): Promise<void> {
    if (!this.currentUserId) return

    // Check configuration first
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      return // Silently fail for demo mode
    }

    try {
      await messagingService.markMessagesAsRead(conversationId, this.currentUserId)
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
  }

  // Subscribe to real-time updates for a conversation
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void
  ) {
    // Check configuration first
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      console.warn('Real-time subscriptions disabled: Supabase not configured')
      return null
    }

    return messagingService.subscribeToConversation(
      conversationId,
      (adminMessage) => {
        const chatMessage = this.transformToMessage(adminMessage)
        onMessage(chatMessage)
      },
      onError
    )
  }

  // Subscribe to all conversations for real-time updates
  subscribeToAllConversations(
    onUpdate: (type: 'new_message' | 'conversation_updated', data: any) => void,
    onError?: (error: any) => void
  ) {
    if (!this.currentUserId) return null

    // Check configuration first
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.isConfigured) {
      console.warn('Real-time subscriptions disabled: Supabase not configured')
      return null
    }

    return messagingService.subscribeToAllConversations(
      this.currentUserId,
      (event) => {
        if (event.type === 'message_received') {
          const chatMessage = this.transformToMessage(event.payload as AdminMessage)
          onUpdate('new_message', chatMessage)
        } else if (event.type === 'conversation_updated') {
          onUpdate('conversation_updated', event.payload)
        }
      },
      onError
    )
  }

  // Get current user info
  getCurrentUser(): ChatUser | null {
    if (!this.currentUserId) return null

    // For now, create a mock current user
    // In a real app, this would come from your auth system
    if (this.currentUserRole === 'admin') {
      return {
        id: this.currentUserId,
        name: 'Dr. Admin',
        username: '@admin',
        avatar: '/avatars/user_joyboy.png',
        isOnline: true,
        role: 'admin'
      }
    } else {
      return {
        id: this.currentUserId,
        name: 'Patient User',
        username: '@patient',
        avatar: '/avatars/user_mati.png',
        isOnline: true,
        role: 'patient'
      }
    }
  }

  // Clean up subscriptions
  cleanup() {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription)
      this.realtimeSubscription = null
    }
    messagingService.unsubscribeFromRealtime()
  }

  // Get other participant in a conversation (for 1-on-1 chats)
  getOtherParticipant(conversation: ChatConversation): ChatUser | null {
    return conversation.participants.find(p => p.id !== this.currentUserId) || null
  }
}

// Export singleton instance
export const chatService = new ChatService()
export default ChatService
