import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          conversation_id: string
          from_user_id: string
          to_user_id: string
          content: string
          message_type: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          read_status: boolean
          created_at: string
          updated_at: string
          attachments: any[]
        }
        Insert: {
          id?: string
          conversation_id: string
          from_user_id: string
          to_user_id: string
          content: string
          message_type?: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          read_status?: boolean
          created_at?: string
          updated_at?: string
          attachments?: any[]
        }
        Update: {
          id?: string
          conversation_id?: string
          from_user_id?: string
          to_user_id?: string
          content?: string
          message_type?: 'general' | 'safety' | 'dosing' | 'progress' | 'urgent'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          read_status?: boolean
          created_at?: string
          updated_at?: string
          attachments?: any[]
        }
      }
      conversations: {
        Row: {
          id: string
          patient_id: string
          admin_id: string | null
          last_message_at: string
          unread_count: number
          status: 'active' | 'closed' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          admin_id?: string | null
          last_message_at?: string
          unread_count?: number
          status?: 'active' | 'closed' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          admin_id?: string | null
          last_message_at?: string
          unread_count?: number
          status?: 'active' | 'closed' | 'archived'
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          admin_id: string
          name: string
          email: string
          role: 'support' | 'coordinator' | 'admin' | 'super_admin'
          department: string | null
          phone: string | null
          timezone: string
          active_status: boolean
          last_login: string | null
          permissions: any[]
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          name: string
          email: string
          role?: 'support' | 'coordinator' | 'admin' | 'super_admin'
          department?: string | null
          phone?: string | null
          timezone?: string
          active_status?: boolean
          last_login?: string | null
          permissions?: any[]
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          name?: string
          email?: string
          role?: 'support' | 'coordinator' | 'admin' | 'super_admin'
          department?: string | null
          phone?: string | null
          timezone?: string
          active_status?: boolean
          last_login?: string | null
          permissions?: any[]
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          admin_id: string
          title: string
          content: string
          category: string
          is_global: boolean
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          title: string
          content: string
          category: string
          is_global?: boolean
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          title?: string
          content?: string
          category?: string
          is_global?: boolean
          usage_count?: number
          created_at?: string
        }
      }
    }
  }
}
