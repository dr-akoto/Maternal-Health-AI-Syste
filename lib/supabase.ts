import { createClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom error handler
const handleError = (error: any, context: string) => {
  console.error(`[Supabase Error] ${context}:`, error);
  return error;
};

// Create a singleton instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key: string): string | null => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          handleError(error, 'LocalStorage access');
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          handleError(error, 'LocalStorage set item');
        }
      },
      removeItem: (key: string): void => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          handleError(error, 'LocalStorage remove item');
        }
      },
    },
  },
}) as any;

// Type-safe database access
export type Tables = Database['public']['Tables'];
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Custom error class for auth errors
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Authentication Service
export const authService = {
  // Sign up a new user with email and password
  async signUp(
    email: string, 
    password: string, 
    userData: {
      role: 'mother' | 'doctor' | 'admin';
      first_name: string;
      last_name: string;
      phone_number: string;
    }
  ) {
    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
            role: userData.role,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Create user in public.users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (userError) throw userError;

      // 3. Create role-specific profile
      const profileData = {
        user_id: authData.user.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (userData.role === 'mother') {
        const { error: profileError } = await supabase
          .from('mother_profiles')
          .insert([profileData]);
        if (profileError) throw profileError;
      } else if (userData.role === 'doctor') {
        const { error: profileError } = await supabase
          .from('doctor_profiles')
          .insert([profileData]);
        if (profileError) throw profileError;
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: handleError(error, 'Sign up') };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: handleError(error, 'Sign in') };
    }
  },

  // Sign out the current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: handleError(error, 'Sign out') };
    }
  },

  // Get the current user session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data: data.session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: null, error: handleError(error, 'Get session') };
    }
  },

  // Reset password (frontend wrapper)
  async resetPasswordForEmail(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: handleError(error, 'Reset password') };
    }
  },

  // Get current user with profile
  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error('No user found');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      let profile = null;
      if (userData.role === 'mother') {
        const { data: motherProfile } = await supabase
          .from('mother_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = motherProfile;
      } else if (userData.role === 'doctor') {
        const { data: doctorProfile } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = doctorProfile;
      }

      return { 
        data: { 
          ...user, 
          user_metadata: { ...user.user_metadata, role: userData.role },
          profile 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return { data: null, error: handleError(error, 'Get current user') };
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<UserUpdate>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: handleError(error, 'Update profile') };
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      callback(event, session);
    });
  },

  // Check if user has a specific role
  async hasRole(role: 'mother' | 'doctor' | 'admin'): Promise<{ hasRole: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hasRole: false, error: 'No authenticated user' };

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return { hasRole: userData?.role === role, error: null };
    } catch (error) {
      console.error('Error checking user role:', error);
      return { hasRole: false, error: handleError(error, 'Check role') };
    }
  },
};

// Real-time subscription helper
export const createSubscription = (
  channel: string,
  event: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
