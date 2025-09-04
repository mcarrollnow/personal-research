# Supabase Setup Guide for Results Pro Messaging

## 🎯 **Overview**
Supabase will handle real-time messaging between admins and patients while maintaining data isolation and HIPAA-ready security.

## 🚀 **Why Supabase for Clinical Trials?**
- ✅ **HIPAA Compliant** (with proper configuration)
- ✅ **Real-time subscriptions** for instant messaging
- ✅ **Row Level Security** for patient data isolation
- ✅ **PostgreSQL** for complex queries and reporting
- ✅ **Built-in Auth** that extends your current system
- ✅ **Automatic APIs** generated from database schema
- ✅ **Scalable** to thousands of patients

## 📋 **Setup Steps**

### **Step 1: Create Supabase Project** (5 minutes)
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create new project
3. Choose region closest to your users
4. Save your project credentials:
   ```
   Project URL: https://your-project.supabase.co
   Anon Key: eyJ...
   Service Role Key: eyJ...
   ```

### **Step 2: Database Schema** (10 minutes)
Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Messages table for admin-patient communication
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'safety', 'dosing', 'progress', 'urgent')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Conversations table to group messages
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  admin_id TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'support' CHECK (role IN ('support', 'coordinator', 'admin', 'super_admin')),
  department TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  active_status BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates for quick replies
CREATE TABLE message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX idx_conversations_admin_id ON conversations(admin_id);
```

### **Step 3: Row Level Security Policies** (15 minutes)
```sql
-- Patients can only see their own messages
CREATE POLICY "Patients can view own messages" ON messages
  FOR SELECT USING (
    from_user_id = current_setting('app.current_patient_id', true) OR 
    to_user_id = current_setting('app.current_patient_id', true)
  );

-- Patients can only send messages to admins
CREATE POLICY "Patients can send messages" ON messages
  FOR INSERT WITH CHECK (
    from_user_id = current_setting('app.current_patient_id', true) AND
    to_user_id IN (SELECT admin_id FROM admin_users WHERE active_status = true)
  );

-- Admins can see all messages
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_id = current_setting('app.current_admin_id', true) 
      AND active_status = true
    )
  );

-- Admins can send messages to any patient
CREATE POLICY "Admins can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_id = current_setting('app.current_admin_id', true) 
      AND active_status = true
    )
  );

-- Conversations policies
CREATE POLICY "Patients can view own conversations" ON conversations
  FOR SELECT USING (patient_id = current_setting('app.current_patient_id', true));

CREATE POLICY "Admins can view all conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_id = current_setting('app.current_admin_id', true) 
      AND active_status = true
    )
  );
```

### **Step 4: Real-time Subscriptions** (5 minutes)
```sql
-- Enable real-time for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

### **Step 5: Environment Variables** (5 minutes)
Add to your `.env.local` and Vercel:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 🔧 **Integration with Existing Code**

### **Update Package.json Dependencies**
```bash
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### **Create Supabase Client**
```typescript
// lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createClientComponentClient()
export const createServerClient = () => createServerComponentClient({ cookies })
```

### **Messaging Service Structure**
```typescript
// lib/messaging-service.ts
class MessagingService {
  async sendMessage(fromId: string, toId: string, content: string, type: string)
  async getConversations(userId: string, isAdmin: boolean)
  async markAsRead(conversationId: string)
  async subscribeToMessages(conversationId: string, callback: Function)
  async broadcastMessage(adminId: string, patientIds: string[], content: string)
}
```

## 📊 **Data Flow Architecture**

```
Patient sends message → Supabase messages table → Real-time subscription → Admin dashboard
                    ↓
Admin replies → Supabase messages table → Real-time subscription → Patient chat
                    ↓
All messages → Google Sheets (backup/analytics) → Research database
```

## 🔒 **Security Features**

### **Patient Data Isolation**
- Each patient only sees their own conversations
- Admins see all conversations but with proper audit trails
- Row Level Security enforces access control

### **Admin Role Management**
- Support, Coordinator, Admin, Super Admin roles
- Department-based message routing
- Permission-based feature access

### **HIPAA Considerations**
- Encrypted at rest and in transit
- Audit logging for all message access
- Data retention policies
- Secure authentication flows

## 🎯 **Next Steps**

**To start Chunk 1:**
1. Set up Supabase project (follow steps above)
2. Run the database schema
3. Add environment variables
4. Install Supabase dependencies

**Then in your next chat session, say:**
```
"I want to work on Chunk 1: Data Structure & Google Sheets Extension"
"I've set up Supabase with the database schema from SUPABASE_SETUP_GUIDE.md"
"Now extend GoogleSheetsService for admin-patient messaging with Supabase integration"
```

This will give you a revolutionary messaging system that maintains your beautiful existing UI while adding powerful admin capabilities for clinical trial management! 🚀
