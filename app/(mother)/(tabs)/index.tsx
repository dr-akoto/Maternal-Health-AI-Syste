import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmergencyButton } from '@/components/EmergencyButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { emergencyService } from '@/services/emergencyService';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Bell,
  FileText,
  BookOpen,
  Settings,
  AlertCircle,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { motherProfile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [motherProfile]);

  const loadDashboardData = async () => {
    if (!motherProfile) return;

    try {
      const [appointmentsRes, notificationsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, doctor:doctor_profiles(full_name)')
          .eq('mother_id', motherProfile.id)
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(3),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user?.id)
          .order('sent_at', { ascending: false })
          .limit(5),
      ]);

      if (appointmentsRes.data) setUpcomingAppointments(appointmentsRes.data);
      if (notificationsRes.data) setRecentNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEmergency = async () => {
    if (!motherProfile) return;

    try {
      await emergencyService.activateEmergency({
        motherId: motherProfile.id,
        description: 'Emergency activated from dashboard',
      });

      alert('Emergency services have been notified. Help is on the way.');
    } catch (error) {
      console.error('Emergency activation error:', error);
      alert('Failed to activate emergency. Please call emergency services directly.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{motherProfile?.full_name || 'User'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(mother)/settings')}
            style={styles.settingsButton}
          >
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(mother)/symptoms/report')}
            >
              <AlertCircle size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Report Symptoms</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(mother)/monitoring/input')}
            >
              <AlertCircle size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Log Vitals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(mother)/education')}
            >
              <BookOpen size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Learn</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.appointmentsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/(mother)/appointments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          ) : (
            upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <Calendar size={20} color="#007AFF" />
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>
                    Dr. {appointment.doctor?.full_name}
                  </Text>
                  <Text style={styles.appointmentDate}>
                    {new Date(appointment.appointment_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.notificationsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity onPress={() => router.push('/(mother)/notifications')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentNotifications.length === 0 ? (
            <Text style={styles.emptyText}>No new notifications</Text>
          ) : (
            recentNotifications.slice(0, 3).map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <Bell size={16} color="#666" />
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/(mother)/records')}
          >
            <FileText size={24} color="#007AFF" />
            <Text style={styles.linkText}>Medical Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/(mother)/education')}
          >
            <BookOpen size={24} color="#007AFF" />
            <Text style={styles.linkText}>Education Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EmergencyButton onActivate={handleEmergency} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  appointmentsCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationsCard: {
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notificationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  linksContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
