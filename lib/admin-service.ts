import { supabase } from './supabase'
import { AdminUser, MessagingApiResponse, PaginatedResponse } from '../types/admin-chat'

class AdminService {
  // Admin User Management
  async getAdminUser(adminId: string): Promise<MessagingApiResponse<AdminUser>> {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('admin_id', adminId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: admin as AdminUser,
        message: 'Admin user retrieved successfully'
      }
    } catch (error) {
      console.error('Error fetching admin user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch admin user'
      }
    }
  }

  async getAllAdmins(
    page: number = 1,
    limit: number = 50,
    activeOnly: boolean = true
  ): Promise<MessagingApiResponse<PaginatedResponse<AdminUser>>> {
    try {
      let query = supabase
        .from('admin_users')
        .select('*', { count: 'exact' })

      if (activeOnly) {
        query = query.eq('active_status', true)
      }

      const offset = (page - 1) * limit
      const { data: admins, error, count } = await query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        data: {
          data: admins as AdminUser[],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch admins'
      }
    }
  }

  async createAdminUser(adminData: {
    admin_id: string
    name: string
    email: string
    role?: 'support' | 'coordinator' | 'admin' | 'super_admin'
    department?: string
    phone?: string
    timezone?: string
    permissions?: string[]
  }): Promise<MessagingApiResponse<AdminUser>> {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .insert({
          admin_id: adminData.admin_id,
          name: adminData.name,
          email: adminData.email,
          role: adminData.role || 'support',
          department: adminData.department,
          phone: adminData.phone,
          timezone: adminData.timezone || 'UTC',
          permissions: adminData.permissions || [],
          active_status: true
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: admin as AdminUser,
        message: 'Admin user created successfully'
      }
    } catch (error) {
      console.error('Error creating admin user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create admin user'
      }
    }
  }

  async updateAdminUser(
    adminId: string,
    updates: Partial<AdminUser>
  ): Promise<MessagingApiResponse<AdminUser>> {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('admin_id', adminId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: admin as AdminUser,
        message: 'Admin user updated successfully'
      }
    } catch (error) {
      console.error('Error updating admin user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin user'
      }
    }
  }

  async updateLastLogin(adminId: string): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('admin_id', adminId)

      if (error) throw error

      return {
        success: true,
        message: 'Last login updated'
      }
    } catch (error) {
      console.error('Error updating last login:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update last login'
      }
    }
  }

  async deactivateAdmin(adminId: string): Promise<MessagingApiResponse> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ active_status: false })
        .eq('admin_id', adminId)

      if (error) throw error

      return {
        success: true,
        message: 'Admin user deactivated'
      }
    } catch (error) {
      console.error('Error deactivating admin:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate admin'
      }
    }
  }

  // Admin Analytics
  async getAdminStats(adminId: string): Promise<MessagingApiResponse<{
    totalConversations: number
    activeConversations: number
    totalMessages: number
    messagesThisWeek: number
    averageResponseTime: number
    unreadMessages: number
  }>> {
    try {
      // Get total conversations assigned to admin
      const { count: totalConversations, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId)

      if (convError) throw convError

      // Get active conversations
      const { count: activeConversations, error: activeError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId)
        .eq('status', 'active')

      if (activeError) throw activeError

      // Get total messages from admin
      const { count: totalMessages, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', adminId)

      if (msgError) throw msgError

      // Get messages this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { count: messagesThisWeek, error: weekError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', adminId)
        .gte('created_at', weekAgo.toISOString())

      if (weekError) throw weekError

      // Get unread messages to admin
      const { count: unreadMessages, error: unreadError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', adminId)
        .eq('read_status', false)

      if (unreadError) throw unreadError

      return {
        success: true,
        data: {
          totalConversations: totalConversations || 0,
          activeConversations: activeConversations || 0,
          totalMessages: totalMessages || 0,
          messagesThisWeek: messagesThisWeek || 0,
          averageResponseTime: 0, // TODO: Calculate actual response time
          unreadMessages: unreadMessages || 0
        }
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch admin stats'
      }
    }
  }

  // Permission Management
  async hasPermission(adminId: string, permission: string): Promise<boolean> {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('permissions, role')
        .eq('admin_id', adminId)
        .single()

      if (error) throw error

      if (!admin) return false

      // Super admins have all permissions
      if (admin.role === 'super_admin') return true

      // Check if permission is in the permissions array
      return admin.permissions.includes(permission)
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  async addPermission(adminId: string, permission: string): Promise<MessagingApiResponse> {
    try {
      const { data: admin, error: fetchError } = await supabase
        .from('admin_users')
        .select('permissions')
        .eq('admin_id', adminId)
        .single()

      if (fetchError) throw fetchError

      const updatedPermissions = [...(admin.permissions || []), permission]
      const uniquePermissions = [...new Set(updatedPermissions)]

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ permissions: uniquePermissions })
        .eq('admin_id', adminId)

      if (updateError) throw updateError

      return {
        success: true,
        message: 'Permission added successfully'
      }
    } catch (error) {
      console.error('Error adding permission:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add permission'
      }
    }
  }

  async removePermission(adminId: string, permission: string): Promise<MessagingApiResponse> {
    try {
      const { data: admin, error: fetchError } = await supabase
        .from('admin_users')
        .select('permissions')
        .eq('admin_id', adminId)
        .single()

      if (fetchError) throw fetchError

      const updatedPermissions = (admin.permissions || []).filter((p: string) => p !== permission)

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ permissions: updatedPermissions })
        .eq('admin_id', adminId)

      if (updateError) throw updateError

      return {
        success: true,
        message: 'Permission removed successfully'
      }
    } catch (error) {
      console.error('Error removing permission:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove permission'
      }
    }
  }
}

// Export singleton instance
export const adminService = new AdminService()
export default AdminService
