import { supabase } from './supabase'
import type { MessageTemplate, TemplateCategory, MessagingApiResponse, PaginatedResponse } from '@/types/admin-chat'

class TemplateService {
  // Get all templates for an admin
  async getTemplates(
    adminId?: string,
    category?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagingApiResponse<MessageTemplate[]>> {
    try {
      // For now, return mock templates until we have Supabase table set up
      const mockTemplates: MessageTemplate[] = [
        {
          id: 'template-001',
          admin_id: 'admin-001',
          title: 'Welcome Message',
          content: 'Welcome to our peptide therapy program! I\'m here to support you throughout your journey. Please don\'t hesitate to reach out with any questions or concerns.',
          category: 'onboarding',
          is_global: true,
          usage_count: 45,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'template-002',
          admin_id: 'admin-001',
          title: 'Dosing Reminder',
          content: 'This is a friendly reminder to take your medication as prescribed. Remember to inject at the same time each day and rotate injection sites. Let me know if you have any questions!',
          category: 'dosing',
          is_global: true,
          usage_count: 89,
          created_at: '2024-01-15T10:05:00Z'
        },
        {
          id: 'template-003',
          admin_id: 'admin-001',
          title: 'Safety Check-in',
          content: 'I wanted to check in on how you\'re feeling. Are you experiencing any side effects or concerns? Your safety is our top priority, so please let me know if anything feels unusual.',
          category: 'safety',
          is_global: true,
          usage_count: 67,
          created_at: '2024-01-15T10:10:00Z'
        },
        {
          id: 'template-004',
          admin_id: 'admin-001',
          title: 'Progress Celebration',
          content: 'Congratulations on your progress! Your dedication to the program is really showing results. Keep up the great work and remember that I\'m here to support you every step of the way.',
          category: 'progress',
          is_global: true,
          usage_count: 34,
          created_at: '2024-01-15T10:15:00Z'
        },
        {
          id: 'template-005',
          admin_id: 'admin-001',
          title: 'Weekly Check-in',
          content: 'How has your week been going? I\'d love to hear about your progress, any challenges you\'ve faced, and how you\'re feeling overall. Your feedback helps me provide better support.',
          category: 'general',
          is_global: true,
          usage_count: 56,
          created_at: '2024-01-15T10:20:00Z'
        },
        {
          id: 'template-006',
          admin_id: 'admin-001',
          title: 'Missed Dose Follow-up',
          content: 'I noticed you may have missed your dose yesterday. No worries - it happens! Please take your next dose as scheduled and let me know if you need any reminders or support with your routine.',
          category: 'dosing',
          is_global: false,
          usage_count: 23,
          created_at: '2024-01-15T10:25:00Z'
        },
        {
          id: 'template-007',
          admin_id: 'admin-001',
          title: 'Side Effect Support',
          content: 'Thank you for reporting your side effects. This information is valuable for your care. The symptoms you\'re experiencing are [common/manageable]. Here are some tips that may help: [specific advice].',
          category: 'safety',
          is_global: false,
          usage_count: 12,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 'template-008',
          admin_id: 'admin-001',
          title: 'Appointment Reminder',
          content: 'This is a reminder about your upcoming appointment on [DATE] at [TIME]. Please bring your medication log and any questions you\'d like to discuss. Looking forward to seeing you!',
          category: 'appointments',
          is_global: true,
          usage_count: 78,
          created_at: '2024-01-15T10:35:00Z'
        }
      ]

      // Apply filters
      let filteredTemplates = mockTemplates
      
      if (adminId) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.admin_id === adminId || t.is_global
        )
      }
      
      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category)
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex)

      return {
        success: true,
        data: paginatedTemplates
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      }
    }
  }

  // Get templates organized by category
  async getTemplatesByCategory(adminId?: string): Promise<MessagingApiResponse<TemplateCategory[]>> {
    try {
      const templatesResult = await this.getTemplates(adminId)
      
      if (!templatesResult.success || !templatesResult.data) {
        return {
          success: false,
          error: 'Failed to fetch templates'
        }
      }

      // Group templates by category
      const categoriesMap = new Map<string, MessageTemplate[]>()
      
      templatesResult.data.forEach(template => {
        const category = template.category
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, [])
        }
        categoriesMap.get(category)!.push(template)
      })

      // Convert to TemplateCategory array
      const categories: TemplateCategory[] = Array.from(categoriesMap.entries()).map(([name, templates]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        templates: templates.sort((a, b) => b.usage_count - a.usage_count) // Sort by usage
      }))

      return {
        success: true,
        data: categories.sort((a, b) => a.name.localeCompare(b.name))
      }
    } catch (error) {
      console.error('Error organizing templates by category:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to organize templates'
      }
    }
  }

  // Create a new template
  async createTemplate(
    adminId: string,
    title: string,
    content: string,
    category: string,
    isGlobal: boolean = false
  ): Promise<MessagingApiResponse<MessageTemplate>> {
    try {
      // In a real implementation, this would create a new template in Supabase
      const newTemplate: MessageTemplate = {
        id: `template-${Date.now()}`,
        admin_id: adminId,
        title,
        content,
        category,
        is_global: isGlobal,
        usage_count: 0,
        created_at: new Date().toISOString()
      }

      console.log('Creating new template:', newTemplate)

      return {
        success: true,
        data: newTemplate,
        message: 'Template created successfully'
      }
    } catch (error) {
      console.error('Error creating template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      }
    }
  }

  // Update an existing template
  async updateTemplate(
    templateId: string,
    updates: Partial<Pick<MessageTemplate, 'title' | 'content' | 'category' | 'is_global'>>
  ): Promise<MessagingApiResponse<MessageTemplate>> {
    try {
      // In a real implementation, this would update the template in Supabase
      console.log('Updating template:', templateId, updates)

      return {
        success: true,
        message: 'Template updated successfully'
      }
    } catch (error) {
      console.error('Error updating template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template'
      }
    }
  }

  // Delete a template
  async deleteTemplate(templateId: string): Promise<MessagingApiResponse> {
    try {
      // In a real implementation, this would delete the template from Supabase
      console.log('Deleting template:', templateId)

      return {
        success: true,
        message: 'Template deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template'
      }
    }
  }

  // Record template usage (for analytics)
  async recordTemplateUsage(templateId: string): Promise<MessagingApiResponse> {
    try {
      // In a real implementation, this would increment the usage_count in Supabase
      console.log('Recording template usage:', templateId)

      return {
        success: true,
        message: 'Template usage recorded'
      }
    } catch (error) {
      console.error('Error recording template usage:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record template usage'
      }
    }
  }

  // Get quick replies (frequently used short templates)
  async getQuickReplies(adminId?: string): Promise<MessagingApiResponse<MessageTemplate[]>> {
    try {
      const quickReplies: MessageTemplate[] = [
        {
          id: 'quick-001',
          admin_id: 'admin-001',
          title: 'Thank you',
          content: 'Thank you for the update!',
          category: 'quick-reply',
          is_global: true,
          usage_count: 234,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'quick-002',
          admin_id: 'admin-001',
          title: 'Will follow up',
          content: 'I\'ll follow up with you soon on this.',
          category: 'quick-reply',
          is_global: true,
          usage_count: 156,
          created_at: '2024-01-15T10:05:00Z'
        },
        {
          id: 'quick-003',
          admin_id: 'admin-001',
          title: 'Great progress',
          content: 'That\'s great progress! Keep it up!',
          category: 'quick-reply',
          is_global: true,
          usage_count: 189,
          created_at: '2024-01-15T10:10:00Z'
        },
        {
          id: 'quick-004',
          admin_id: 'admin-001',
          title: 'Need more info',
          content: 'Could you provide a bit more detail about this?',
          category: 'quick-reply',
          is_global: true,
          usage_count: 98,
          created_at: '2024-01-15T10:15:00Z'
        },
        {
          id: 'quick-005',
          admin_id: 'admin-001',
          title: 'Schedule call',
          content: 'Let\'s schedule a quick call to discuss this further.',
          category: 'quick-reply',
          is_global: true,
          usage_count: 67,
          created_at: '2024-01-15T10:20:00Z'
        }
      ]

      return {
        success: true,
        data: quickReplies.sort((a, b) => b.usage_count - a.usage_count)
      }
    } catch (error) {
      console.error('Error fetching quick replies:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch quick replies'
      }
    }
  }

  // Search templates
  async searchTemplates(
    query: string,
    adminId?: string,
    category?: string
  ): Promise<MessagingApiResponse<MessageTemplate[]>> {
    try {
      const templatesResult = await this.getTemplates(adminId, category)
      
      if (!templatesResult.success || !templatesResult.data) {
        return {
          success: false,
          error: 'Failed to search templates'
        }
      }

      const searchResults = templatesResult.data.filter(template =>
        template.title.toLowerCase().includes(query.toLowerCase()) ||
        template.content.toLowerCase().includes(query.toLowerCase())
      )

      return {
        success: true,
        data: searchResults
      }
    } catch (error) {
      console.error('Error searching templates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search templates'
      }
    }
  }
}

export const templateService = new TemplateService()
export default TemplateService
