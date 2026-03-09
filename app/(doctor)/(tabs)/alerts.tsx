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
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Activity,
  Heart,
  Thermometer,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { aiService } from '@/services/aiService';

interface Alert {
  id: string;
  motherId: string;
  patientName: string;
  alertType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: string;
  vitals?: any;
  aiExplanation?: string;
}

export default function AlertsScreen() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [selectedTab]);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('alerts')
        .select(`
          id,
          mother_id,
          alert_type,
          severity,
          message,
          status,
          created_at,
          vitals,
          mother:mother_profiles(first_name, last_name)
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedTab === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedAlerts: Alert[] = data?.map((a: any) => ({
        id: a.id,
        motherId: a.mother_id,
        patientName: a.mother ? `${a.mother.first_name} ${a.mother.last_name}` : 'Unknown',
        alertType: a.alert_type,
        severity: a.severity,
        message: a.message,
        status: a.status,
        createdAt: a.created_at,
        vitals: a.vitals,
      })) || [];

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, status: 'acknowledged' | 'resolved' | 'dismissed') => {
    try {
      const { error } = await (supabase as any)
        .from('alerts')
        .update({
          status,
          updated_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getAIExplanation = async (alert: Alert) => {
    if (alert.aiExplanation) return;

    try {
      const explanation = aiService.getExplanation(
        {
          type: 'alert',
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          vitals: alert.vitals,
        },
        'doctor'
      );

      setAlerts(prev =>
        prev.map(a =>
          a.id === alert.id ? { ...a, aiExplanation: explanation.forClinician.summary } : a
        )
      );
    } catch (error) {
      console.error('Error getting AI explanation:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
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

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#fee2e2';
      case 'high':
        return '#ffedd5';
      case 'medium':
        return '#fef3c7';
      case 'low':
        return '#dcfce7';
      default:
        return '#f3f4f6';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType.toLowerCase()) {
      case 'vital':
      case 'vitals':
        return Activity;
      case 'blood_pressure':
        return Heart;
      case 'temperature':
        return Thermometer;
      default:
        return AlertTriangle;
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
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>
          {alerts.length} {selectedTab === 'pending' ? 'pending' : 'total'} alerts
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Clock size={18} color={selectedTab === 'pending' ? '#2563eb' : '#6b7280'} />
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Activity size={18} color={selectedTab === 'all' ? '#2563eb' : '#6b7280'} />
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert List */}
      <ScrollView
        style={styles.alertList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#22c55e" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'pending'
                ? 'No pending alerts to review'
                : 'No alerts found'}
            </Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.alertType);
            const isExpanded = expandedAlert === alert.id;

            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSeverityColor(alert.severity) },
                ]}
                onPress={() => {
                  setExpandedAlert(isExpanded ? null : alert.id);
                  if (!isExpanded) {
                    getAIExplanation(alert);
                  }
                }}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityBgColor(alert.severity) },
                    ]}
                  >
                    <AlertIcon size={16} color={getSeverityColor(alert.severity)} />
                    <Text
                      style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}
                    >
                      {alert.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
                </View>

                <Text style={styles.patientName}>{alert.patientName}</Text>
                <Text style={styles.alertType}>{alert.alertType}</Text>
                <Text style={styles.alertMessage} numberOfLines={isExpanded ? undefined : 2}>
                  {alert.message}
                </Text>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* AI Explanation */}
                    {alert.aiExplanation && (
                      <View style={styles.aiExplanation}>
                        <Text style={styles.aiExplanationTitle}>AI Analysis</Text>
                        <Text style={styles.aiExplanationText}>{alert.aiExplanation}</Text>
                      </View>
                    )}

                    {/* Vitals Display */}
                    {alert.vitals && (
                      <View style={styles.vitalsContainer}>
                        <Text style={styles.vitalsTitle}>Reported Vitals</Text>
                        <View style={styles.vitalsGrid}>
                          {alert.vitals.blood_pressure && (
                            <View style={styles.vitalItem}>
                              <Heart size={16} color="#dc2626" />
                              <Text style={styles.vitalLabel}>BP</Text>
                              <Text style={styles.vitalValue}>
                                {alert.vitals.blood_pressure}
                              </Text>
                            </View>
                          )}
                          {alert.vitals.heart_rate && (
                            <View style={styles.vitalItem}>
                              <Activity size={16} color="#ea580c" />
                              <Text style={styles.vitalLabel}>HR</Text>
                              <Text style={styles.vitalValue}>
                                {alert.vitals.heart_rate} bpm
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    {alert.status === 'pending' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acknowledgeButton]}
                          onPress={() => updateAlertStatus(alert.id, 'acknowledged')}
                        >
                          <CheckCircle size={18} color="#2563eb" />
                          <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.resolveButton]}
                          onPress={() => updateAlertStatus(alert.id, 'resolved')}
                        >
                          <CheckCircle size={18} color="#ffffff" />
                          <Text style={styles.resolveButtonText}>Resolve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.dismissButton]}
                          onPress={() => updateAlertStatus(alert.id, 'dismissed')}
                        >
                          <XCircle size={18} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {alert.status !== 'pending' && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          Status: {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.expandIndicator}>
                  <ChevronRight
                    size={20}
                    color="#9ca3af"
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: '#dbeafe',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  alertList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  alertType: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  aiExplanation: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  aiExplanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  aiExplanationText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
  vitalsContainer: {
    marginBottom: 12,
  },
  vitalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  vitalValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  acknowledgeButton: {
    backgroundColor: '#dbeafe',
    flex: 1,
    justifyContent: 'center',
  },
  acknowledgeButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  resolveButton: {
    backgroundColor: '#22c55e',
    flex: 1,
    justifyContent: 'center',
  },
  resolveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  dismissButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  expandIndicator: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
