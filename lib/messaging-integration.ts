import { messagingService } from './messaging-service'
import { adminService } from './admin-service'
import { templateService } from './template-service'
import { 
  AdminMessage, 
  AdminConversation, 
  ConversationSummary, 
  AdminUser,
  MessageTemplate,
  TemplateCategory,
  PatientContext,
  MessagingApiResponse,
  MessageType,
  MessagePriority,
  RealtimeMessageEvent
} from '../types/admin-chat'

class MessagingIntegration {
  // Combined Operations
  async initializeAdminMessaging(adminId: string): Promise<MessagingApiResponse<{
    admin: AdminUser
    conversations: ConversationSummary[]
    templates: TemplateCategory[]
    stats: any
  }>> {
    try {
      // Fetch admin details
      const adminResponse = await adminService.getAdminUser(adminId)
      if (!adminResponse.success || !adminResponse.data) {
        throw new Error(adminResponse.error || 'Failed to fetch admin user')
      }

      // Update last login
      await adminService.updateLastLogin(adminId)

      // Fetch conversations assigned to admin
      const conversationsResponse = await messagingService.getConversations(
        { admin_id: adminId, status: 'active' }
      )

      // Fetch templates available to admin
      const templatesResponse = await templateService.getTemplatesByCategory(adminId, true)

      // Get admin stats
      const statsResponse = await adminService.getAdminStats(adminId)

      return {
        success: true,
        data: {
          admin: adminResponse.data,
          conversations: conversationsResponse.data?.data || [],
          templates: templatesResponse.data || [],
          stats: statsResponse.data
        },
        message: 'Admin messaging initialized successfully'
      }
    } catch (error) {
      console.error('Error initializing admin messaging:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize admin messaging'
      }
    }
  }

