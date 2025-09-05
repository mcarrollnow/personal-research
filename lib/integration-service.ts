import { supabase } from './supabase'

export interface SafetyAlert {
  id: string
  patientId: string
  severity: 'mild' | 'moderate' | 'severe'
  sideEffects: string[]
  reportedAt: string
  escalated: boolean
  adminNotified: boolean
  status: 'active' | 'resolved' | 'monitoring'
}

export interface ProgressMilestone {
  id: string
  patientId: string
  type: 'weight_loss' | 'goal_achievement' | 'week_completion' | 'compliance_streak'
  value: number
  target: number
  achievedAt: string
  celebrated: boolean
  message?: string
}

export interface ComplianceAlert {
  id: string
  patientId: string
  type: 'missed_dose' | 'incomplete_log' | 'low_compliance'
  daysCount: number
  lastActivity: string
  followUpSent: boolean
  status: 'pending' | 'addressed' | 'resolved'
}

class IntegrationService {

  // ============================================
  // SAFETY INTEGRATION - Uses existing messages table
  // ============================================

  async processSafetyReport(
    patientId: string, 
    sideEffects: string[], 
    severity: 'mild' | 'moderate' | 'severe'
  ): Promise<SafetyAlert> {
    const alertId = `safety_${Date.now()}_${patientId}`
    
    const safetyAlert: SafetyAlert = {
      id: alertId,
      patientId,
      severity,
      sideEffects,
      reportedAt: new Date().toISOString(),
      escalated: severity === 'severe',
      adminNotified: false,
      status: severity === 'severe' ? 'active' : 'monitoring'
    }

    // Store safety alert as message in your existing messages table
    const conversationId = crypto.randomUUID()
    const alertMessage = `🚨 SAFETY ALERT: ${severity.toUpperCase()}\n\nSide Effects: ${sideEffects.join(', ')}\n\nReported: ${new Date().toLocaleString()}\n\nSeverity: ${severity}`

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        from_user_id: patientId,
        to_user_id: 'ADMIN-001', // Your existing admin ID
        content: alertMessage,
        message_type: 'safety',
        priority: severity === 'severe' ? 'urgent' : severity === 'moderate' ? 'high' : 'normal'
      })

    if (error) {
      console.error('Error storing safety alert:', error)
      throw new Error(`Failed to store safety alert: ${error.message}`)
    }

    // Auto-escalate severe side effects to all admins
    if (severity === 'severe') {
      await this.escalateSafetyAlert(safetyAlert, alertMessage)
    }

    return safetyAlert
  }

  private async escalateSafetyAlert(alert: SafetyAlert, alertMessage: string): Promise<void> {
    // Send urgent message to all admins using your existing admin_users table
    const { data: admins } = await supabase
      .from('admin_users')
      .select('admin_id, name, email')
      .eq('active_status', true)

    if (admins) {
      for (const admin of admins) {
        const urgentMessage = `🚨 URGENT: ${alertMessage}\n\n⚠️ IMMEDIATE ATTENTION REQUIRED ⚠️`
        
        const conversationId = crypto.randomUUID()
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          from_user_id: 'SYSTEM',
          to_user_id: admin.admin_id,
          content: urgentMessage,
          message_type: 'urgent',
          priority: 'urgent'
        })

        console.log(`🚨 URGENT: Severe side effect alert sent to admin: ${admin.name}`)
      }
    }

    console.log(`Safety alert ${alert.id} escalated successfully`)
  }

  // ============================================
  // PROGRESS INTEGRATION - Uses existing messages table
  // ============================================

  async checkProgressMilestones(patientId: string, currentWeight: number, weekNumber: number): Promise<ProgressMilestone[]> {
    const milestones: ProgressMilestone[] = []

    // Mock patient data (you can replace with Google Sheets data later)
    const patientData = {
      starting_weight: 190,
      target_weight: 160,
      goals: []
    }

    const weightLoss = patientData.starting_weight - currentWeight
    const progressPercent = (weightLoss / (patientData.starting_weight - patientData.target_weight)) * 100

    // Check weight loss milestones (5 lbs, 10 lbs, 15 lbs, etc.)
    const weightMilestones = [5, 10, 15, 20, 25, 30]
    for (const milestone of weightMilestones) {
      if (weightLoss >= milestone) {
        const celebrationMessage = `🎉 Congratulations! You've lost ${milestone} pounds! That's incredible progress on your health journey. Keep up the amazing work!`
        
        // Send celebration message using your existing messages table
        const conversationId = crypto.randomUUID()
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          from_user_id: 'ADMIN-001',
          to_user_id: patientId,
          content: celebrationMessage,
          message_type: 'progress',
          priority: 'normal'
        })
        
        const newMilestone: ProgressMilestone = {
          id: `milestone_${Date.now()}_${patientId}`,
          patientId,
          type: 'weight_loss',
          value: milestone,
          target: milestone,
          achievedAt: new Date().toISOString(),
          celebrated: true,
          message: celebrationMessage
        }
        milestones.push(newMilestone)
      }
    }

    // Check week completion milestones
    const weekMilestones = [4, 8, 12, 16, 20, 24]
    for (const milestone of weekMilestones) {
      if (weekNumber >= milestone) {
        const celebrationMessage = `🏆 Amazing! You've completed ${milestone} weeks of your program! Your dedication and consistency are truly inspiring. You're ${Math.round(progressPercent)}% of the way to your goal!`
        
        // Send celebration message
        const conversationId = crypto.randomUUID()
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          from_user_id: 'ADMIN-001',
          to_user_id: patientId,
          content: celebrationMessage,
          message_type: 'progress',
          priority: 'normal'
        })
        
        const newMilestone: ProgressMilestone = {
          id: `milestone_${Date.now()}_${patientId}`,
          patientId,
          type: 'week_completion',
          value: milestone,
          target: milestone,
          achievedAt: new Date().toISOString(),
          celebrated: true,
          message: celebrationMessage
        }
        milestones.push(newMilestone)
      }
    }

    // Check goal achievement milestones (25%, 50%, 75%, 100%)
    const goalMilestones = [25, 50, 75, 100]
    for (const milestone of goalMilestones) {
      if (progressPercent >= milestone) {
        let message = `🎯 You've reached ${milestone}% of your weight loss goal! `
        if (milestone === 100) {
          message = `🎊 GOAL ACHIEVED! You've reached 100% of your weight loss target! This is a monumental achievement that shows your incredible dedication and perseverance!`
        } else if (milestone === 75) {
          message += `You're in the final stretch - amazing work!`
        } else if (milestone === 50) {
          message += `You're halfway there - fantastic progress!`
        } else {
          message += `You're off to a great start!`
        }
        
        // Send celebration message
        const conversationId = crypto.randomUUID()
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          from_user_id: 'ADMIN-001',
          to_user_id: patientId,
          content: message,
          message_type: 'progress',
          priority: 'normal'
        })
        
        const newMilestone: ProgressMilestone = {
          id: `milestone_${Date.now()}_${patientId}`,
          patientId,
          type: 'goal_achievement',
          value: milestone,
          target: 100,
          achievedAt: new Date().toISOString(),
          celebrated: true,
          message: message
        }
        milestones.push(newMilestone)
      }
    }

    // Notify admins of all new milestones
    for (const milestone of milestones) {
      await this.notifyAdminOfMilestone(milestone)
    }

    return milestones
  }

  private async notifyAdminOfMilestone(milestone: ProgressMilestone): Promise<void> {
    // Send admin notification via your existing messages table
    const adminMessage = `🎉 Patient Achievement!\n\nPatient ${milestone.patientId} just reached a milestone:\n${milestone.type.replace('_', ' ').toUpperCase()}: ${milestone.value}\n\nThey've been sent a celebration message. Consider reaching out with additional encouragement!`

    const conversationId = crypto.randomUUID()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      from_user_id: 'SYSTEM',
      to_user_id: 'ADMIN-001',
      content: adminMessage,
      message_type: 'general',
      priority: 'normal'
    })
  }

  // ============================================
  // COMPLIANCE INTEGRATION - Uses existing messages table
  // ============================================

  async checkComplianceAlerts(patientId: string): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = []

    // Mock compliance check (you can integrate with Google Sheets later)
    const mockMissedDoses = Math.random() > 0.7 // 30% chance of missed doses
    const mockIncompleteLogs = Math.random() > 0.8 // 20% chance of incomplete logs
    
    if (mockMissedDoses) {
      const alert: ComplianceAlert = {
        id: `compliance_${Date.now()}_missed_dose`,
        patientId,
        type: 'missed_dose',
        daysCount: 2,
        lastActivity: new Date().toISOString(),
        followUpSent: false,
        status: 'pending'
      }
      alerts.push(alert)
    }

    if (mockIncompleteLogs) {
      const alert: ComplianceAlert = {
        id: `compliance_${Date.now()}_incomplete_log`,
        patientId,
        type: 'incomplete_log',
        daysCount: 3,
        lastActivity: new Date().toISOString(),
        followUpSent: false,
        status: 'pending'
      }
      alerts.push(alert)
    }

    // Send follow-up messages for new alerts
    for (const alert of alerts) {
      await this.sendComplianceFollowUp(alert)
    }

    return alerts
  }

  private async sendComplianceFollowUp(alert: ComplianceAlert): Promise<void> {
    let message = ''
    
    switch (alert.type) {
      case 'missed_dose':
        message = `Hi! 👋\n\nI noticed you haven't logged your doses for the past ${alert.daysCount} days. Consistent dosing is really important for getting the best results from your program.\n\nIs everything okay? If you're having any issues or concerns, please let me know. I'm here to help! 💪\n\nRemember, you can log your doses anytime in the app. Even if you missed a dose, it's helpful for us to know.`
        break
      
      case 'incomplete_log':
        message = `Hi! 📊\n\nI see you haven't been logging your daily measurements lately. Your progress tracking is so important - it helps us see how well you're doing and make any needed adjustments.\n\nCould you take a few minutes to update your weight and measurements? It only takes a minute and really helps us support you better!\n\nIf you're having trouble with the logging process, just let me know and I'll walk you through it. 😊`
        break
      
      case 'low_compliance':
        message = `Hi! 🎯\n\nI wanted to check in with you about your program tracking. I noticed your logging has been a bit inconsistent lately, and I want to make sure you're getting the full benefit of your program.\n\nConsistent tracking really helps us:\n• Monitor your amazing progress\n• Adjust your plan if needed\n• Celebrate your wins!\n\nIs there anything making it difficult to log daily? I'm here to help make this as easy as possible for you. Your success is our priority! 💪`
        break
    }

    // Send follow-up message to patient using your existing messages table
    const conversationId = crypto.randomUUID()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      from_user_id: 'ADMIN-001',
      to_user_id: alert.patientId,
      content: message,
      message_type: 'general',
      priority: 'normal'
    })

    // Notify admin about the compliance issue
    const adminMessage = `📊 Compliance Alert\n\nPatient: ${alert.patientId}\nIssue: ${alert.type.replace('_', ' ').toUpperCase()}\nDays: ${alert.daysCount}\n\nA follow-up message has been sent to the patient. Please monitor their response and consider additional outreach if needed.`

    const adminConversationId = crypto.randomUUID()
    await supabase.from('messages').insert({
      conversation_id: adminConversationId,
      from_user_id: 'SYSTEM',
      to_user_id: 'ADMIN-001',
      content: adminMessage,
      message_type: 'general',
      priority: 'normal'
    })

    console.log(`Compliance follow-up sent for alert ${alert.id}`)
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  // Get compliance rate for patient (mock data for now)
  async getComplianceRate(patientId: string, days: number = 30): Promise<number> {
    // Return a realistic mock compliance rate
    return Math.floor(Math.random() * 30) + 70 // 70-100%
  }

  // Initialize integration service
  async initializeIntegrationTables(): Promise<void> {
    console.log('Integration service initialized - using existing Supabase messages table')
  }
}

export const integrationService = new IntegrationService()
