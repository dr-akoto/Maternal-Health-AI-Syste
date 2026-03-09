export type UserRole = 'mother' | 'doctor' | 'admin';

export type RiskLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4';

export type EmergencyStatus = 'active' | 'responding' | 'resolved' | 'cancelled';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export type PrescriptionStatus = 'pending' | 'approved' | 'transmitted' | 'filled' | 'delivered';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface MotherProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  blood_type?: string;
  gestational_age_weeks?: number;
  due_date?: string;
  current_risk_level: RiskLevel;
  biometric_enabled: boolean;
  language: string;
  profile_image_url?: string;
  address?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  license_number: string;
  specialization: string;
  hospital_affiliation?: string;
  years_of_experience: number;
  is_available: boolean;
  backup_doctor_id?: string;
  profile_image_url?: string;
  biometric_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Symptom {
  id: string;
  mother_id: string;
  symptoms: Record<string, any>;
  severity: string;
  description?: string;
  reported_at: string;
  created_at: string;
}

export interface AIAssessment {
  id: string;
  symptom_id?: string;
  mother_id: string;
  risk_level: RiskLevel;
  confidence_score?: number;
  recommendations: Record<string, any>;
  decision_explanation: string;
  ai_model_version?: string;
  processing_time_ms?: number;
  requires_doctor_review: boolean;
  created_at: string;
}

export interface VitalSign {
  id: string;
  mother_id: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  blood_sugar?: number;
  oxygen_saturation?: number;
  notes?: string;
  source: string;
  device_id?: string;
  recorded_at: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  mother_id: string;
  doctor_id: string;
  diagnosis?: string;
  notes?: string;
  status: PrescriptionStatus;
  pharmacy_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  operating_hours?: Record<string, any>;
  delivery_available: boolean;
  created_at: string;
}

export interface PharmacyOrder {
  id: string;
  prescription_id: string;
  pharmacy_id: string;
  mother_id: string;
  status: OrderStatus;
  delivery_address: string;
  delivery_fee: number;
  total_amount?: number;
  tracking_number?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Emergency {
  id: string;
  mother_id: string;
  doctor_id?: string;
  status: EmergencyStatus;
  location_latitude?: number;
  location_longitude?: number;
  description?: string;
  symptoms?: Record<string, any>;
  activated_at: string;
  responded_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  attachment_url?: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  mother_id: string;
  doctor_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface EducationContent {
  id: string;
  title: string;
  content_type: string;
  description?: string;
  content_url?: string;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  language: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  mother_id: string;
  title: string;
  document_type: string;
  file_url: string;
  file_size?: number;
  notes?: string;
  uploaded_by?: string;
  uploaded_at: string;
  created_at: string;
}
