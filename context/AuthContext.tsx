import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api, User as ApiUser, UserRole as ApiUserRole } from "@/lib/api";

const sb = supabase as any;

type UserRole = "mother" | "doctor" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authLoading: boolean;
  userRole: UserRole;
  motherProfile: any | null;
  doctorProfile: any | null;
  profile: any | null; // Unified profile accessor
  notifications: any[];
  unreadNotificationCount: number;
  lastSeen: Date | null;
  error: Error | null;

  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => void;
  loadNotifications: (userId: string) => Promise<void>;
  updateLastSeen: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userType: 'mother' | 'doctor') => Promise<{ error: any }>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [motherProfile, setMotherProfile] = useState<any | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /* =========================
     LOAD USER PROFILE
  ========================== */

  const loadUserProfile = async (userId: string) => {
    try {
      // Check if user is a mother - use maybeSingle() to avoid error when no row found
      const { data: motherData, error: motherError } = await sb
        .from("mother_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (motherData && !motherError) {
        setUserRole("mother");
        setMotherProfile(motherData);
        setDoctorProfile(null);
        await loadNotifications(userId);
        return;
      }

      // Check if user is a doctor
      const { data: doctorData, error: doctorError } = await sb
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (doctorData && !doctorError) {
        setUserRole("doctor");
        setDoctorProfile(doctorData);
        setMotherProfile(null);
        await loadNotifications(userId);
        return;
      }

      // Check if user is an admin
      const { data: adminData, error: adminError } = await sb
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminData && !adminError) {
        setUserRole("admin");
        setMotherProfile(null);
        setDoctorProfile(null);
        await loadNotifications(userId);
        return;
      }

      // User exists but has no profile yet (new registration)
      console.warn("No profile found for user:", userId);
      console.warn("User may need to complete registration or profile was not created.");
      setUserRole(null);
      setMotherProfile(null);
      setDoctorProfile(null);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err instanceof Error ? err : new Error("Profile load failed"));
    }
  };

  /* =========================
     AUTH INITIALIZATION
  ========================== */

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        const {
          data: { session },
          error,
        } = await sb.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Auth failed"));
      } finally {
        setAuthLoading(false);
      }
    };

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (_event: any, newSession: Session | null) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserProfile(newSession.user.id);
      } else {
        setUserRole(null);
        setMotherProfile(null);
        setDoctorProfile(null);
        setNotifications([]);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================
     NOTIFICATIONS
  ========================== */

  const loadNotifications = async (userId: string) => {
    const { data } = await sb
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data);
      setUnreadNotificationCount(data.filter((n: any) => !n.read).length);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await sb.from("notifications").update({ read: true }).eq("id", id);

    setNotifications((prev) =>
      prev.map((n: any) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    await sb
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    setNotifications((prev) => prev.map((n: any) => ({ ...n, read: true })));
    setUnreadNotificationCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadNotificationCount(0);
  };

  /* =========================
     PROFILE + ACCOUNT
  ========================== */

  const updateProfile = async (updates: any) => {
    if (!user || !userRole)
      return { error: new Error("User not authenticated") };

    const table =
      userRole === "mother" ? "mother_profiles" : "doctor_profiles";

    const { error } = await sb
      .from(table)
      .update(updates)
      .eq("user_id", user.id);

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await sb.auth.resetPasswordForEmail(email);
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await sb.auth.updateUser({ password });
    return { error };
  };

  const updateLastSeen = async (userId: string) => {
    // Update last_seen in the appropriate profile table based on role
    const now = new Date().toISOString();
    
    if (userRole === 'mother') {
      await sb
        .from("mother_profiles")
        .update({ updated_at: now })
        .eq("user_id", userId);
    } else if (userRole === 'doctor') {
      await sb
        .from("doctor_profiles")
        .update({ updated_at: now })
        .eq("user_id", userId);
    } else if (userRole === 'admin') {
      await sb
        .from("admin_profiles")
        .update({ updated_at: now })
        .eq("user_id", userId);
    }

    setLastSeen(new Date());
  };

  const signOut = async () => {
    // Use API to logout
    await api.logout();
    // Also sign out from Supabase client (for any cached sessions)
    await sb.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setMotherProfile(null);
    setDoctorProfile(null);
    setNotifications([]);
  };

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      // Use API for login
      const { data, error } = await api.login(email, password);
      
      if (error) {
        return { error: new Error(error.error || 'Login failed') };
      }

      if (data?.session && data?.user) {
        // Set session for Supabase client as well (for real-time subscriptions)
        await sb.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        // Get the Supabase user object
        const { data: { user: supabaseUser } } = await sb.auth.getUser();
        
        if (supabaseUser) {
          setSession({ 
            access_token: data.session.access_token, 
            refresh_token: data.session.refresh_token 
          } as Session);
          setUser(supabaseUser);
          
          // Set profile from API response
          if (data.user.profile) {
            if (data.user.role === 'mother') {
              setUserRole('mother');
              setMotherProfile(data.user.profile);
              setDoctorProfile(null);
            } else if (data.user.role === 'doctor') {
              setUserRole('doctor');
              setDoctorProfile(data.user.profile);
              setMotherProfile(null);
            } else if (data.user.role === 'admin') {
              setUserRole('admin');
              setMotherProfile(null);
              setDoctorProfile(null);
            }
            await loadNotifications(supabaseUser.id);
          } else {
            // No profile yet - load it
            await loadUserProfile(supabaseUser.id);
          }
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: 'mother' | 'doctor') => {
    setAuthLoading(true);
    try {
      // Use API for registration
      const { data, error } = await api.register(email, password, userType);

      if (error) {
        return { error: new Error(error.error || 'Registration failed') };
      }

      // Do not auto-sign-in; user will be redirected to login
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setAuthLoading(false);
    }
  };

  /* =========================
     RELOAD PROFILE
  ========================== */

  const reloadProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  /* =========================
     CONTEXT VALUE
  ========================== */

  const value: AuthContextType = {
    user,
    session,
    loading,
    authLoading,
    userRole,
    motherProfile,
    doctorProfile,
    profile: userRole === 'mother' ? motherProfile : userRole === 'doctor' ? doctorProfile : null,
    notifications,
    unreadNotificationCount,
    lastSeen,
    error,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    loadNotifications,
    updateLastSeen,
    signIn,
    signUp,
    reloadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
