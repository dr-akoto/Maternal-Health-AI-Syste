import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Activity,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  Baby,
  Heart,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalPatients: number;
  activeHighRisk: number;
  pendingAlerts: number;
  appointmentsToday: number;
}

interface PatientAlert {
  id: string;
  patientName: string;
  alertType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  createdAt: string;
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeHighRisk: 0,
    pendingAlerts: 0,
    appointmentsToday: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<PatientAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch patient count
      const { count: patientCount } = await (supabase as any)
        .from('mother_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id);

      // Fetch high risk patients
      const { count: highRiskCount } = await (supabase as any)
        .from('mother_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('risk_level', 'high');

      // Fetch pending alerts
      const { data: alerts } = await (supabase as any)
        .from('alerts')
        .select(`
          id,
          alert_type,
          severity,
          message,
          created_at,
          mother:mother_profiles(first_name, last_name)
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { count: appointmentsCount } = await (supabase as any)
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .gte('scheduled_time', today)
        .lt('scheduled_time', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

      setStats({
        totalPatients: patientCount || 0,
        activeHighRisk: highRiskCount || 0,
        pendingAlerts: alerts?.length || 0,
        appointmentsToday: appointmentsCount || 0,
      });

      setRecentAlerts(
        alerts?.map((a: any) => ({
          id: a.id,
          patientName: a.mother ? `${a.mother.first_name} ${a.mother.last_name}` : 'Unknown',
          alertType: a.alert_type,
          severity: a.severity,
          message: a.message,
          createdAt: a.created_at,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.doctorName}>
              Dr. {profile?.first_name || 'Doctor'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitial}>
              {profile?.first_name?.[0] || 'D'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#dbeafe' }]}
            onPress={() => router.push('/(doctor)/(tabs)/patients')}
          >
            <Users size={24} color="#2563eb" />
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>
              {stats.totalPatients}
            </Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#fee2e2' }]}
            onPress={() => router.push('/(doctor)/(tabs)/patients')}
          >
            <AlertTriangle size={24} color="#dc2626" />
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>
              {stats.activeHighRisk}
            </Text>
            <Text style={styles.statLabel}>High Risk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#fef3c7' }]}
            onPress={() => router.push('/(doctor)/(tabs)/alerts')}
          >
            <Activity size={24} color="#f59e0b" />
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {stats.pendingAlerts}
            </Text>
            <Text style={styles.statLabel}>Pending Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <Clock size={24} color="#22c55e" />
            <Text style={[styles.statNumber, { color: '#22c55e' }]}>
              {stats.appointmentsToday}
            </Text>
            <Text style={styles.statLabel}>Today's Appts</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(doctor)/(tabs)/alerts')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Activity size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No pending alerts</Text>
            </View>
          ) : (
            recentAlerts.map((alert) => (
              <TouchableOpacity key={alert.id} style={styles.alertCard}>
                <View
                  style={[
                    styles.alertIndicator,
                    { backgroundColor: getSeverityColor(alert.severity) },
                  ]}
                />
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.patientName}>{alert.patientName}</Text>
                    <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
                  </View>
                  <Text style={styles.alertType}>{alert.alertType}</Text>
                  <Text style={styles.alertMessage} numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(doctor)/(tabs)/patients')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Users size={24} color="#2563eb" />
              </View>
              <Text style={styles.actionText}>View Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(doctor)/(tabs)/messages')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Heart size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>Send Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <TrendingUp size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                <Baby size={24} color="#9333ea" />
              </View>
              <Text style={styles.actionText}>Add Patient</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  alertType: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
    paddingBottom: 32,
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});
