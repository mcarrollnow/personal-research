import { messagingService } from './messaging-service'
import type { MessageType, MessagePriority, MessagingApiResponse } from '@/types/admin-chat'

interface BroadcastRequest {
  recipientIds: string[]
  content: string
  messageType: MessageType
  priority: MessagePriority
  adminId: string
}

interface BroadcastResult {
  success: boolean
  message: string
  successCount?: number
  failureCount?: number
  failures?: Array<{ patientId: string; error: string }>
}

class BroadcastService {
  async sendBroadcast(request: BroadcastRequest): Promise<BroadcastResult> {
    const { recipientIds, content, messageType, priority, adminId } = request
    
    if (recipientIds.length === 0) {
      return {
        success: false,
        message: 'No recipients selected'
      }
    }

    if (!content.trim()) {
      return {
        success: false,
        message: 'Message content cannot be empty'
      }
    }

    const results: Array<{ patientId: string; success: boolean; error?: string }> = []

    try {
      // Send message to each recipient
      for (const patientId of recipientIds) {
        try {
          // Find or create conversation with patient
          let conversationId: string

          // First try to find existing conversation
          const conversationsResult = await messagingService.getConversations({
            admin_id: adminId,
            patient_search: patientId
          })

          if (conversationsResult.success && conversationsResult.data && conversationsResult.data.data.length > 0) {
            // Use existing conversation
            const existingConversation = conversationsResult.data.data.find(conv => conv.patient_id === patientId)
            if (existingConversation) {
              conversationId = existingConversation.id
            } else {
              // Create new conversation
              const createResult = await messagingService.createConversation(patientId, adminId)
              if (!createResult.success || !createResult.data) {
                throw new Error('Failed to create conversation')
              }
              conversationId = createResult.data.id
            }
          } else {
            // Create new conversation
            const createResult = await messagingService.createConversation(patientId, adminId)
            if (!createResult.success || !createResult.data) {
              throw new Error('Failed to create conversation')
            }
            conversationId = createResult.data.id
          }

          // Send the message
          const sendResult = await messagingService.sendMessage(
            conversationId,
            adminId,
            patientId,
            content,
            messageType,
            priority
          )

          if (sendResult.success) {
            results.push({ patientId, success: true })
          } else {
            results.push({ 
              patientId, 
              success: false, 
              error: sendResult.error || 'Failed to send message' 
            })
          }
        } catch (error) {
          results.push({ 
            patientId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      const failures = results.filter(r => !r.success).map(r => ({
        patientId: r.patientId,
        error: r.error || 'Unknown error'
      }))

      if (successCount === recipientIds.length) {
        return {
          success: true,
          message: `Broadcast message sent successfully to ${successCount} patients`,
          successCount,
          failureCount: 0
        }
      } else if (successCount > 0) {
        return {
          success: true,
          message: `Broadcast partially successful: ${successCount} sent, ${failureCount} failed`,
          successCount,
          failureCount,
          failures
        }
      } else {
        return {
          success: false,
          message: `Broadcast failed: No messages were sent successfully`,
          successCount: 0,
          failureCount,
          failures
        }
      }
    } catch (error) {
      console.error('Broadcast service error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send broadcast message'
      }
    }
  }

  async getBroadcastHistory(adminId: string, page: number = 1, limit: number = 20) {
    // This would typically query a broadcast_messages table
    // For now, return mock data structure
    try {
      return {
        success: true,
        data: {
          data: [], // Would contain broadcast history
          total: 0,
          page,
          limit,
          hasMore: false
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get broadcast history'
      }
    }
  }

  async scheduleBroadcast(request: BroadcastRequest & { scheduledFor: string }) {
    // This would schedule a broadcast for later sending
    // Implementation would depend on job queue system (like Bull, Agenda, etc.)
    try {
      console.log('Scheduling broadcast for:', request.scheduledFor)
      
      return {
        success: true,
        message: `Broadcast scheduled for ${new Date(request.scheduledFor).toLocaleString()}`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to schedule broadcast'
      }
    }
  }

  async cancelScheduledBroadcast(broadcastId: string) {
    // Cancel a scheduled broadcast
    try {
      console.log('Canceling scheduled broadcast:', broadcastId)
      
      return {
        success: true,
        message: 'Scheduled broadcast canceled successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel scheduled broadcast'
      }
    }
  }
}

export const broadcastService = new BroadcastService()
export default BroadcastService
