import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/supabase";

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
      const { data: userData } = await sb
        .from("users")
        .select("role, last_seen")
        .eq("id", userId)
        .single();

      if (!userData) return;

      setUserRole(userData.role);
      setLastSeen(userData.last_seen ? new Date(userData.last_seen) : null);

      if (userData.role === "mother") {
        const { data } = await sb
          .from("mother_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        setMotherProfile(data ?? null);
      }

      if (userData.role === "doctor") {
        const { data } = await sb
          .from("doctor_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        setDoctorProfile(data ?? null);
      }

      // Handle admin role
      if (userData.role === "admin") {
        // Admin may not have a separate profile table
        // Just set the role
      }

      await loadNotifications(userId);
    } catch (err) {
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
    const now = new Date().toISOString();

    await sb
      .from("users")
      .update({ last_seen: now })
      .eq("id", userId);

    setLastSeen(new Date());
  };

  const signOut = async () => {
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
      const { data, error } = await authService.signIn(email, password);
      if (error) return { error };

      // If we have a session, update local state
      const session = data?.session;
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }

      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: 'mother' | 'doctor') => {
    setAuthLoading(true);
    try {
      // authService expects more profile fields; supply minimal values from the registration form
      const { data, error } = await authService.signUp(email, password, {
        role: userType,
        first_name: '',
        last_name: '',
        phone_number: '',
      });

      if (error) return { error };

      // Do not auto-sign-in; user will be redirected to login
      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setAuthLoading(false);
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
