import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Activity,
  Droplets,
  Weight,
  TrendingUp,
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface VitalReading {
  id: string;
  type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

const VITAL_TYPES = [
  { key: 'blood_pressure_systolic', label: 'Blood Pressure (Sys)', unit: 'mmHg', icon: Heart, color: '#EF4444' },
  { key: 'blood_pressure_diastolic', label: 'Blood Pressure (Dia)', unit: 'mmHg', icon: Heart, color: '#F87171' },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Activity, color: '#10B981' },
  { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets, color: '#F59E0B' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: Weight, color: '#10B981' },
];

export default function MonitoringScreen() {
  const router = useRouter();
  const { motherProfile, user } = useAuth();
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedVital, setSelectedVital] = useState<typeof VITAL_TYPES[0] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVitals();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadVitals = async () => {
    if (!motherProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('mother_id', motherProfile.id)
        .order('recorded_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setVitals(data);
      }
    } catch (error) {
      console.error('Error loading vitals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddVital = async () => {
    if (!selectedVital || !inputValue || !motherProfile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('vital_signs').insert({
        mother_id: motherProfile.id,
        vital_type: selectedVital.key,
        value: parseFloat(inputValue),
        unit: selectedVital.unit,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Vital sign recorded successfully');
      setShowInputModal(false);
      setInputValue('');
      setSelectedVital(null);
      loadVitals();
    } catch (error) {
      console.error('Error saving vital:', error);
      Alert.alert('Error', 'Failed to save vital sign');
    } finally {
      setLoading(false);
    }
  };

  const getLatestVital = (type: string) => {
    return vitals.find((v) => v.type === type);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVitals();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Health Monitor</Text>
            <Text style={styles.headerSubtitle}>Track your vital signs</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowInputModal(true)}
          >
            <Plus size={24} color="#10B981" />
          </TouchableOpacity>
        </LinearGradient>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            {VITAL_TYPES.slice(0, 4).map((vital) => {
              const latest = getLatestVital(vital.key);
              const Icon = vital.icon;
              return (
                <TouchableOpacity
                  key={vital.key}
                  style={styles.statCard}
                  onPress={() => {
                    setSelectedVital(vital);
                    setShowInputModal(true);
                  }}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${vital.color}20` }]}>
                    <Icon size={20} color={vital.color} />
                  </View>
                  <Text style={styles.statLabel}>{vital.label.split(' ')[0]}</Text>
                  <Text style={styles.statValue}>
                    {latest ? `${latest.value}` : '--'}
                  </Text>
                  <Text style={styles.statUnit}>{vital.unit}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recent Readings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Readings</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {vitals.length === 0 ? (
              <View style={styles.emptyState}>
                <Activity size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No readings yet</Text>
                <Text style={styles.emptyText}>
                  Start tracking your vital signs by tapping the + button
                </Text>
              </View>
            ) : (
              vitals.slice(0, 5).map((vital) => {
                const vitalInfo = VITAL_TYPES.find((v) => v.key === vital.type);
                const Icon = vitalInfo?.icon || Activity;
                return (
                  <View key={vital.id} style={styles.readingCard}>
                    <View style={[styles.readingIcon, { backgroundColor: `${vitalInfo?.color || '#10B981'}20` }]}>
                      <Icon size={18} color={vitalInfo?.color || '#10B981'} />
                    </View>
                    <View style={styles.readingContent}>
                      <Text style={styles.readingType}>{vitalInfo?.label || vital.type}</Text>
                      <Text style={styles.readingTime}>
                        {new Date(vital.recorded_at).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.readingValue}>
                      <Text style={styles.readingValueText}>{vital.value}</Text>
                      <Text style={styles.readingUnit}>{vital.unit || vitalInfo?.unit}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Health Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Tips</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Heart size={20} color="#10B981" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Regular Monitoring</Text>
                <Text style={styles.tipText}>
                  Track your blood pressure and other vitals regularly to detect any abnormalities early.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Input Modal */}
      {showInputModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVital ? `Log ${selectedVital.label}` : 'Select Vital Sign'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowInputModal(false);
                  setSelectedVital(null);
                  setInputValue('');
                }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {!selectedVital ? (
              <ScrollView style={styles.vitalTypeList}>
                {VITAL_TYPES.map((vital) => {
                  const Icon = vital.icon;
                  return (
                    <TouchableOpacity
                      key={vital.key}
                      style={styles.vitalTypeItem}
                      onPress={() => setSelectedVital(vital)}
                    >
                      <View style={[styles.vitalTypeIcon, { backgroundColor: `${vital.color}20` }]}>
                        <Icon size={20} color={vital.color} />
                      </View>
                      <Text style={styles.vitalTypeLabel}>{vital.label}</Text>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={`Enter ${selectedVital.label}`}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={styles.unitLabel}>{selectedVital.unit}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleAddVital}
                  disabled={loading || !inputValue}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Saving...' : 'Save Reading'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: -40,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginTop: 24,
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
  seeAllText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  readingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  readingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readingContent: {
    flex: 1,
  },
  readingType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  readingTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  readingValue: {
    alignItems: 'flex-end',
  },
  readingValueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  readingUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  tipText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  vitalTypeList: {
    paddingHorizontal: 24,
  },
  vitalTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vitalTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vitalTypeLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  inputContainer: {
    paddingHorizontal: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 16,
  },
  unitLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
