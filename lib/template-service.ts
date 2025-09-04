import { supabase } from './supabase'
import { MessageTemplate, TemplateCategory, MessagingApiResponse, PaginatedResponse } from '../types/admin-chat'

class TemplateService {
  // Template CRUD Operations
  async getTemplates(
    adminId?: string,
    category?: string,
    includeGlobal: boolean = true,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagingApiResponse<PaginatedResponse<MessageTemplate>>> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*', { count: 'exact' })

      // Filter by admin or include global templates
      if (adminId && includeGlobal) {
        query = query.or(`admin_id.eq.${adminId},is_global.eq.true`)
      } else if (adminId) {
        query = query.eq('admin_id', adminId)
      } else if (includeGlobal) {
        query = query.eq('is_global', true)
      }

      // Filter by category
      if (category) {
        query = query.eq('category', category)
      }

      const offset = (page - 1) * limit
      const { data: templates, error, count } = await query
        .order('usage_count', { ascending: false })
        .order('title', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        data: {
          data: templates as MessageTemplate[],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      }
    }
  }

  async getTemplatesByCategory(
    adminId?: string,
    includeGlobal: boolean = true
  ): Promise<MessagingApiResponse<TemplateCategory[]>> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')

      // Filter by admin or include global templates
      if (adminId && includeGlobal) {
        query = query.or(`admin_id.eq.${adminId},is_global.eq.true`)
      } else if (adminId) {
        query = query.eq('admin_id', adminId)
      } else if (includeGlobal) {
        query = query.eq('is_global', true)
      }

      const { data: templates, error } = await query
        .order('category', { ascending: true })
        .order('usage_count', { ascending: false })

      if (error) throw error

      // Group templates by category
      const categorizedTemplates: { [key: string]: MessageTemplate[] } = {}
      templates?.forEach((template: MessageTemplate) => {
        if (!categorizedTemplates[template.category]) {
          categorizedTemplates[template.category] = []
        }
        categorizedTemplates[template.category].push(template)
      })

