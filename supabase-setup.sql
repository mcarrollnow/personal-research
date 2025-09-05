-- Results Pro - Complete Supabase Database Setup
-- Run this in your Supabase SQL Editor to create all required tables

-- ============================================
-- EXISTING MESSAGING TABLES (from previous chunks)
-- ============================================

-- Messages table for admin-patient communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'safety', 'dosing', 'progress', 'urgent', 'safety_alert', 'milestone_celebration', 'compliance_followup', 'admin_response', 'milestone_notification', 'compliance_alert')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Conversations table to group messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  admin_id TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'support' CHECK (role IN ('support', 'coordinator', 'admin', 'primary', 'super_admin')),
  department TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates for quick replies
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEW INTEGRATION TABLES (Chunk 7)
-- ============================================

-- Patient profiles table (for milestone calculations)
CREATE TABLE IF NOT EXISTS patient_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  starting_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  current_weight DECIMAL(5,2),
  start_date DATE,
  current_week INTEGER DEFAULT 1,
  goals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety alerts table
CREATE TABLE IF NOT EXISTS safety_alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient_profiles(id),
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  side_effects JSONB NOT NULL DEFAULT '[]'::jsonb,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  escalated BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'monitoring' CHECK (status IN ('active', 'resolved', 'monitoring')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress milestones table
CREATE TABLE IF NOT EXISTS progress_milestones (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient_profiles(id),
  type TEXT NOT NULL CHECK (type IN ('weight_loss', 'goal_achievement', 'week_completion', 'compliance_streak')),
  value DECIMAL(10,2) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  celebrated BOOLEAN DEFAULT false,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient_profiles(id),
  type TEXT NOT NULL CHECK (type IN ('missed_dose', 'incomplete_log', 'low_compliance')),
  days_count INTEGER NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE,
  follow_up_sent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table (for compliance tracking)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient_profiles(id),
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  waist_circumference DECIMAL(5,2),
  hip_circumference DECIMAL(5,2),
  neck_circumference DECIMAL(5,2),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  appetite_level INTEGER CHECK (appetite_level BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  dose_taken TEXT CHECK (dose_taken IN ('yes', 'no', 'partial')),
  dose_time TIME,
  injection_site TEXT,
  side_effects TEXT,
  side_effect_severity TEXT CHECK (side_effect_severity IN ('none', 'mild', 'moderate', 'severe')),
  notes TEXT,
  progress_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Existing message indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);

-- New integration indexes
CREATE INDEX IF NOT EXISTS idx_safety_alerts_patient_id ON safety_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_severity ON safety_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_reported_at ON safety_alerts(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_patient_id ON progress_milestones(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_type ON progress_milestones(type);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_patient_id ON compliance_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_patient_date ON daily_logs(patient_id, date DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    from_user_id = current_setting('app.current_user_id', true) OR 
    to_user_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    from_user_id = current_setting('app.current_user_id', true)
  );

-- Patient profiles policies  
CREATE POLICY "Patients can view own profile" ON patient_profiles
  FOR SELECT USING (id = current_setting('app.current_user_id', true));

CREATE POLICY "Patients can update own profile" ON patient_profiles
  FOR UPDATE USING (id = current_setting('app.current_user_id', true));

-- Safety alerts policies
CREATE POLICY "Patients can view own safety alerts" ON safety_alerts
  FOR SELECT USING (patient_id = current_setting('app.current_user_id', true));

CREATE POLICY "Patients can insert own safety alerts" ON safety_alerts
  FOR INSERT WITH CHECK (patient_id = current_setting('app.current_user_id', true));

-- Progress milestones policies
CREATE POLICY "Patients can view own milestones" ON progress_milestones
  FOR SELECT USING (patient_id = current_setting('app.current_user_id', true));

-- Compliance alerts policies
CREATE POLICY "Patients can view own compliance alerts" ON compliance_alerts
  FOR SELECT USING (patient_id = current_setting('app.current_user_id', true));

-- Daily logs policies
CREATE POLICY "Patients can manage own daily logs" ON daily_logs
  FOR ALL USING (patient_id = current_setting('app.current_user_id', true));

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample admin user
INSERT INTO admin_users (admin_id, name, email, role, active) 
VALUES ('ADMIN-001', 'Dr. Sarah Johnson', 'admin@resultspro.com', 'primary', true)
ON CONFLICT (admin_id) DO NOTHING;

-- Insert sample patient profile
INSERT INTO patient_profiles (id, name, email, starting_weight, target_weight, current_weight, start_date, current_week)
VALUES ('PATIENT-001', 'Demo Patient', 'patient@example.com', 190.0, 160.0, 175.0, CURRENT_DATE - INTERVAL '12 weeks', 12)
ON CONFLICT (id) DO NOTHING;

-- Insert sample daily logs for compliance testing
INSERT INTO daily_logs (patient_id, date, weight, dose_taken, created_at) VALUES
  ('PATIENT-001', CURRENT_DATE, 175.0, 'yes', NOW()),
  ('PATIENT-001', CURRENT_DATE - INTERVAL '1 day', 175.2, 'yes', NOW() - INTERVAL '1 day'),
  ('PATIENT-001', CURRENT_DATE - INTERVAL '2 days', 175.5, 'no', NOW() - INTERVAL '2 days'),
  ('PATIENT-001', CURRENT_DATE - INTERVAL '3 days', 175.8, 'no', NOW() - INTERVAL '3 days')
ON CONFLICT (patient_id, date) DO NOTHING;

-- ============================================
-- FUNCTIONS FOR REAL-TIME UPDATES
-- ============================================

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      unread_count = unread_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to check for compliance issues
CREATE OR REPLACE FUNCTION check_compliance_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for missed doses (no entry for 2+ days)
  INSERT INTO compliance_alerts (id, patient_id, type, days_count, last_activity, status)
  SELECT 
    'compliance_' || extract(epoch from now()) || '_' || NEW.patient_id,
    NEW.patient_id,
    'missed_dose',
    2,
    NOW() - INTERVAL '2 days',
    'pending'
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_logs 
    WHERE patient_id = NEW.patient_id 
    AND date >= CURRENT_DATE - INTERVAL '2 days'
    AND dose_taken = 'yes'
  )
  AND NOT EXISTS (
    SELECT 1 FROM compliance_alerts
    WHERE patient_id = NEW.patient_id 
    AND type = 'missed_dose'
    AND status = 'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for compliance checking
DROP TRIGGER IF EXISTS check_compliance_on_log ON daily_logs;
CREATE TRIGGER check_compliance_on_log
  AFTER INSERT OR UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_compliance_alerts();

-- ============================================
-- SETUP COMPLETE MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Results Pro Supabase Database Setup Complete!';
  RAISE NOTICE '📊 Tables created: messages, conversations, admin_users, message_templates, patient_profiles, safety_alerts, progress_milestones, compliance_alerts, daily_logs';
  RAISE NOTICE '🔒 Row Level Security policies applied';
  RAISE NOTICE '⚡ Real-time triggers configured';
  RAISE NOTICE '🧪 Sample data inserted for testing';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to test integration features!';
END $$;
