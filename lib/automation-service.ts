import { supabase } from './supabase'
import { messagingService } from './messaging-service'

export interface AutomationRule {
  id: string
  name: string
  trigger: AutomationTrigger
  action: AutomationAction
  isActive: boolean
  createdAt: string
  lastExecuted?: string
}

export interface AutomationTrigger {
  type: 'patient_onboarded' | 'dosing_reminder' | 'weekly_checkin' | 'milestone_reached' | 'safety_alert' | 'inactive_patient'
  conditions: Record<string, any>
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly'
    time?: string // HH:MM format
    daysOfWeek?: number[] // 0-6, Sunday = 0
  }
}

export interface AutomationAction {
  type: 'send_message' | 'send_email' | 'create_alert' | 'assign_task'
  templateId?: string
  customMessage?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  recipients: {
    type: 'patient' | 'admin' | 'specific_users'
    userIds?: string[]
  }
}

export interface MessageTemplate {
  id: string
  name: string
  category: string
  subject?: string
  content: string
  variables: string[] // Available template variables like {{patientName}}, {{currentWeek}}
  isActive: boolean
}

class AutomationService {

  // Initialize default automation rules
  async initializeDefaultRules(): Promise<void> {
    const defaultRules: Omit<AutomationRule, 'id' | 'createdAt'>[] = [
      {
        name: 'Welcome New Patients',
        trigger: {
          type: 'patient_onboarded',
          conditions: {}
        },
        action: {
          type: 'send_message',
          templateId: 'welcome_message',
          priority: 'normal',
          recipients: { type: 'patient' }
        },
        isActive: true
      },
      {
        name: 'Daily Dosing Reminder',
        trigger: {
          type: 'dosing_reminder',
          conditions: { reminderType: 'daily' },
          schedule: {
            frequency: 'daily',
            time: '09:00'
          }
        },
        action: {
          type: 'send_message',
          templateId: 'daily_dosing_reminder',
          priority: 'normal',
          recipients: { type: 'patient' }
        },
        isActive: true
      },
      {
        name: 'Weekly Check-in',
        trigger: {
          type: 'weekly_checkin',
          conditions: {},
          schedule: {
            frequency: 'weekly',
            time: '10:00',
            daysOfWeek: [1] // Monday
          }
        },
        action: {
          type: 'send_message',
          templateId: 'weekly_checkin',
          priority: 'normal',
          recipients: { type: 'patient' }
        },
        isActive: true
      },
      {
        name: 'Weight Loss Milestone',
        trigger: {
          type: 'milestone_reached',
          conditions: { milestoneType: 'weight_loss', threshold: 5 }
        },
        action: {
          type: 'send_message',
          templateId: 'milestone_congratulations',
          priority: 'normal',
          recipients: { type: 'patient' }
        },
        isActive: true
      },
      {
        name: 'Inactive Patient Follow-up',
        trigger: {
          type: 'inactive_patient',
          conditions: { inactiveDays: 3 },
          schedule: {
            frequency: 'daily',
            time: '14:00'
          }
        },
        action: {
          type: 'send_message',
          templateId: 'inactive_followup',
          priority: 'high',
          recipients: { type: 'patient' }
        },
        isActive: true
      }
    ]

    for (const rule of defaultRules) {
      await this.createAutomationRule(rule)
    }
  }