      const categories: TemplateCategory[] = Object.keys(categorizedTemplates).map(categoryName => ({
        name: categoryName,
        templates: categorizedTemplates[categoryName]
      }))

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      console.error('Error fetching templates by category:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates by category'
      }
    }
  }

  async createTemplate(templateData: {
    admin_id: string
    title: string
    content: string
    category: string
    is_global?: boolean
  }): Promise<MessagingApiResponse<MessageTemplate>> {
    try {
      const { data: template, error } = await supabase
        .from('message_templates')
        .insert({
          admin_id: templateData.admin_id,
          title: templateData.title,
          content: templateData.content,
          category: templateData.category,
          is_global: templateData.is_global || false,
          usage_count: 0
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: template as MessageTemplate,
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

  async updateTemplate(
    templateId: string,
    updates: Partial<MessageTemplate>
  ): Promise<MessagingApiResponse<MessageTemplate>> {
    try {
      const { data: template, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: template as MessageTemplate,
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

  async deleteTemplate(templateId: string): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

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

  async incrementUsageCount(templateId: string): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('id', templateId)

      if (error) throw error

      return {
        success: true,
        message: 'Usage count updated'
      }
    } catch (error) {
      console.error('Error updating usage count:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update usage count'
      }
    }
  }

  // Predefined Clinical Templates
  async createDefaultTemplates(adminId: string): Promise<MessagingApiResponse> {
    const defaultTemplates = [
      // Welcome & Onboarding
      {
        admin_id: adminId,
        title: 'Welcome to Program',
        content: 'Welcome to your peptide therapy program! I\'m here to support you throughout your journey. Please don\'t hesitate to reach out with any questions or concerns.',
        category: 'Welcome',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'First Week Check-in',
        content: 'How are you feeling after your first week? Any side effects or questions about your dosing schedule? Remember, it\'s normal to have some adjustment period.',
        category: 'Welcome',
        is_global: true
      },

      // Dosing Support
      {
        admin_id: adminId,
        title: 'Dosing Reminder',
        content: 'Just a friendly reminder about your dosing schedule. Please ensure you\'re following the protocol we discussed. Let me know if you need any clarification.',
        category: 'Dosing',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Missed Dose Protocol',
        content: 'I noticed you may have missed your scheduled dose. Please take it as soon as possible unless it\'s close to your next dose time. Let me know if you need guidance.',
        category: 'Dosing',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Dose Escalation',
        content: 'Based on your progress, we\'re ready to increase your dose. Please follow the new protocol I\'ve shared. Monitor for any changes and report them promptly.',
        category: 'Dosing',
        is_global: true
      },

      // Safety & Side Effects
      {
        admin_id: adminId,
        title: 'Side Effect Check-in',
        content: 'How are you managing any side effects? Please rate their severity and let me know if they\'re interfering with your daily activities.',
        category: 'Safety',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Safety Concern Follow-up',
        content: 'Thank you for reporting this concern. I\'ve reviewed your case and recommend the following steps. Please contact me immediately if symptoms worsen.',
        category: 'Safety',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Emergency Contact Reminder',
        content: 'For any urgent medical concerns, please contact your healthcare provider immediately or call emergency services. For program-related questions, I\'m here to help.',
        category: 'Safety',
        is_global: true
      },

      // Progress & Motivation
      {
        admin_id: adminId,
        title: 'Progress Celebration',
        content: 'Congratulations on your progress! Your dedication to the program is paying off. Keep up the excellent work and remember that sustainable results take time.',
        category: 'Progress',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Weekly Check-in',
        content: 'How has this week been for you? Please share your weight, energy levels, and any observations. Your feedback helps us optimize your program.',
        category: 'Progress',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Plateau Support',
        content: 'Weight plateaus are normal and part of the process. Let\'s review your current protocol and lifestyle factors. Stay consistent - results will come.',
        category: 'Progress',
        is_global: true
      },

      // Compliance & Adherence
      {
        admin_id: adminId,
        title: 'Compliance Reminder',
        content: 'I\'ve noticed some gaps in your tracking. Consistent monitoring helps us provide the best support. Please update your logs when convenient.',
        category: 'Compliance',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Lifestyle Support',
        content: 'Remember that peptide therapy works best with healthy lifestyle habits. How are you managing your nutrition and exercise routine?',
        category: 'Compliance',
        is_global: true
      },

      // General Support
      {
        admin_id: adminId,
        title: 'General Check-in',
        content: 'Just checking in to see how you\'re doing overall. Any questions or concerns I can help address?',
        category: 'General',
        is_global: true
      },
      {
        admin_id: adminId,
        title: 'Program Completion',
        content: 'Congratulations on completing your program! Your commitment has been outstanding. Let\'s schedule a follow-up to discuss your maintenance plan.',
        category: 'General',
        is_global: true
      }
    ]

    try {
      const { data: templates, error } = await supabase
        .from('message_templates')
        .insert(defaultTemplates)
        .select()

      if (error) throw error

      return {
        success: true,
        data: templates,
        message: `Created ${defaultTemplates.length} default templates`
      }
    } catch (error) {
      console.error('Error creating default templates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create default templates'
      }
    }
  }

  // Search templates
  async searchTemplates(
    query: string,
    adminId?: string,
    includeGlobal: boolean = true
  ): Promise<MessagingApiResponse<MessageTemplate[]>> {
    try {
      let supabaseQuery = supabase
        .from('message_templates')
        .select('*')

      // Filter by admin or include global templates
      if (adminId && includeGlobal) {
        supabaseQuery = supabaseQuery.or(`admin_id.eq.${adminId},is_global.eq.true`)
      } else if (adminId) {
        supabaseQuery = supabaseQuery.eq('admin_id', adminId)
      } else if (includeGlobal) {
        supabaseQuery = supabaseQuery.eq('is_global', true)
      }

      // Search in title and content
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      const { data: templates, error } = await supabaseQuery
        .order('usage_count', { ascending: false })
        .limit(20)

      if (error) throw error

      return {
        success: true,
        data: templates as MessageTemplate[]
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

// Export singleton instance
export const templateService = new TemplateService()
export default TemplateService
