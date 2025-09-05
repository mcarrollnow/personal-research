import { supabase } from './supabase'

export interface NotificationPreferences {
  userId: string
  userType: 'admin' | 'patient'
  browserNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  dailyDigest: boolean
  urgentOnly: boolean
  quietHours: {
    enabled: boolean
    startTime: string // HH:MM
    endTime: string // HH:MM
  }
}

export interface NotificationQueue {
  id: string
  recipientId: string
  recipientType: 'admin' | 'patient'
  type: 'browser' | 'email' | 'sms' | 'push'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  title: string
  message: string
  data?: Record<string, any>
  scheduledFor: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  createdAt: string
  sentAt?: string
  error?: string
}

export interface EscalationRule {
  id: string
  name: string
  trigger: {
    messageType: string[]
    keywords: string[]
    priority: string[]
    responseTimeThreshold?: number // minutes
  }
  escalationSteps: EscalationStep[]
  isActive: boolean
}

export interface EscalationStep {
  stepNumber: number
  delay: number // minutes
  action: 'notify_admin' | 'notify_supervisor' | 'create_alert' | 'send_email'
  recipients: string[]
  message: string
}

export interface DailyDigest {
  recipientId: string
  date: string
  totalMessages: number
  urgentMessages: number
  newPatients: number
  responseTime: number
  topCategories: string[]
  summary: string
}

class NotificationService {
  private notificationPermission: NotificationPermission = 'default'

