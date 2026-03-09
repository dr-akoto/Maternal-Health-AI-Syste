export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // User Management
      users: {
        Row: {
          id: string
          email: string
          role: 'mother' | 'doctor' | 'admin'
          created_at: string
          updated_at: string
          last_seen: string | null
        }
        Insert: {
          id?: string
          email: string
          role: 'mother' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'mother' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
      }
      
      mother_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          date_of_birth: string
          blood_type: string | null
          phone_number: string
          address: Json | null
          emergency_contact: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          date_of_birth: string
          blood_type?: string | null
          phone_number: string
          address?: Json | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          blood_type?: string | null
          phone_number?: string
          address?: Json | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      
      doctor_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          specialization: string
          license_number: string
          hospital_affiliation: string | null
          phone_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          specialization: string
          license_number: string
          hospital_affiliation?: string | null
          phone_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          specialization?: string
          license_number?: string
          hospital_affiliation?: string | null
          phone_number?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Real-time Communication
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      
      chat_rooms: {
        Row: {
          id: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      chat_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      
      // Notifications
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'appointment' | 'reminder' | 'alert' | 'message'
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'appointment' | 'reminder' | 'alert' | 'message'
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'appointment' | 'reminder' | 'alert' | 'message'
          read?: boolean
          data?: Json | null
          created_at?: string
        }
      }
    }
    
    Views: {
      // Add any custom views here
    }
    
    Functions: {
      // Authentication functions
      create_user: {
        Args: {
          user_data: Json
          role: 'mother' | 'doctor' | 'admin'
        }
        Returns: Json
      }
      
      // Real-time functions
      send_message: {
        Args: {
          room_id: string
          content: string
        }
        Returns: Json
      }
      
      // Utility functions
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: 'mother' | 'doctor' | 'admin'
      }
      
      // Notification functions
      create_notification: {
        Args: {
          user_id: string
          title: string
          message: string
          type: 'appointment' | 'reminder' | 'alert' | 'message'
          data?: Json
        }
        Returns: Json
      }
    }
    
    Enums: {
      user_role: 'mother' | 'doctor' | 'admin'
      notification_type: 'appointment' | 'reminder' | 'alert' | 'message'
    }
  }
}
