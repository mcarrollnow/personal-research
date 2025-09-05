import { supabase, type Database } from './supabase'
import { 
  AdminMessage, 
  AdminConversation, 
  ConversationSummary,
  MessageFilters,
  ConversationFilters,
  MessagingApiResponse,
  PaginatedResponse,
  MessageType,
  MessagePriority,
  ConversationStatus,
  RealtimeMessageEvent
} from '../types/admin-chat'

class MessagingService {
  private realtimeSubscription: any = null

  // Message Operations
  async sendMessage(
    conversationId: string,
    fromUserId: string,
    toUserId: string,
    content: string,
    messageType: MessageType = 'general',
    priority: MessagePriority = 'normal',
    attachments: any[] = []
  ): Promise<MessagingApiResponse<AdminMessage>> {
    try {
      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          content,
          message_type: messageType,
          priority,
          attachments
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Update conversation last_message_at and unread_count
      // First get current unread_count
      const { data: currentConv } = await supabase
        .from('conversations')
        .select('unread_count')
        .eq('id', conversationId)
        .single()

      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (currentConv?.unread_count || 0) + 1
        })
        .eq('id', conversationId)

      if (conversationError) throw conversationError

      return {
        success: true,
        data: message as AdminMessage,
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagingApiResponse<PaginatedResponse<AdminMessage>>> {
    try {
      const offset = (page - 1) * limit

      const { data: messages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        data: {
          data: (messages as AdminMessage[]).reverse(), // Reverse to show oldest first
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    }
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<MessagingApiResponse> {
    try {
      // Mark messages as read
      const { error: messageError } = await supabase
        .from('messages')
        .update({ read_status: true })
        .eq('conversation_id', conversationId)
        .eq('to_user_id', userId)
        .eq('read_status', false)

      if (messageError) throw messageError

      // Reset unread count for conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)

      if (conversationError) throw conversationError

      return {
        success: true,
        message: 'Messages marked as read'
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark messages as read'
      }
    }
  }

  // Conversation Operations
  async getConversations(
    filters: ConversationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<MessagingApiResponse<PaginatedResponse<ConversationSummary>>> {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(
            id,
            content,
            created_at,
            priority,
            from_user_id
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.admin_id) {
        query = query.eq('admin_id', filters.admin_id)
      }
      if (filters.has_unread) {
        query = query.gt('unread_count', 0)
      }

      const offset = (page - 1) * limit
      const { data: conversations, error, count } = await query
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Transform to ConversationSummary format
      const summaries: ConversationSummary[] = conversations?.map(conv => ({
        id: conv.id,
        patient_id: conv.patient_id,
        patient_name: `Patient ${conv.patient_id}`, // TODO: Get actual patient name
        admin_id: conv.admin_id,
        admin_name: conv.admin_id ? `Admin ${conv.admin_id}` : undefined, // TODO: Get actual admin name
        last_message_at: conv.last_message_at,
        unread_count: conv.unread_count,
        status: conv.status,
        last_message_preview: conv.messages?.[0]?.content?.substring(0, 100) || '',
        priority: conv.messages?.[0]?.priority || 'normal'
      })) || []

      return {
        success: true,
        data: {
          data: summaries,
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversations'
      }
    }
  }

  async createConversation(
    patientId: string,
    adminId?: string
  ): Promise<MessagingApiResponse<AdminConversation>> {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          admin_id: adminId,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: conversation as AdminConversation,
        message: 'Conversation created successfully'
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation'
      }
    }
  }

  async updateConversationStatus(
    conversationId: string,
    status: ConversationStatus
  ): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId)

      if (error) throw error

      return {
        success: true,
        message: 'Conversation status updated'
      }
    } catch (error) {
      console.error('Error updating conversation status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update conversation status'
      }
    }
  }

  async assignConversationToAdmin(
    conversationId: string,
    adminId: string
  ): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ admin_id: adminId })
        .eq('id', conversationId)

      if (error) throw error

      return {
        success: true,
        message: 'Conversation assigned to admin'
      }
    } catch (error) {
      console.error('Error assigning conversation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign conversation'
      }
    }
  }

  // Real-time Subscriptions
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: AdminMessage) => void,
    onError?: (error: any) => void
  ) {
    try {
      const subscription = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            onMessage(payload.new as AdminMessage)
          }
        )
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Error subscribing to conversation:', error)
      if (onError) onError(error)
      return null
    }
  }

  subscribeToAllConversations(
    userId: string,
    onMessage: (event: RealtimeMessageEvent) => void,
    onError?: (error: any) => void
  ) {
    try {
      // Use unique channel for each user to avoid conflicts
      console.log('Creating subscription for userId:', userId);
      
      // Clean up any existing subscription first
      this.unsubscribeFromRealtime();
      
      const subscription = supabase
        .channel(`messages:${userId}:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('Supabase real-time payload received for user:', userId, payload);
            const event: RealtimeMessageEvent = {
              type: payload.eventType === 'INSERT' ? 'message_received' : 'message_read',
              payload: payload.new as AdminMessage,
              timestamp: new Date().toISOString()
            }
            onMessage(event)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations'
          },
          (payload) => {
            const event: RealtimeMessageEvent = {
              type: 'conversation_updated',
              payload: payload.new as AdminConversation,
              timestamp: new Date().toISOString()
            }
            onMessage(event)
          }
        )
        .subscribe((status) => {
          console.log('Subscription status for user:', userId, status);
        })

      this.realtimeSubscription = subscription
      return subscription
    } catch (error) {
      console.error('Error subscribing to conversations:', error)
      if (onError) onError(error)
      return null
    }
  }

  unsubscribeFromRealtime() {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription)
      this.realtimeSubscription = null
    }
  }

  // Search and Filter
  async searchMessages(
    filters: MessageFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagingApiResponse<PaginatedResponse<AdminMessage>>> {
    try {
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.patient_id) {
        query = query.or(`from_user_id.eq.${filters.patient_id},to_user_id.eq.${filters.patient_id}`)
      }
      if (filters.admin_id) {
        query = query.or(`from_user_id.eq.${filters.admin_id},to_user_id.eq.${filters.admin_id}`)
      }
      if (filters.message_type) {
        query = query.eq('message_type', filters.message_type)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.read_status !== undefined) {
        query = query.eq('read_status', filters.read_status)
      }
      if (filters.search_query) {
        query = query.ilike('content', `%${filters.search_query}%`)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const offset = (page - 1) * limit
      const { data: messages, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        data: {
          data: messages as AdminMessage[],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    } catch (error) {
      console.error('Error searching messages:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search messages'
      }
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService()
export default MessagingService
