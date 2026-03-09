import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { EmergencyButton } from '@/components/EmergencyButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { emergencyService } from '@/services/emergencyService';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Bell,
  Heart,
  Activity,
  Baby,
  Pill,
  Apple,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { motherProfile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [pregnancyWeek, setPregnancyWeek] = useState(20);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadDashboardData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { icon: AlertCircle, label: 'Report\nSymptoms', color: '#EF4444', bgColor: '#FEE2E2', route: '/(mother)/symptoms/report' },
    { icon: Activity, label: 'Log\nVitals', color: '#3B82F6', bgColor: '#DBEAFE', route: '/(mother)/monitoring/input' },
    { icon: MessageCircle, label: 'AI\nChat', color: '#10B981', bgColor: '#D1FAE5', route: '/(mother)/symptoms/chat' },
    { icon: Baby, label: 'Pregnancy\nTracker', color: '#EC4899', bgColor: '#FCE7F3', route: '/(mother)/(tabs)/pregnancy' },
  ];

  const featureCards = [
    { icon: Pill, title: 'Medications', subtitle: 'Track your prescriptions', color: '#10B981', route: '/(mother)/(tabs)/medications' },
    { icon: Apple, title: 'Nutrition', subtitle: 'Healthy diet guide', color: '#F59E0B', route: '/(mother)/(tabs)/nutrition' },
    { icon: Heart, title: 'Health Monitor', subtitle: 'View your vitals', color: '#EF4444', route: '/(mother)/(tabs)/monitoring' },
    { icon: MessageCircle, title: 'Communication', subtitle: 'Chat with doctor', color: '#10B981', route: '/(mother)/(tabs)/communication' },
  ];

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{motherProfile?.full_name || 'Beautiful Mom'}</Text>
              </View>
              <TouchableOpacity style={styles.notificationBtn}>
                <Bell size={22} color="#fff" />
                {recentNotifications.length > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>

            {/* Pregnancy Progress Card */}
            <View style={styles.pregnancyCard}>
              <View style={styles.pregnancyLeft}>
                <View style={styles.weekBadge}>
                  <Text style={styles.weekNumber}>{pregnancyWeek}</Text>
                  <Text style={styles.weekLabel}>weeks</Text>
                </View>
              </View>
              <View style={styles.pregnancyRight}>
                <Text style={styles.pregnancyTitle}>Your Pregnancy Journey</Text>
                <Text style={styles.pregnancySubtitle}>Second Trimester</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(pregnancyWeek / 40) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{40 - pregnancyWeek} weeks to go</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <Animated.View 
          style={[
            styles.mainContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionItem}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                    <action.icon size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Assistant Card */}
          <TouchableOpacity 
            style={styles.aiCard}
            onPress={() => router.push('/(mother)/symptoms/chat' as any)}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiCardGradient}
            >
              <View style={styles.aiCardContent}>
                <View style={styles.aiIconContainer}>
                  <Sparkles size={28} color="#fff" />
                </View>
                <View style={styles.aiTextContainer}>
                  <Text style={styles.aiCardTitle}>AI Health Assistant</Text>
                  <Text style={styles.aiCardSubtitle}>Get instant answers to your health questions</Text>
                </View>
              </View>
              <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Upcoming Appointments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/(mother)/appointments' as any)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Calendar size={40} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
                <Text style={styles.emptySubtitle}>Schedule your next checkup</Text>
              </View>
            ) : (
              upcomingAppointments.map((appointment, index) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentIcon}>
                    <Calendar size={20} color="#10B981" />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>
                      Dr. {appointment.doctor?.full_name || 'Your Doctor'}
                    </Text>
                    <View style={styles.appointmentMeta}>
                      <Clock size={14} color="#9CA3AF" />
                      <Text style={styles.appointmentDate}>
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>
              ))
            )}
          </View>

          {/* Feature Cards Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Tools</Text>
            <View style={styles.featuresGrid}>
              {featureCards.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCard}
                  onPress={() => router.push(feature.route as any)}
                >
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                    <feature.icon size={24} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Health Tip of the Day */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.tipLabel}>Tip of the Day</Text>
            </View>
            <Text style={styles.tipText}>
              Stay hydrated! Drinking 8-10 glasses of water daily helps maintain amniotic fluid levels and supports your baby's development.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <EmergencyButton onActivate={handleEmergency} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pregnancyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    backdropFilter: 'blur(10px)',
  },
  pregnancyLeft: {
    marginRight: 16,
  },
  weekBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  weekLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: -2,
  },
  pregnancyRight: {
    flex: 1,
    justifyContent: 'center',
  },
  pregnancyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pregnancySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 16,
  },
  aiCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  aiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  appointmentDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 22,
  },
});
