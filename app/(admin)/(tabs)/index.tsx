import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Building2,
  Brain,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield,
  Database,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { learningSystem } from '@/services/ai/LearningSystem';

interface SystemStats {
  totalUsers: number;
  totalMothers: number;
  totalDoctors: number;
  totalHospitals: number;
  pendingLearningCandidates: number;
  activeEmergencies: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  aiModelVersion: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMothers: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    pendingLearningCandidates: 0,
    activeEmergencies: 0,
    systemHealth: 'healthy',
    aiModelVersion: '1.0.0',
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch user counts
      const { count: motherCount } = await (supabase as any)
        .from('mother_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: doctorCount } = await (supabase as any)
        .from('doctor_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: hospitalCount } = await (supabase as any)
        .from('hospitals')
        .select('*', { count: 'exact', head: true });

      // Fetch pending learning candidates
      const learningStats = await learningSystem.getLearningStats();

      // Fetch active emergencies
      const { count: emergencyCount } = await (supabase as any)
        .from('emergencies')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'dispatched']);

      // Get AI model version
      const modelVersion = await learningSystem.getCurrentModelVersion();

      setStats({
        totalUsers: (motherCount || 0) + (doctorCount || 0),
        totalMothers: motherCount || 0,
        totalDoctors: doctorCount || 0,
        totalHospitals: hospitalCount || 0,
        pendingLearningCandidates: learningStats.pendingReview || 0,
        activeEmergencies: emergencyCount || 0,
        systemHealth: emergencyCount > 5 ? 'warning' : 'healthy',
        aiModelVersion: modelVersion?.version || '1.0.0',
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return '#22c55e';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#dc2626';
      default:
        return '#6b7280';
    }
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
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.adminName}>
              Welcome, {profile?.first_name || 'Admin'}
            </Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: getHealthColor(stats.systemHealth) }]}>
            <Activity size={16} color="#ffffff" />
            <Text style={styles.healthText}>{stats.systemHealth.toUpperCase()}</Text>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
              <Users size={24} color="#2563eb" />
              <Text style={[styles.statNumber, { color: '#2563eb' }]}>
                {stats.totalUsers}
              </Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#fce7f3' }]}>
              <Users size={24} color="#db2777" />
              <Text style={[styles.statNumber, { color: '#db2777' }]}>
                {stats.totalMothers}
              </Text>
              <Text style={styles.statLabel}>Mothers</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <Users size={24} color="#22c55e" />
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {stats.totalDoctors}
              </Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
              <Building2 size={24} color="#9333ea" />
              <Text style={[styles.statNumber, { color: '#9333ea' }]}>
                {stats.totalHospitals}
              </Text>
              <Text style={styles.statLabel}>Hospitals</Text>
            </View>
          </View>
        </View>

        {/* AI Learning Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Learning System</Text>
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiInfo}>
                <Brain size={24} color="#7c3aed" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.aiTitle}>Model Version</Text>
                  <Text style={styles.aiVersion}>{stats.aiModelVersion}</Text>
                </View>
              </View>
              <View style={styles.aiStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.learningStats}>
              <View style={styles.learningStat}>
                <Text style={styles.learningNumber}>{stats.pendingLearningCandidates}</Text>
                <Text style={styles.learningLabel}>Pending Candidates</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.learningStat}>
                <Text style={styles.learningNumber}>94%</Text>
                <Text style={styles.learningLabel}>Accuracy</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.learningStat}>
                <Text style={styles.learningNumber}>1.2k</Text>
                <Text style={styles.learningLabel}>Trained Samples</Text>
              </View>
            </View>

            {stats.pendingLearningCandidates > 0 && (
              <TouchableOpacity style={styles.reviewButton}>
                <Text style={styles.reviewButtonText}>Review Candidates</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Emergencies */}
        {stats.activeEmergencies > 0 && (
          <View style={styles.section}>
            <View style={styles.emergencyBanner}>
              <AlertTriangle size={24} color="#dc2626" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.emergencyTitle}>Active Emergencies</Text>
                <Text style={styles.emergencyText}>
                  {stats.activeEmergencies} emergency{stats.activeEmergencies > 1 ? 'ies' : 'y'} requiring attention
                </Text>
              </View>
              <TouchableOpacity style={styles.emergencyButton}>
                <Text style={styles.emergencyButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Users size={24} color="#2563eb" />
              </View>
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                <Brain size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>AI Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Database size={24} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>Database</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Shield size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Security</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  healthText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
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
  aiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  aiVersion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  learningStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  learningStat: {
    alignItems: 'center',
  },
  learningNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  learningLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  reviewButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  emergencyText: {
    fontSize: 14,
    color: '#991b1b',
    marginTop: 2,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
