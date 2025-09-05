import { supabase } from './supabase'

export interface MessageAnalytics {
  totalMessages: number
  averageResponseTime: number // in minutes
  responseRate: number // percentage
  urgentMessages: number
  resolvedConversations: number
  activeConversations: number
}

export interface PatientEngagement {
  patientId: string
  patientName: string
  messageCount: number
  lastMessageDate: string
  engagementScore: number // 0-100
  responseRate: number
  averageResponseTime: number
}

export interface SupportWorkload {
  adminId: string
  adminName: string
  messagesHandled: number
  averageResponseTime: number
  activeConversations: number
  workloadScore: number // 0-100
}

export interface CommonQuestions {
  category: string
  question: string
  frequency: number
  averageResponseTime: number
  suggestedTemplate?: string
}

export interface AnalyticsPeriod {
  period: '24h' | '7d' | '30d' | '90d'
  startDate: Date
  endDate: Date
}

class AnalyticsService {
  
  // Get overall message analytics for a time period
  async getMessageAnalytics(period: AnalyticsPeriod): Promise<MessageAnalytics> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          created_at,
          message_type,
          priority,
          conversations!inner (
            status,
            participants
          )
        `)
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())

      if (error) throw error

      const totalMessages = messages?.length || 0
      const urgentMessages = messages?.filter(m => m.priority === 'urgent').length || 0
      
      // Calculate response times by looking at message pairs
      const responseTimes: number[] = []
      const conversationMap = new Map()
      
      messages?.forEach(msg => {
        const convId = msg.conversations?.id
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, [])
        }
        conversationMap.get(convId).push(msg)
      })

      // Calculate response times between patient and admin messages
      conversationMap.forEach(msgs => {
        msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        
        for (let i = 0; i < msgs.length - 1; i++) {
          const current = msgs[i]
          const next = msgs[i + 1]
          
          // If patient message followed by admin message
          if (current.sender_type === 'patient' && next.sender_type === 'admin') {
            const responseTime = (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) / (1000 * 60)
            responseTimes.push(responseTime)
          }
        }
      })

      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0

      const responseRate = totalMessages > 0 ? (responseTimes.length / totalMessages) * 100 : 0

      // Get conversation status counts
      const { data: conversations } = await supabase
        .from('conversations')
        .select('status')
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())

      const resolvedConversations = conversations?.filter(c => c.status === 'closed').length || 0
      const activeConversations = conversations?.filter(c => c.status === 'active').length || 0

      return {
        totalMessages,
        averageResponseTime: Math.round(averageResponseTime),
        responseRate: Math.round(responseRate),
        urgentMessages,
        resolvedConversations,
        activeConversations
      }
    } catch (error) {
      console.error('Error fetching message analytics:', error)
      return {
        totalMessages: 0,
        averageResponseTime: 0,
        responseRate: 0,
        urgentMessages: 0,
        resolvedConversations: 0,
        activeConversations: 0
      }
    }
  }

  // Get patient engagement metrics
  async getPatientEngagement(period: AnalyticsPeriod): Promise<PatientEngagement[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participants,
          created_at,
          last_message_at,
          messages (
            id,
            created_at,
            sender_type,
            priority
          )
        `)
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())

      if (error) throw error

      // Get patient data
      const { data: patients } = await supabase
        .from('patients')
        .select('patient_id, first_name, last_name, email')

      const patientMap = new Map()
      patients?.forEach(p => {
        patientMap.set(p.patient_id, `${p.first_name} ${p.last_name}`)
      })

      const engagementMap = new Map()

      conversations?.forEach(conv => {
        const patientId = conv.participants?.find(p => p.type === 'patient')?.id
        if (!patientId) return

        if (!engagementMap.has(patientId)) {
          engagementMap.set(patientId, {
            patientId,
            patientName: patientMap.get(patientId) || 'Unknown Patient',
            messageCount: 0,
            lastMessageDate: conv.last_message_at,
            patientMessages: 0,
            adminResponses: 0,
            responseTimes: []
          })
        }

        const engagement = engagementMap.get(patientId)
        engagement.messageCount += conv.messages?.length || 0
        
        if (new Date(conv.last_message_at) > new Date(engagement.lastMessageDate)) {
          engagement.lastMessageDate = conv.last_message_at
        }

        // Calculate response metrics
        const messages = conv.messages || []
        messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        for (let i = 0; i < messages.length - 1; i++) {
          if (messages[i].sender_type === 'patient') {
            engagement.patientMessages++
            if (messages[i + 1]?.sender_type === 'admin') {
              engagement.adminResponses++
              const responseTime = (new Date(messages[i + 1].created_at).getTime() - new Date(messages[i].created_at).getTime()) / (1000 * 60)
              engagement.responseTimes.push(responseTime)
            }
          }
        }
      })

      return Array.from(engagementMap.values()).map(eng => ({
        patientId: eng.patientId,
        patientName: eng.patientName,
        messageCount: eng.messageCount,
        lastMessageDate: eng.lastMessageDate,
        engagementScore: Math.min(100, Math.round((eng.messageCount / 10) * 100)), // Score based on message activity
        responseRate: eng.patientMessages > 0 ? Math.round((eng.adminResponses / eng.patientMessages) * 100) : 0,
        averageResponseTime: eng.responseTimes.length > 0 
          ? Math.round(eng.responseTimes.reduce((sum, time) => sum + time, 0) / eng.responseTimes.length)
          : 0
      }))
    } catch (error) {
      console.error('Error fetching patient engagement:', error)
      return []
    }
  }

  // Get support workload analysis
  async getSupportWorkload(period: AnalyticsPeriod): Promise<SupportWorkload[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          created_at,
          conversations!inner (
            id,
            participants
          )
        `)
        .eq('sender_type', 'admin')
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())

      if (error) throw error

      // Get admin data
      const { data: admins } = await supabase
        .from('admin_users')
        .select('admin_id, first_name, last_name')

      const adminMap = new Map()
      admins?.forEach(a => {
        adminMap.set(a.admin_id, `${a.first_name} ${a.last_name}`)
      })

      const workloadMap = new Map()

      messages?.forEach(msg => {
        const adminId = msg.sender_id
        if (!workloadMap.has(adminId)) {
          workloadMap.set(adminId, {
            adminId,
            adminName: adminMap.get(adminId) || 'Unknown Admin',
            messagesHandled: 0,
            conversations: new Set(),
            responseTimes: []
          })
        }

        const workload = workloadMap.get(adminId)
        workload.messagesHandled++
        workload.conversations.add(msg.conversations.id)
      })

      // Calculate response times for each admin
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())
        .order('created_at', { ascending: true })

      const conversationMessages = new Map()
      allMessages?.forEach(msg => {
        if (!conversationMessages.has(msg.conversation_id)) {
          conversationMessages.set(msg.conversation_id, [])
        }
        conversationMessages.get(msg.conversation_id).push(msg)
      })

      conversationMessages.forEach(msgs => {
        for (let i = 0; i < msgs.length - 1; i++) {
          const current = msgs[i]
          const next = msgs[i + 1]
          
          if (current.sender_type === 'patient' && next.sender_type === 'admin') {
            const adminId = next.sender_id
            const responseTime = (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) / (1000 * 60)
            
            if (workloadMap.has(adminId)) {
              workloadMap.get(adminId).responseTimes.push(responseTime)
            }
          }
        }
      })

      return Array.from(workloadMap.values()).map(wl => ({
        adminId: wl.adminId,
        adminName: wl.adminName,
        messagesHandled: wl.messagesHandled,
        averageResponseTime: wl.responseTimes.length > 0 
          ? Math.round(wl.responseTimes.reduce((sum, time) => sum + time, 0) / wl.responseTimes.length)
          : 0,
        activeConversations: wl.conversations.size,
        workloadScore: Math.min(100, Math.round((wl.messagesHandled / 50) * 100)) // Score based on message volume
      }))
    } catch (error) {
      console.error('Error fetching support workload:', error)
      return []
    }
  }

  // Analyze common questions and topics
  async getCommonQuestions(period: AnalyticsPeriod): Promise<CommonQuestions[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('content, message_type, created_at')
        .eq('sender_type', 'patient')
        .gte('created_at', period.startDate.toISOString())
        .lte('created_at', period.endDate.toISOString())

      if (error) throw error

      // Simple keyword-based categorization
      const categories = {
        dosing: ['dose', 'dosing', 'injection', 'syringe', 'amount', 'how much', 'when to take'],
        side_effects: ['side effect', 'nausea', 'headache', 'dizzy', 'sick', 'reaction', 'feel bad'],
        progress: ['weight', 'progress', 'results', 'working', 'losing', 'gained'],
        technical: ['app', 'login', 'website', 'technical', 'bug', 'error', 'not working'],
        general: ['question', 'help', 'support', 'information', 'clarification']
      }

      const questionCounts = new Map()
      
      messages?.forEach(msg => {
        const content = msg.content.toLowerCase()
        let category = 'general'
        
        // Categorize message
        for (const [cat, keywords] of Object.entries(categories)) {
          if (keywords.some(keyword => content.includes(keyword))) {
            category = cat
            break
          }
        }

        const key = `${category}:${msg.message_type || 'general'}`
        if (!questionCounts.has(key)) {
          questionCounts.set(key, {
            category,
            question: msg.message_type || 'General inquiry',
            frequency: 0,
            totalResponseTime: 0,
            responseCount: 0
          })
        }
        
        questionCounts.get(key).frequency++
      })

      // Convert to array and sort by frequency
      return Array.from(questionCounts.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10) // Top 10 most common
        .map(item => ({
          category: item.category,
          question: item.question,
          frequency: item.frequency,
          averageResponseTime: item.responseCount > 0 
            ? Math.round(item.totalResponseTime / item.responseCount)
            : 0,
          suggestedTemplate: this.getSuggestedTemplate(item.category)
        }))
    } catch (error) {
      console.error('Error fetching common questions:', error)
      return []
    }
  }

  private getSuggestedTemplate(category: string): string {
    const templates = {
      dosing: "Thank you for your dosing question. Please refer to your personalized dosing schedule in the app. If you need clarification, I'm here to help.",
      side_effects: "I understand you're experiencing some side effects. Please describe your symptoms in detail so I can provide appropriate guidance.",
      progress: "Great question about your progress! Let's review your recent data and discuss your results.",
      technical: "I'll help you with this technical issue. Let me walk you through the solution step by step.",
      general: "Thank you for reaching out. I'm here to support you throughout your journey."
    }
    return templates[category] || templates.general
  }

  // Get analytics for specific time periods
  getPeriod(periodType: '24h' | '7d' | '30d' | '90d'): AnalyticsPeriod {
    const endDate = new Date()
    const startDate = new Date()

    switch (periodType) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    return { period: periodType, startDate, endDate }
  }
}

export const analyticsService = new AnalyticsService()