  // Create automation rule
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          name: rule.name,
          trigger: rule.trigger,
          action: rule.action,
          is_active: rule.isActive,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error creating automation rule:', error)
      throw error
    }
  }

  // Get all automation rules
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(rule => ({
        id: rule.id,
        name: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        isActive: rule.is_active,
        createdAt: rule.created_at,
        lastExecuted: rule.last_executed
      })) || []
    } catch (error) {
      console.error('Error fetching automation rules:', error)
      return []
    }
  }

  // Execute automation based on trigger
  async executeAutomation(triggerType: AutomationTrigger['type'], context: Record<string, any>): Promise<void> {
    try {
      const rules = await this.getAutomationRules()
      const applicableRules = rules.filter(rule => 
        rule.isActive && 
        rule.trigger.type === triggerType &&
        this.evaluateConditions(rule.trigger.conditions, context)
      )

      for (const rule of applicableRules) {
        await this.executeRule(rule, context)
      }
    } catch (error) {
      console.error('Error executing automation:', error)
    }
  }

  // Execute specific automation rule
  private async executeRule(rule: AutomationRule, context: Record<string, any>): Promise<void> {
    try {
      switch (rule.action.type) {
        case 'send_message':
          await this.sendAutomatedMessage(rule, context)
          break
        case 'send_email':
          await this.sendAutomatedEmail(rule, context)
          break
        case 'create_alert':
          await this.createAutomatedAlert(rule, context)
          break
        default:
          console.warn(`Unknown automation action type: ${rule.action.type}`)
      }

      // Update last executed timestamp
      await supabase
        .from('automation_rules')
        .update({ last_executed: new Date().toISOString() })
        .eq('id', rule.id)

    } catch (error) {
      console.error(`Error executing rule ${rule.name}:`, error)
    }
  }

  // Send automated message
  private async sendAutomatedMessage(rule: AutomationRule, context: Record<string, any>): Promise<void> {
    let messageContent = rule.action.customMessage

    if (rule.action.templateId) {
      const template = await this.getMessageTemplate(rule.action.templateId)
      if (template) {
        messageContent = this.processTemplate(template.content, context)
      }
    }

    if (!messageContent) {
      console.error('No message content available for automation rule:', rule.name)
      return
    }

    // Determine recipients
    const recipients = await this.getRecipients(rule.action.recipients, context)

    for (const recipient of recipients) {
      await messagingService.sendMessage({
        conversationId: context.conversationId || await this.getOrCreateConversation(recipient.id, recipient.type),
        senderId: 'system',
        senderType: 'admin',
        content: messageContent,
        messageType: 'automated',
        priority: rule.action.priority
      })
    }
  }

  // Send automated email (placeholder for future email integration)
  private async sendAutomatedEmail(rule: AutomationRule, context: Record<string, any>): Promise<void> {
    console.log('Email automation not yet implemented:', rule.name)
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  }

  // Create automated alert
  private async createAutomatedAlert(rule: AutomationRule, context: Record<string, any>): Promise<void> {
    await supabase
      .from('alerts')
      .insert({
        type: 'automation',
        title: rule.name,
        message: rule.action.customMessage || `Automation rule "${rule.name}" triggered`,
        priority: rule.action.priority,
        patient_id: context.patientId,
        created_at: new Date().toISOString()
      })
  }

  // Process scheduled automations
  async processScheduledAutomations(): Promise<void> {
    try {
      const rules = await this.getAutomationRules()
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const currentDay = now.getDay()

      for (const rule of rules) {
        if (!rule.isActive || !rule.trigger.schedule) continue

        const schedule = rule.trigger.schedule
        let shouldExecute = false

        switch (schedule.frequency) {
          case 'daily':
            shouldExecute = schedule.time === currentTime
            break
          case 'weekly':
            shouldExecute = schedule.time === currentTime && 
                           schedule.daysOfWeek?.includes(currentDay)
            break
          case 'monthly':
            shouldExecute = schedule.time === currentTime && now.getDate() === 1
            break
        }

        if (shouldExecute) {
          // Get context based on rule type
          const context = await this.getContextForRule(rule)
          await this.executeRule(rule, context)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled automations:', error)
    }
  }

  // Get context for automation rule execution
  private async getContextForRule(rule: AutomationRule): Promise<Record<string, any>> {
    const context: Record<string, any> = {}

    switch (rule.trigger.type) {
      case 'dosing_reminder':
        // Get patients who need dosing reminders
        const { data: patients } = await supabase
          .from('patients')
          .select('*')
          .eq('status', 'active')
        
        context.patients = patients || []
        break

      case 'weekly_checkin':
        // Get active patients for weekly check-in
        const { data: activePatients } = await supabase
          .from('patients')
          .select('*')
          .eq('status', 'active')
        
        context.patients = activePatients || []
        break

      case 'inactive_patient':
        // Get patients who haven't logged activity recently
        const inactiveDays = rule.trigger.conditions.inactiveDays || 3
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)

        const { data: inactivePatients } = await supabase
          .from('patients')
          .select('*')
          .eq('status', 'active')
          .lt('last_activity_date', cutoffDate.toISOString())
        
        context.patients = inactivePatients || []
        break
    }

    return context
  }

  // Evaluate automation conditions
  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false
      }
    }
    return true
  }

  // Get recipients for automation
  private async getRecipients(recipients: AutomationAction['recipients'], context: Record<string, any>): Promise<Array<{id: string, type: 'patient' | 'admin'}>> {
    const result: Array<{id: string, type: 'patient' | 'admin'}> = []

    switch (recipients.type) {
      case 'patient':
        if (context.patientId) {
          result.push({ id: context.patientId, type: 'patient' })
        } else if (context.patients) {
          context.patients.forEach((patient: any) => {
            result.push({ id: patient.patient_id, type: 'patient' })
          })
        }
        break

      case 'admin':
        const { data: admins } = await supabase
          .from('admin_users')
          .select('admin_id')
          .eq('status', 'active')
        
        admins?.forEach(admin => {
          result.push({ id: admin.admin_id, type: 'admin' })
        })
        break

      case 'specific_users':
        if (recipients.userIds) {
          recipients.userIds.forEach(userId => {
            result.push({ id: userId, type: 'patient' }) // Assuming patient type
          })
        }
        break
    }

    return result
  }

  // Get or create conversation for automation
  private async getOrCreateConversation(userId: string, userType: 'patient' | 'admin'): Promise<string> {
    try {
      // Try to find existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [{ id: userId, type: userType }])
        .single()

      if (existingConv) {
        return existingConv.id
      }

      // Create new conversation
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          participants: [
            { id: userId, type: userType },
            { id: 'system', type: 'admin' }
          ],
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      return newConv?.id || ''
    } catch (error) {
      console.error('Error getting/creating conversation:', error)
      return ''
    }
  }

  // Message template management
  async createMessageTemplate(template: Omit<MessageTemplate, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          name: template.name,
          category: template.category,
          subject: template.subject,
          content: template.content,
          variables: template.variables,
          is_active: template.isActive
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error creating message template:', error)
      throw error
    }
  }

  async getMessageTemplate(templateId: string): Promise<MessageTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        subject: data.subject,
        content: data.content,
        variables: data.variables,
        isActive: data.is_active
      }
    } catch (error) {
      console.error('Error fetching message template:', error)
      return null
    }
  }

  async getMessageTemplates(): Promise<MessageTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (error) throw error

      return data?.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        isActive: template.is_active
      })) || []
    } catch (error) {
      console.error('Error fetching message templates:', error)
      return []
    }
  }

  // Process template variables
  private processTemplate(content: string, context: Record<string, any>): string {
    let processedContent = content

    // Replace common variables
    const variables = {
      '{{patientName}}': context.patientName || context.patient?.first_name || 'there',
      '{{currentWeek}}': context.currentWeek || context.patient?.current_week || '1',
      '{{peptideType}}': context.peptideType || context.patient?.peptide_type || 'your peptide',
      '{{currentWeight}}': context.currentWeight || context.patient?.current_weight || 'your current weight',
      '{{startWeight}}': context.startWeight || context.patient?.start_weight || 'your starting weight',
      '{{adminName}}': 'Your Results Pro Team',
      '{{date}}': new Date().toLocaleDateString(),
      '{{time}}': new Date().toLocaleTimeString()
    }

    for (const [variable, value] of Object.entries(variables)) {
      processedContent = processedContent.replace(new RegExp(variable, 'g'), String(value))
    }

    return processedContent
  }

  // Initialize default message templates
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates: Omit<MessageTemplate, 'id'>[] = [
      {
        name: 'Welcome Message',
        category: 'onboarding',
        content: `Welcome to Results Pro, {{patientName}}! 🎉

I'm here to support you throughout your {{peptideType}} journey. You can message me anytime with questions about:

• Dosing and injection techniques
• Side effects or concerns
• Progress tracking
• General support

Your success is our priority. Let's achieve amazing results together!`,
        variables: ['patientName', 'peptideType'],
        isActive: true
      },
      {
        name: 'Daily Dosing Reminder',
        category: 'dosing',
        content: `Hi {{patientName}}! 💊

This is your daily reminder to take your {{peptideType}} dose. Remember to:

• Follow your personalized dosing schedule
• Rotate injection sites
• Log your dose in the app

You're doing great - keep up the excellent work! 💪`,
        variables: ['patientName', 'peptideType'],
        isActive: true
      },
      {
        name: 'Weekly Check-in',
        category: 'engagement',
        content: `Hi {{patientName}}! 📊

How are you feeling this week? I'd love to hear about:

• Any changes in your weight or measurements
• How you're feeling overall
• Any questions or concerns
• Your energy levels and mood

Remember, I'm here to support you every step of the way!`,
        variables: ['patientName'],
        isActive: true
      },
      {
        name: 'Milestone Congratulations',
        category: 'motivation',
        content: `🎉 AMAZING NEWS, {{patientName}}! 🎉

You've reached an incredible milestone in your journey! Your dedication and consistency are truly paying off.

Keep up the fantastic work - you're proving that sustainable results are absolutely achievable. I'm so proud of your progress!

What's your next goal? I'm here to help you reach it! 💪✨`,
        variables: ['patientName'],
        isActive: true
      },
      {
        name: 'Inactive Follow-up',
        category: 'engagement',
        content: `Hi {{patientName}}, 👋

I noticed you haven't logged in recently, and I wanted to check in with you. Sometimes life gets busy - I totally understand!

Is there anything I can help you with to get back on track? Whether it's:

• Technical support with the app
• Questions about your program  
• Adjusting your schedule
• Just need some motivation

I'm here for you. Your success matters to me! 💙`,
        variables: ['patientName'],
        isActive: true
      }
    ]

    for (const template of defaultTemplates) {
      await this.createMessageTemplate(template)
    }
  }
}

export const automationService = new AutomationService()
