/**
 * Messaging System Usage Examples
 * 
 * This file demonstrates how to use the Supabase messaging system
 * for admin-patient communication in the clinical trial platform.
 */

import { messagingIntegration } from './messaging-integration'
import { adminService } from './admin-service'
import { templateService } from './template-service'
import { messagingService } from './messaging-service'

// Example 1: Initialize Admin Messaging Session
export async function initializeAdminSession(adminId: string) {
  console.log('🚀 Initializing admin messaging session...')
  
  const result = await messagingIntegration.initializeAdminMessaging(adminId)
  
  if (result.success && result.data) {
    console.log('✅ Admin session initialized')
    console.log(`Admin: ${result.data.admin.name} (${result.data.admin.role})`)
    console.log(`Active conversations: ${result.data.conversations.length}`)
    console.log(`Available templates: ${result.data.templates.length} categories`)
    console.log(`Unread messages: ${result.data.stats?.unreadMessages || 0}`)
    
    return result.data
  } else {
    console.error('❌ Failed to initialize admin session:', result.error)
    return null
  }
}

// Example 2: Create New Admin User
export async function createNewAdmin() {
  console.log('👤 Creating new admin user...')
  
  const adminData = {
    admin_id: 'admin_001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    role: 'coordinator' as const,
    department: 'Clinical Research',
    phone: '+1-555-0123',
    timezone: 'America/New_York',
    permissions: ['view_patients', 'send_messages', 'manage_templates']
  }
  
  const result = await adminService.createAdminUser(adminData)
  
  if (result.success) {
    console.log('✅ Admin user created:', result.data?.name)
    
    // Create default templates for new admin
    await templateService.createDefaultTemplates(adminData.admin_id)
    console.log('✅ Default templates created')
    
    return result.data
  } else {
    console.error('❌ Failed to create admin:', result.error)
    return null
  }
}

// Example 3: Start Conversation with New Patient
export async function startPatientConversation(patientId: string, adminId: string, patientName?: string) {
  console.log('💬 Starting conversation with new patient...')
  
  const result = await messagingIntegration.createConversationWithWelcomeMessage(
    patientId,
    adminId,
    patientName
  )
  
  if (result.success && result.data) {
    console.log('✅ Conversation started')
    console.log(`Conversation ID: ${result.data.conversation.id}`)
    console.log(`Welcome message sent: "${result.data.welcomeMessage.content.substring(0, 50)}..."`)
    
    return result.data.conversation
  } else {
    console.error('❌ Failed to start conversation:', result.error)
    return null
  }
}

// Example 4: Send Message Using Template
export async function sendTemplatedMessage(
  conversationId: string,
  adminId: string,
  patientId: string,
  templateTitle: string,
  customizations?: { [key: string]: string }
) {
  console.log('📝 Sending templated message...')
  
  // Find template by title
  const templatesResponse = await templateService.getTemplates(adminId, undefined, true)
  if (!templatesResponse.success || !templatesResponse.data) {
    console.error('❌ Failed to fetch templates')
    return null
  }
  
  const template = templatesResponse.data.data.find(t => t.title === templateTitle)
  if (!template) {
    console.error(`❌ Template "${templateTitle}" not found`)
    return null
  }
  
  const result = await messagingIntegration.sendMessageWithTemplate(
    conversationId,
    adminId,
    patientId,
    template.id,
    customizations
  )
  
  if (result.success) {
    console.log('✅ Templated message sent')
    console.log(`Content: "${result.data?.content.substring(0, 100)}..."`)
    return result.data
  } else {
    console.error('❌ Failed to send templated message:', result.error)
    return null
  }
}

// Example 5: Broadcast Message to Multiple Patients
export async function broadcastToPatients(
  adminId: string,
  patientIds: string[],
  message: string,
  messageType: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent' = 'general'
) {
  console.log('📢 Broadcasting message to patients...')
  
  const result = await messagingIntegration.broadcastMessage(
    adminId,
    patientIds,
    message,
    messageType,
    messageType === 'urgent' ? 'high' : 'normal'
  )
  
  if (result.success && result.data) {
    console.log('✅ Broadcast completed')
    console.log(`Messages sent: ${result.data.sent}`)
    console.log(`Messages failed: ${result.data.failed}`)
    
    // Log any failures
    result.data.results
      .filter(r => !r.success)
      .forEach(r => console.warn(`⚠️  Failed for patient ${r.patientId}: ${r.error}`))
    
    return result.data
  } else {
    console.error('❌ Broadcast failed:', result.error)
    return null
  }
}

// Example 6: Handle Urgent Safety Message
export async function handleSafetyAlert(
  patientId: string,
  safetyMessage: string,
  adminId: string
) {
  console.log('🚨 Processing safety alert...')
  
  // Find or create urgent conversation
  const conversationsResponse = await messagingService.getConversations({ 
    patient_search: patientId,
    status: 'active'
  })
  
  let conversationId: string
  
  if (conversationsResponse.data?.data.length === 0) {
    const newConversation = await messagingService.createConversation(patientId, adminId)
    if (!newConversation.success || !newConversation.data) {
      console.error('❌ Failed to create conversation for safety alert')
      return null
    }
    conversationId = newConversation.data.id
  } else {
    conversationId = conversationsResponse.data!.data[0].id
  }
  
  // Send urgent safety message
  const result = await messagingService.sendMessage(
    conversationId,
    adminId,
    patientId,
    `🚨 SAFETY ALERT: ${safetyMessage}. Please respond immediately or contact your healthcare provider.`,
    'safety',
    'urgent'
  )
  
  if (result.success) {
    console.log('✅ Safety alert sent')
    
    // TODO: Trigger additional safety protocols
    // - Email notification to admin
    // - SMS alert if configured
    // - Escalation to medical team
    
    return result.data
  } else {
    console.error('❌ Failed to send safety alert:', result.error)
    return null
  }
}

