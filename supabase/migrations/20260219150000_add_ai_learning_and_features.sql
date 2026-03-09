/*
  # AI Learning System Schema

  This migration adds tables for the AI learning system:
  - ai_conversations: Stores conversation history for analysis
  - ai_learning_conversations: Anonymized conversations for training
  - ai_learning_candidates: Potential additions to training data
  - ai_model_versions: Track model versions
  - ai_conversation_feedback: User feedback on AI responses

  ## Security
  - Enable RLS on all tables
  - Admin-only access for learning tables
*/

-- AI Conversations (for context and history)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  intent text,
  risk_level risk_level,
  symptoms_extracted text[],
  confidence_score numeric(3,2),
  required_escalation boolean DEFAULT false,
  model_version text,
  created_at timestamptz DEFAULT now()
);

-- AI Learning Conversations (anonymized)
CREATE TABLE IF NOT EXISTS ai_learning_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  anonymized_user_id text NOT NULL,
  messages jsonb NOT NULL,
  features jsonb NOT NULL,
  ai_responses jsonb NOT NULL,
  outcome jsonb,
  review_status text DEFAULT 'pending',
  review_flag_reason text,
  is_learning_candidate boolean DEFAULT false,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  created_at timestamptz DEFAULT now()
);

-- AI Learning Candidates
CREATE TABLE IF NOT EXISTS ai_learning_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  priority text NOT NULL,
  description text NOT NULL,
  source_conversations text[] NOT NULL,
  suggested_addition jsonb NOT NULL,
  estimated_impact text,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  implemented_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AI Model Versions
CREATE TABLE IF NOT EXISTS ai_model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  release_date timestamptz NOT NULL,
  training_data_cutoff timestamptz NOT NULL,
  improvements text[],
  known_limitations text[],
  validation_metrics jsonb,
  status text DEFAULT 'training',
  previous_version text,
  created_at timestamptz DEFAULT now()
);

-- AI Conversation Feedback
CREATE TABLE IF NOT EXISTS ai_conversation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  helpful boolean,
  accurate boolean,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Pregnancy Tracker Data
CREATE TABLE IF NOT EXISTS pregnancy_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  weight numeric(5,2),
  symptoms jsonb,
  notes text,
  mood text,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  fetal_movement_count integer,
  recorded_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Medication Reminders
CREATE TABLE IF NOT EXISTS medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  reminder_times time[] NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medication Reminder Logs
CREATE TABLE IF NOT EXISTS medication_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid REFERENCES medication_reminders(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  skipped boolean DEFAULT false,
  skip_reason text,
  created_at timestamptz DEFAULT now()
);

-- Nutrition Logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type text NOT NULL,
  foods jsonb NOT NULL,
  calories integer,
  protein_grams numeric(5,1),
  water_intake_ml integer,
  prenatal_vitamin_taken boolean DEFAULT false,
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Ambulance Services
CREATE TABLE IF NOT EXISTS ambulance_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  city text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  is_active boolean DEFAULT true,
  average_response_time_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Emergency Ambulance Requests
CREATE TABLE IF NOT EXISTS ambulance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES emergencies(id) ON DELETE CASCADE NOT NULL,
  ambulance_service_id uuid REFERENCES ambulance_services(id),
  mother_id uuid REFERENCES mother_profiles(id) ON DELETE CASCADE NOT NULL,
  pickup_latitude numeric(10,8) NOT NULL,
  pickup_longitude numeric(11,8) NOT NULL,
  pickup_address text,
  destination_hospital text,
  status text DEFAULT 'requested',
  requested_at timestamptz DEFAULT now(),
  dispatched_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Offline Sync Queue
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_data jsonb NOT NULL,
  synced boolean DEFAULT false,
  synced_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Language Preferences
CREATE TABLE IF NOT EXISTS language_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_language text DEFAULT 'en',
  voice_enabled boolean DEFAULT false,
  text_size text DEFAULT 'medium',
  high_contrast boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;

-- AI Conversations - Users can view their own
CREATE POLICY "Users can view own AI conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- AI Learning tables - Admin only
CREATE POLICY "Admins can manage learning conversations"
  ON ai_learning_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage learning candidates"
  ON ai_learning_candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active model versions"
  ON ai_model_versions FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage model versions"
  ON ai_model_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
    )
  );

-- AI Feedback - Anyone can submit
CREATE POLICY "Users can submit feedback"
  ON ai_conversation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Pregnancy Tracker - Mothers manage their own
CREATE POLICY "Mothers can manage own pregnancy tracker"
  ON pregnancy_tracker FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view pregnancy tracker"
  ON pregnancy_tracker FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Medication Reminders
CREATE POLICY "Mothers can manage own medication reminders"
  ON medication_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Mothers can manage own medication logs"
  ON medication_reminder_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medication_reminders mr
      JOIN mother_profiles mp ON mp.id = mr.mother_id
      WHERE mr.id = reminder_id AND mp.user_id = auth.uid()
    )
  );

-- Nutrition Logs
CREATE POLICY "Mothers can manage own nutrition logs"
  ON nutrition_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

-- Ambulance Services - Public read
CREATE POLICY "Anyone can view active ambulance services"
  ON ambulance_services FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Ambulance Requests
CREATE POLICY "Mothers can manage own ambulance requests"
  ON ambulance_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mother_profiles WHERE id = mother_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view ambulance requests"
  ON ambulance_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Offline Sync
CREATE POLICY "Users can manage own offline queue"
  ON offline_sync_queue FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Language Preferences
CREATE POLICY "Users can manage own language preferences"
  ON language_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_status ON ai_learning_conversations(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_candidates_status ON ai_learning_candidates(status);
CREATE INDEX IF NOT EXISTS idx_pregnancy_tracker_mother ON pregnancy_tracker(mother_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_mother ON medication_reminders(mother_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_mother ON nutrition_logs(mother_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_emergency ON ambulance_requests(emergency_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_user ON offline_sync_queue(user_id, synced);