  constructor() {
    // Don't automatically request permissions - wait for user interaction
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.notificationPermission = Notification.permission
    }
  }

  // Initialize browser notification permissions (must be called from user interaction)
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    
    if (this.notificationPermission === 'default') {
      this.notificationPermission = await Notification.requestPermission()
    }
    
    return this.notificationPermission
  }

  // Send browser notification
  async sendBrowserNotification(
    title: string, 
    message: string, 
    options: {
      icon?: string
      badge?: string
      tag?: string
      data?: any
      requireInteraction?: boolean
      actions?: NotificationAction[]
    } = {}
  ): Promise<boolean> {
    if (!('Notification' in window) || this.notificationPermission !== 'granted') {
      return false
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: options.icon || '/icons/notification-icon.png',
        badge: options.badge || '/icons/notification-badge.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions
      })

      notification.onclick = () => {
        window.focus()
        if (options.data?.url) {
          window.location.href = options.data.url
        }
        notification.close()
      }

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000)
      }

      return true
    } catch (error) {
      console.error('Error sending browser notification:', error)
      return false
    }
  }

  // Queue notification for delivery
  async queueNotification(notification: Omit<NotificationQueue, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .insert({
          recipient_id: notification.recipientId,
          recipient_type: notification.recipientType,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          scheduled_for: notification.scheduledFor,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error queueing notification:', error)
      throw error
    }
  }

  // Process notification queue
  async processNotificationQueue(): Promise<void> {
    try {
      const { data: pendingNotifications, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false }) // Urgent first
        .order('created_at', { ascending: true })

      if (error) throw error

      for (const notification of pendingNotifications || []) {
        await this.deliverNotification(notification)
      }
    } catch (error) {
      console.error('Error processing notification queue:', error)
    }
  }

  // Deliver individual notification
  private async deliverNotification(notification: NotificationQueue): Promise<void> {
    try {
      let success = false
      let errorMessage = ''

      // Check user preferences
      const preferences = await this.getUserNotificationPreferences(
        notification.recipientId, 
        notification.recipientType
      )

      if (!this.shouldDeliverNotification(notification, preferences)) {
        await this.updateNotificationStatus(notification.id, 'cancelled', 'User preferences')
        return
      }

      switch (notification.type) {
        case 'browser':
          success = await this.sendBrowserNotification(notification.title, notification.message, {
            data: notification.data,
            requireInteraction: notification.priority === 'urgent'
          })
          break

        case 'email':
          success = await this.sendEmailNotification(notification)
          break

        case 'sms':
          success = await this.sendSMSNotification(notification)
          break

        case 'push':
          success = await this.sendPushNotification(notification)
          break

        default:
          errorMessage = `Unknown notification type: ${notification.type}`
      }

      const status = success ? 'sent' : 'failed'
      await this.updateNotificationStatus(notification.id, status, errorMessage)

    } catch (error) {
      console.error('Error delivering notification:', error)
      await this.updateNotificationStatus(notification.id, 'failed', error.message)
    }
  }

  // Update notification status
  private async updateNotificationStatus(
    notificationId: string, 
    status: NotificationQueue['status'], 
    error?: string
  ): Promise<void> {
    const updates: any = {
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : undefined,
      error: error || undefined
    }

    await supabase
      .from('notification_queue')
      .update(updates)
      .eq('id', notificationId)
  }

  // Check if notification should be delivered based on user preferences
  private shouldDeliverNotification(
    notification: NotificationQueue, 
    preferences: NotificationPreferences
  ): boolean {
    // Check notification type preferences
    switch (notification.type) {
      case 'browser':
        if (!preferences.browserNotifications) return false
        break
      case 'email':
        if (!preferences.emailNotifications) return false
        break
      case 'sms':
        if (!preferences.smsNotifications) return false
        break
    }

    // Check if urgent only mode is enabled
    if (preferences.urgentOnly && notification.priority !== 'urgent') {
      return false
    }

    // Check quiet hours
    if (preferences.quietHours.enabled && notification.priority !== 'urgent') {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (this.isInQuietHours(currentTime, preferences.quietHours.startTime, preferences.quietHours.endTime)) {
        return false
      }
    }

    return true
  }

  // Check if current time is within quiet hours
  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const currentMinutes = currentHour * 60 + currentMinute
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    if (startMinutes <= endMinutes) {
      // Same day quiet hours
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // Overnight quiet hours
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }

  // Send email notification (placeholder for email service integration)
  private async sendEmailNotification(notification: NotificationQueue): Promise<boolean> {
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log('Email notification would be sent:', {
        to: notification.recipientId,
        subject: notification.title,
        body: notification.message
      })
      
      // For now, just log and return success
      return true
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  // Send SMS notification (placeholder for SMS service integration)
  private async sendSMSNotification(notification: NotificationQueue): Promise<boolean> {
    try {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log('SMS notification would be sent:', {
        to: notification.recipientId,
        message: `${notification.title}: ${notification.message}`
      })
      
      // For now, just log and return success
      return true
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      return false
    }
  }

  // Send push notification (placeholder for push service integration)
  private async sendPushNotification(notification: NotificationQueue): Promise<boolean> {
    try {
      // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
      console.log('Push notification would be sent:', notification)
      
      // For now, just log and return success
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  // Get user notification preferences
  async getUserNotificationPreferences(userId: string, userType: 'admin' | 'patient'): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Return default preferences if none found
      if (!data) {
        return {
          userId,
          userType,
          browserNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          dailyDigest: userType === 'admin',
          urgentOnly: false,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          }
        }
      }

      return {
        userId: data.user_id,
        userType: data.user_type,
        browserNotifications: data.browser_notifications,
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        dailyDigest: data.daily_digest,
        urgentOnly: data.urgent_only,
        quietHours: data.quiet_hours
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
      // Return default preferences on error
      return {
        userId,
        userType,
        browserNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        dailyDigest: userType === 'admin',
        urgentOnly: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      }
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: preferences.userId,
          user_type: preferences.userType,
          browser_notifications: preferences.browserNotifications,
          email_notifications: preferences.emailNotifications,
          sms_notifications: preferences.smsNotifications,
          daily_digest: preferences.dailyDigest,
          urgent_only: preferences.urgentOnly,
          quiet_hours: preferences.quietHours
        })
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  // Handle message escalation
  async handleMessageEscalation(messageId: string, conversationId: string): Promise<void> {
    try {
      // Get escalation rules
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      // Get message details
      const { data: message } = await supabase
        .from('messages')
        .select('*, conversations(*)')
        .eq('id', messageId)
        .single()

      if (!message) return

      // Check which escalation rules apply
      for (const rule of rules || []) {
        if (this.shouldEscalateMessage(message, rule)) {
          await this.executeEscalationRule(rule, message)
        }
      }
    } catch (error) {
      console.error('Error handling message escalation:', error)
    }
  }

  // Check if message should be escalated based on rule
  private shouldEscalateMessage(message: any, rule: EscalationRule): boolean {
    // Check message type
    if (rule.trigger.messageType.length > 0 && 
        !rule.trigger.messageType.includes(message.message_type)) {
      return false
    }

    // Check priority
    if (rule.trigger.priority.length > 0 && 
        !rule.trigger.priority.includes(message.priority)) {
      return false
    }

    // Check keywords
    if (rule.trigger.keywords.length > 0) {
      const content = message.content.toLowerCase()
      const hasKeyword = rule.trigger.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      )
      if (!hasKeyword) return false
    }

    // Check response time threshold
    if (rule.trigger.responseTimeThreshold) {
      const messageTime = new Date(message.created_at).getTime()
      const now = new Date().getTime()
      const minutesSinceMessage = (now - messageTime) / (1000 * 60)
      
      if (minutesSinceMessage < rule.trigger.responseTimeThreshold) {
        return false
      }
    }

    return true
  }

  // Execute escalation rule
  private async executeEscalationRule(rule: EscalationRule, message: any): Promise<void> {
    for (const step of rule.escalationSteps) {
      // Schedule escalation step
      const scheduledFor = new Date()
      scheduledFor.setMinutes(scheduledFor.getMinutes() + step.delay)

      for (const recipientId of step.recipients) {
        await this.queueNotification({
          recipientId,
          recipientType: 'admin',
          type: 'browser',
          priority: 'urgent',
          title: `Escalation: ${rule.name}`,
          message: step.message,
          data: {
            messageId: message.id,
            conversationId: message.conversation_id,
            url: `/admin/chat/${message.conversation_id}`
          },
          scheduledFor: scheduledFor.toISOString()
        })

        // Also send email for urgent escalations
        await this.queueNotification({
          recipientId,
          recipientType: 'admin',
          type: 'email',
          priority: 'urgent',
          title: `Urgent: ${rule.name}`,
          message: step.message,
          scheduledFor: scheduledFor.toISOString()
        })
      }
    }
  }

  // Generate and send daily digest
  async generateDailyDigest(adminId: string): Promise<void> {
    try {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Get yesterday's statistics
      const { data: messages } = await supabase
        .from('messages')
        .select('*, conversations(*)')
        .gte('created_at', yesterday.toISOString().split('T')[0])
        .lt('created_at', today.toISOString().split('T')[0])

      const totalMessages = messages?.length || 0
      const urgentMessages = messages?.filter(m => m.priority === 'urgent').length || 0

      // Calculate average response time
      const responseTimes: number[] = []
      // ... response time calculation logic ...

      const digest: DailyDigest = {
        recipientId: adminId,
        date: yesterday.toISOString().split('T')[0],
        totalMessages,
        urgentMessages,
        newPatients: 0, // TODO: Calculate new patients
        responseTime: responseTimes.length > 0 
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
          : 0,
        topCategories: [], // TODO: Calculate top categories
        summary: `Yesterday you handled ${totalMessages} messages with ${urgentMessages} urgent cases.`
      }

      // Send digest notification
      await this.queueNotification({
        recipientId: adminId,
        recipientType: 'admin',
        type: 'email',
        priority: 'normal',
        title: 'Daily Patient Support Digest',
        message: digest.summary,
        data: digest,
        scheduledFor: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error generating daily digest:', error)
    }
  }

  // Initialize default escalation rules
  async initializeDefaultEscalationRules(): Promise<void> {
    const defaultRules: Omit<EscalationRule, 'id'>[] = [
      {
        name: 'Safety Alert Escalation',
        trigger: {
          messageType: ['safety_alert'],
          keywords: ['emergency', 'severe', 'hospital', 'allergic reaction'],
          priority: ['urgent', 'high'],
          responseTimeThreshold: 15 // 15 minutes
        },
        escalationSteps: [
          {
            stepNumber: 1,
            delay: 0, // Immediate
            action: 'notify_admin',
            recipients: ['admin_supervisor_id'], // TODO: Get from admin hierarchy
            message: 'URGENT: Safety alert requires immediate attention'
          },
          {
            stepNumber: 2,
            delay: 30, // 30 minutes later
            action: 'send_email',
            recipients: ['admin_supervisor_id'],
            message: 'Safety alert has not been addressed for 30 minutes'
          }
        ],
        isActive: true
      }
    ]

    for (const rule of defaultRules) {
      await supabase
        .from('escalation_rules')
        .insert({
          name: rule.name,
          trigger: rule.trigger,
          escalation_steps: rule.escalationSteps,
          is_active: rule.isActive
        })
    }
  }
}

export const notificationService = new NotificationService()
