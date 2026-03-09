/*
  # Smart Maternal Health System - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for the Smart Maternal Health System,
  including tables for mothers, doctors, symptoms, monitoring, prescriptions, emergencies, 
  communication, pharmacy, and admin features.

  ## New Tables
  
  ### User Management
  - `mother_profiles` - Mother user profiles with medical info
  - `doctor_profiles` - Doctor profiles with specialization
  - `admin_profiles` - Admin user profiles
  - `emergency_contacts` - Emergency contact information
  
  ### Medical & Monitoring
  - `symptoms` - Symptom reports from mothers
  - `ai_assessments` - AI triage results and decisions
  - `vital_signs` - Blood pressure, heart rate, etc.
  - `monitoring_devices` - Connected wearable devices
  - `medical_records` - Uploaded documents and lab results
  - `appointments` - Doctor appointments
  
  ### Communication
  - `chat_messages` - Real-time messaging
  - `video_calls` - Video call history
  - `notifications` - System notifications
  
  ### Prescriptions & Pharmacy
  - `prescriptions` - Doctor prescriptions
  - `prescription_items` - Individual medications
  - `pharmacies` - Pharmacy locations and info
  - `pharmacy_orders` - Orders and delivery tracking
  
  ### Emergency System
  - `emergencies` - Active emergency cases
  - `emergency_responses` - Doctor responses to emergencies
  
  ### Education & Content
  - `education_content` - Articles and videos
  - `content_views` - Track user engagement
  
  ### System & Compliance
  - `audit_logs` - System audit trail
  - `consent_records` - GDPR and data sharing consent
  - `system_settings` - Global configuration
  
  ## Security
  - Enable RLS on all tables
  - Create policies for authenticated access based on user role
  - Implement ownership checks for data access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('mother', 'doctor', 'admin');
CREATE TYPE risk_level AS ENUM ('level_1', 'level_2', 'level_3', 'level_4');
CREATE TYPE emergency_status AS ENUM ('active', 'responding', 'resolved', 'cancelled');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE prescription_status AS ENUM ('pending', 'approved', 'transmitted', 'filled', 'delivered');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');

-- Mother Profiles
CREATE TABLE IF NOT EXISTS mother_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  date_of_birth date,
  blood_type text,
  gestational_age_weeks integer,
  due_date date,
  current_risk_level risk_level DEFAULT 'level_1',
  biometric_enabled boolean DEFAULT false,
  language text DEFAULT 'en',
  profile_image_url text,
  address text,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctor Profiles
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  license_number text UNIQUE NOT NULL,
  specialization text NOT NULL,
  hospital_affiliation text,
  years_of_experience integer DEFAULT 0,
  is_available boolean DEFAULT true,
  backup_doctor_id uuid REFERENCES doctor_profiles(id),
  profile_image_url text,
  biometric_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text DEFAULT 'admin',
  permissions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Symptoms
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  symptoms jsonb NOT NULL,
  severity text NOT NULL,
  description text,
  reported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- AI Assessments
CREATE TABLE IF NOT EXISTS ai_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id uuid REFERENCES symptoms(id) ON DELETE CASCADE,
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  risk_level risk_level NOT NULL,
  confidence_score numeric(3,2),
  recommendations jsonb NOT NULL,
  decision_explanation text NOT NULL,
  ai_model_version text,
  processing_time_ms integer,
  requires_doctor_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Vital Signs
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  systolic_bp integer,
  diastolic_bp integer,
  heart_rate integer,
  temperature numeric(4,1),
  weight numeric(5,2),
  blood_sugar numeric(5,1),
  oxygen_saturation integer,
  notes text,
  source text DEFAULT 'manual',
  device_id uuid,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Monitoring Devices
CREATE TABLE IF NOT EXISTS monitoring_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL,
  device_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Medical Records
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachment_url text,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Video Calls
CREATE TABLE IF NOT EXISTS video_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  call_quality text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  diagnosis text,
  notes text,
  status prescription_status DEFAULT 'pending',
  pharmacy_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration_days integer NOT NULL,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  is_active boolean DEFAULT true,
  operating_hours jsonb,
  delivery_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Pharmacy Orders
CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  status order_status DEFAULT 'pending',
  delivery_address text NOT NULL,
  delivery_fee numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2),
  tracking_number text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergencies
CREATE TABLE IF NOT EXISTS emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id),
  status emergency_status DEFAULT 'active',
  location_latitude numeric(10,8),
  location_longitude numeric(11,8),
  description text,
  symptoms jsonb,
  activated_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Emergency Responses
CREATE TABLE IF NOT EXISTS emergency_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES emergencies(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  action_taken text NOT NULL,
  notes text,
  responded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Education Content
CREATE TABLE IF NOT EXISTS education_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL,
  description text,
  content_url text,
  thumbnail_url text,
  category text NOT NULL,
  tags text[],
  language text DEFAULT 'en',
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content Views
CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES education_content(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Consent Records
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL,
  is_granted boolean NOT NULL,
  version text NOT NULL,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mother_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Mother Profiles Policies
CREATE POLICY "Users can view own mother profile"
  ON mother_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mother profile"
  ON mother_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mother profile"
  ON mother_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view mother profiles"
  ON mother_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Doctor Profiles Policies
CREATE POLICY "Users can view own doctor profile"
  ON doctor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doctor profile"
  ON doctor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doctor profile"
  ON doctor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mothers can view their assigned doctors"
  ON doctor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN mother_profiles m ON m.id = a.mother_id
      WHERE m.user_id = auth.uid() AND a.doctor_id = doctor_profiles.id
    )
  );

-- Admin Profiles Policies
CREATE POLICY "Admins can view all admin profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

-- Emergency Contacts Policies
CREATE POLICY "Mothers can manage own emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

-- Symptoms Policies
CREATE POLICY "Mothers can manage own symptoms"
  ON symptoms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view symptoms"
  ON symptoms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- AI Assessments Policies
CREATE POLICY "Mothers can view own assessments"
  ON ai_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view and manage assessments"
  ON ai_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Vital Signs Policies
CREATE POLICY "Mothers can manage own vitals"
  ON vital_signs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view vitals"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Monitoring Devices Policies
CREATE POLICY "Mothers can manage own devices"
  ON monitoring_devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

-- Medical Records Policies
CREATE POLICY "Mothers can manage own records"
  ON medical_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Appointments Policies
CREATE POLICY "Mothers can manage own appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage their appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Chat Messages Policies
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Video Calls Policies
CREATE POLICY "Mothers can view own video calls"
  ON video_calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view own video calls"
  ON video_calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Prescriptions Policies
CREATE POLICY "Mothers can view own prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage prescriptions"
  ON prescriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Prescription Items Policies
CREATE POLICY "Users can view prescription items"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      LEFT JOIN mother_profiles m ON m.id = p.mother_id
      LEFT JOIN doctor_profiles d ON d.id = p.doctor_id
      WHERE p.id = prescription_id 
      AND (m.user_id = auth.uid() OR d.user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can manage prescription items"
  ON prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions p
      JOIN doctor_profiles d ON d.id = p.doctor_id
      WHERE p.id = prescription_id AND d.user_id = auth.uid()
    )
  );

-- Pharmacies Policies
CREATE POLICY "Anyone can view active pharmacies"
  ON pharmacies FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Pharmacy Orders Policies
CREATE POLICY "Mothers can manage own orders"
  ON pharmacy_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

-- Emergencies Policies
CREATE POLICY "Mothers can manage own emergencies"
  ON emergencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view and manage emergencies"
  ON emergencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Emergency Responses Policies
CREATE POLICY "Doctors can manage emergency responses"
  ON emergency_responses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Education Content Policies
CREATE POLICY "Anyone can view published content"
  ON education_content FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Content Views Policies
CREATE POLICY "Users can manage own content views"
  ON content_views FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

-- Consent Records Policies
CREATE POLICY "Users can manage own consent"
  ON consent_records FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- System Settings Policies
CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mother_profiles_user_id ON mother_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_mother_id ON symptoms(mother_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_mother_id ON ai_assessments(mother_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_mother_id ON vital_signs(mother_id);
CREATE INDEX IF NOT EXISTS idx_appointments_mother_id ON appointments(mother_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_mother_id ON prescriptions(mother_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_mother_id ON emergencies(mother_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