  async sendMessageWithTemplate(
    conversationId: string,
    fromAdminId: string,
    toPatientId: string,
    templateId: string,
    customizations?: { [key: string]: string }
  ): Promise<MessagingApiResponse<AdminMessage>> {
    try {
      // Get template content
      const templatesResponse = await templateService.getTemplates(fromAdminId)
      if (!templatesResponse.success || !templatesResponse.data) {
        throw new Error('Failed to fetch templates')
      }

      const template = templatesResponse.data.data.find(t => t.id === templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Apply customizations to template content
      let content = template.content
      if (customizations) {
        Object.keys(customizations).forEach(key => {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), customizations[key])
        })
      }

      // Send message
      const messageResponse = await messagingService.sendMessage(
        conversationId,
        fromAdminId,
        toPatientId,
        content,
        'general', // Default to general, can be overridden
        'normal'   // Default to normal, can be overridden
      )

      if (messageResponse.success) {
        // Increment template usage count
        await templateService.incrementUsageCount(templateId)
      }

      return messageResponse
    } catch (error) {
      console.error('Error sending message with template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message with template'
      }
    }
  }

  async createConversationWithWelcomeMessage(
    patientId: string,
    adminId: string,
    patientName?: string
  ): Promise<MessagingApiResponse<{
    conversation: AdminConversation
    welcomeMessage: AdminMessage
  }>> {
    try {
      // Create conversation
      const conversationResponse = await messagingService.createConversation(patientId, adminId)
      if (!conversationResponse.success || !conversationResponse.data) {
        throw new Error(conversationResponse.error || 'Failed to create conversation')
      }

      // Find welcome template
      const templatesResponse = await templateService.getTemplates(adminId, 'Welcome', true)
      let welcomeContent = `Welcome to your peptide therapy program! I'm here to support you throughout your journey. Please don't hesitate to reach out with any questions or concerns.`
      
      if (templatesResponse.success && templatesResponse.data?.data.length > 0) {
        const welcomeTemplate = templatesResponse.data.data.find(t => t.title.includes('Welcome'))
        if (welcomeTemplate) {
          welcomeContent = welcomeTemplate.content
          if (patientName) {
            welcomeContent = welcomeContent.replace('{{patientName}}', patientName)
          }
        }
      }

      // Send welcome message
      const messageResponse = await messagingService.sendMessage(
        conversationResponse.data.id,
        adminId,
        patientId,
        welcomeContent,
        'general',
        'normal'
      )

      if (!messageResponse.success || !messageResponse.data) {
        throw new Error(messageResponse.error || 'Failed to send welcome message')
      }

      return {
        success: true,
        data: {
          conversation: conversationResponse.data,
          welcomeMessage: messageResponse.data
        },
        message: 'Conversation created with welcome message'
      }
    } catch (error) {
      console.error('Error creating conversation with welcome message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation with welcome message'
      }
    }
  }

  async escalateConversation(
    conversationId: string,
    escalateToAdminId: string,
    reason: string,
    currentAdminId: string
  ): Promise<MessagingApiResponse> {
    try {
      // Assign conversation to new admin
      const assignResponse = await messagingService.assignConversationToAdmin(
        conversationId,
        escalateToAdminId
      )

      if (!assignResponse.success) {
        throw new Error(assignResponse.error || 'Failed to assign conversation')
      }

      // Send escalation message
      const escalationMessage = `This conversation has been escalated to me from another team member. Reason: ${reason}. I'll be taking over from here.`
      
      // Get conversation details to find patient ID
      const conversationsResponse = await messagingService.getConversations({ admin_id: escalateToAdminId })
      const conversation = conversationsResponse.data?.data.find(c => c.id === conversationId)
      
      if (conversation) {
        await messagingService.sendMessage(
          conversationId,
          escalateToAdminId,
          conversation.patient_id,
          escalationMessage,
          'general',
          'high'
        )
      }

      return {
        success: true,
        message: 'Conversation escalated successfully'
      }
    } catch (error) {
      console.error('Error escalating conversation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to escalate conversation'
      }
    }
  }

  async broadcastMessage(
    adminId: string,
    patientIds: string[],
    content: string,
    messageType: MessageType = 'general',
    priority: MessagePriority = 'normal'
  ): Promise<MessagingApiResponse<{
    sent: number
    failed: number
    results: Array<{ patientId: string; success: boolean; error?: string }>
  }>> {
    try {
      const results = []
      let sent = 0
      let failed = 0

      for (const patientId of patientIds) {
        try {
          // Find or create conversation with patient
          const conversationsResponse = await messagingService.getConversations({ 
            admin_id: adminId,
            patient_search: patientId 
          })

          let conversationId: string

          if (conversationsResponse.data?.data.length === 0) {
            // Create new conversation
            const newConversationResponse = await messagingService.createConversation(patientId, adminId)
            if (!newConversationResponse.success || !newConversationResponse.data) {
              throw new Error('Failed to create conversation')
            }
            conversationId = newConversationResponse.data.id
          } else {
            conversationId = conversationsResponse.data!.data[0].id
          }

          // Send message
          const messageResponse = await messagingService.sendMessage(
            conversationId,
            adminId,
            patientId,
            content,
            messageType,
            priority
          )

          if (messageResponse.success) {
            sent++
            results.push({ patientId, success: true })
          } else {
            failed++
            results.push({ patientId, success: false, error: messageResponse.error })
          }
        } catch (error) {
          failed++
          results.push({ 
            patientId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      return {
        success: true,
        data: { sent, failed, results },
        message: `Broadcast completed: ${sent} sent, ${failed} failed`
      }
    } catch (error) {
      console.error('Error broadcasting message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to broadcast message'
      }
    }
  }

  async getPatientConversationHistory(
    patientId: string,
    includeMetadata: boolean = true
  ): Promise<MessagingApiResponse<{
    conversations: ConversationSummary[]
    totalMessages: number
    averageResponseTime?: number
    patientContext?: PatientContext
  }>> {
    try {
      // Get all conversations for patient
      const conversationsResponse = await messagingService.getConversations({
        patient_search: patientId
      })

      if (!conversationsResponse.success) {
        throw new Error(conversationsResponse.error || 'Failed to fetch conversations')
      }

      const conversations = conversationsResponse.data?.data || []
      
      // Get total message count across all conversations
      let totalMessages = 0
      for (const conversation of conversations) {
        const messagesResponse = await messagingService.getMessages(conversation.id, 1, 1000)
        if (messagesResponse.success && messagesResponse.data) {
          totalMessages += messagesResponse.data.total
        }
      }

      let patientContext: PatientContext | undefined
      if (includeMetadata) {
        // TODO: Integrate with patient data service to get context
        patientContext = {
          id: patientId,
          name: `Patient ${patientId}`,
          email: `patient${patientId}@example.com`,
          peptide_type: 'Unknown',
          start_date: new Date().toISOString(),
          current_week: 1,
          last_weight: 0,
          compliance_rate: 0,
          recent_side_effects: [],
          status: 'active'
        }
      }

      return {
        success: true,
        data: {
          conversations,
          totalMessages,
          averageResponseTime: 0, // TODO: Calculate actual response time
          patientContext
        }
      }
    } catch (error) {
      console.error('Error fetching patient conversation history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch patient conversation history'
      }
    }
  }

  // Real-time integration
  setupRealtimeForAdmin(
    adminId: string,
    onMessage: (event: RealtimeMessageEvent) => void,
    onError?: (error: any) => void
  ) {
    return messagingService.subscribeToAllConversations(adminId, onMessage, onError)
  }

  // Utility methods
  async getUnreadMessagesCount(adminId: string): Promise<number> {
    try {
      const statsResponse = await adminService.getAdminStats(adminId)
      return statsResponse.data?.unreadMessages || 0
    } catch (error) {
      console.error('Error fetching unread messages count:', error)
      return 0
    }
  }

  async markAllMessagesAsRead(adminId: string): Promise<MessagingApiResponse> {
    try {
      // Get all conversations for admin
      const conversationsResponse = await messagingService.getConversations({ admin_id: adminId })
      if (!conversationsResponse.success || !conversationsResponse.data) {
        throw new Error('Failed to fetch conversations')
      }

      // Mark messages as read for each conversation
      const promises = conversationsResponse.data.data.map(conversation =>
        messagingService.markMessagesAsRead(conversation.id, adminId)
      )

      await Promise.all(promises)

      return {
        success: true,
        message: 'All messages marked as read'
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all messages as read'
      }
    }
  }
}

// Export singleton instance
export const messagingIntegration = new MessagingIntegration()
export default MessagingIntegration