// Example 7: Set Up Real-time Messaging for Admin
export function setupRealtimeMessaging(adminId: string) {
  console.log('⚡ Setting up real-time messaging...')
  
  const subscription = messagingIntegration.setupRealtimeForAdmin(
    adminId,
    (event) => {
      switch (event.type) {
        case 'message_received':
          console.log('📨 New message received:', {
            from: (event.payload as any).from_user_id,
            content: (event.payload as any).content.substring(0, 50) + '...',
            priority: (event.payload as any).priority
          })
          
          // Handle urgent messages
          if ((event.payload as any).priority === 'urgent') {
            console.log('🚨 URGENT MESSAGE - Immediate attention required!')
            // Trigger notification sound, popup, etc.
          }
          break
          
        case 'message_read':
          console.log('👀 Message marked as read')
          break
          
        case 'conversation_updated':
          console.log('🔄 Conversation updated')
          break
      }
    },
    (error) => {
      console.error('❌ Real-time messaging error:', error)
    }
  )
  
  console.log('✅ Real-time messaging active')
  return subscription
}

// Example 8: Get Patient Communication History
export async function getPatientHistory(patientId: string) {
  console.log('📊 Fetching patient communication history...')
  
  const result = await messagingIntegration.getPatientConversationHistory(patientId, true)
  
  if (result.success && result.data) {
    console.log('✅ Patient history retrieved')
    console.log(`Total conversations: ${result.data.conversations.length}`)
    console.log(`Total messages: ${result.data.totalMessages}`)
    console.log(`Patient status: ${result.data.patientContext?.status}`)
    
    return result.data
  } else {
    console.error('❌ Failed to fetch patient history:', result.error)
    return null
  }
}

// Example 9: Create Custom Template
export async function createCustomTemplate(adminId: string) {
  console.log('📋 Creating custom message template...')
  
  const templateData = {
    admin_id: adminId,
    title: 'Week 4 Progress Check',
    content: 'Hi {{patientName}}! You\'re now in week 4 of your program. How are you feeling? Please share your current weight and any observations. Your progress is important to us!',
    category: 'Progress',
    is_global: false // Personal template
  }
  
  const result = await templateService.createTemplate(templateData)
  
  if (result.success) {
    console.log('✅ Custom template created:', result.data?.title)
    return result.data
  } else {
    console.error('❌ Failed to create template:', result.error)
    return null
  }
}

// Example 10: Escalate Conversation
export async function escalateConversation(
  conversationId: string,
  fromAdminId: string,
  toAdminId: string,
  reason: string
) {
  console.log('⬆️ Escalating conversation...')
  
  const result = await messagingIntegration.escalateConversation(
    conversationId,
    toAdminId,
    reason,
    fromAdminId
  )
  
  if (result.success) {
    console.log('✅ Conversation escalated successfully')
    return true
  } else {
    console.error('❌ Failed to escalate conversation:', result.error)
    return false
  }
}

// Example Usage Scenario: Complete Admin Workflow
export async function completeAdminWorkflow() {
  console.log('🔄 Running complete admin workflow example...\n')
  
  const adminId = 'admin_001'
  const patientId = 'patient_123'
  
  // 1. Initialize admin session
  const session = await initializeAdminSession(adminId)
  if (!session) return
  
  // 2. Start conversation with patient
  const conversation = await startPatientConversation(patientId, adminId, 'John Doe')
  if (!conversation) return
  
  // 3. Send a follow-up message using template
  await sendTemplatedMessage(
    conversation.id,
    adminId,
    patientId,
    'First Week Check-in',
    { patientName: 'John' }
  )
  
  // 4. Set up real-time messaging
  const subscription = setupRealtimeMessaging(adminId)
  
  // 5. Create a custom template
  await createCustomTemplate(adminId)
  
  // 6. Simulate broadcast to multiple patients
  await broadcastToPatients(
    adminId,
    ['patient_123', 'patient_456', 'patient_789'],
    'Weekly reminder: Please log your weight and complete your progress assessment.',
    'general'
  )
  
  console.log('\n✅ Complete admin workflow executed successfully!')
  
  // Cleanup: Unsubscribe from real-time when done
  setTimeout(() => {
    messagingService.unsubscribeFromRealtime()
    console.log('🔌 Real-time messaging disconnected')
  }, 30000) // Disconnect after 30 seconds for demo
}

// Export all examples for easy testing
export const messagingExamples = {
  initializeAdminSession,
  createNewAdmin,
  startPatientConversation,
  sendTemplatedMessage,
  broadcastToPatients,
  handleSafetyAlert,
  setupRealtimeMessaging,
  getPatientHistory,
  createCustomTemplate,
  escalateConversation,
  completeAdminWorkflow
}
