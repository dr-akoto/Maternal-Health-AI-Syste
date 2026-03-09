import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  Bell,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Edit,
} from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { medicationReminderService, MedicationReminder, MedicationLog, COMMON_PREGNANCY_MEDICATIONS } from '../../../services/medicationReminderService';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<{ reminder: any; times: { time: string; status: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationReminder | null>(null);
  
  // Add medication form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'once_daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'as_needed'>('once_daily');
  const [instructions, setInstructions] = useState('');
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [meds, schedule] = await Promise.all([
        medicationReminderService.getReminders(user.id),
        medicationReminderService.getTodaySchedule(user.id),
      ]);
      
      setMedications(meds);
      setTodaySchedule(schedule);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddMedication = async () => {
    if (!user?.id || !medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    try {
      await medicationReminderService.createReminder({
        motherId: user.id,
        medicationName: medicationName.trim(),
        dosage: dosage.trim(),
        frequency,
        instructions: instructions.trim(),
        reminderTimes,
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        category: 'supplement',
      });

      setShowAddModal(false);
      resetForm();
      await loadData();
      Alert.alert('Success', 'Medication added successfully');
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  const handleLogMedication = async (medication: MedicationReminder, taken: boolean) => {
    if (!user?.id) return;

    try {
      await medicationReminderService.logMedication({
        motherId: user.id,
        reminderId: medication.id!,
        status: taken ? 'taken' : 'skipped',
        scheduledTime: new Date().toISOString(),
        takenAt: taken ? new Date().toISOString() : undefined,
        notes: taken ? undefined : 'Skipped by user',
      });

      await loadData();
    } catch (error) {
      console.error('Error logging medication:', error);
      Alert.alert('Error', 'Failed to log medication');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationReminderService.deleteReminder(medicationId);
              await loadData();
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setMedicationName('');
    setDosage('');
    setFrequency('once_daily');
    setInstructions('');
    setReminderTimes(['08:00']);
    setSelectedMedication(null);
  };

  const isMedicationTakenToday = (medicationId: string): boolean => {
    const schedule = todaySchedule.find(s => s.reminder.id === medicationId);
    if (!schedule) return false;
    return schedule.times.some(t => t.status === 'taken');
  };

  const getTakenTodayCount = (): number => {
    return todaySchedule.reduce((count, schedule) => {
      return count + schedule.times.filter(t => t.status === 'taken').length;
    }, 0);
  };

  const getFrequencyLabel = (freq: string): string => {
    const labels: Record<string, string> = {
      once_daily: 'Once daily',
      twice_daily: 'Twice daily',
      three_times_daily: 'Three times daily',
      four_times_daily: 'Four times daily',
      weekly: 'Weekly',
      as_needed: 'As needed',
    };
    return labels[freq] || freq;
  };

  const renderMedicationCard = (medication: MedicationReminder) => {
    const isTaken = isMedicationTakenToday(medication.id!);
    
    return (
      <Card key={medication.id} style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
          <View style={styles.medicationInfo}>
            <View style={[styles.pillIcon, isTaken && styles.pillIconTaken]}>
              <Pill size={20} color={isTaken ? '#fff' : '#EC4899'} />
            </View>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationName}>{medication.medicationName}</Text>
              <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              <View style={styles.frequencyBadge}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.frequencyText}>
                  {getFrequencyLabel(medication.frequency)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.medicationActions}>
            {isTaken ? (
              <View style={styles.takenBadge}>
                <Check size={16} color="#fff" />
                <Text style={styles.takenText}>Taken</Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.takeButton}
                  onPress={() => handleLogMedication(medication, true)}
                >
                  <Check size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleLogMedication(medication, false)}
                >
                  <X size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {medication.instructions && (
          <View style={styles.instructionsContainer}>
            <AlertTriangle size={14} color="#F59E0B" />
            <Text style={styles.instructionsText}>{medication.instructions}</Text>
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMedication(medication.id!)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.subtitle}>Track your prenatal vitamins & medications</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Pill size={24} color="#EC4899" />
            <Text style={styles.statNumber}>{medications.length}</Text>
            <Text style={styles.statLabel}>Medications</Text>
          </Card>
          <Card style={styles.statCard}>
            <Check size={24} color="#10B981" />
            <Text style={styles.statNumber}>
              {getTakenTodayCount()}
            </Text>
            <Text style={styles.statLabel}>Taken Today</Text>
          </Card>
          <Card style={styles.statCard}>
            <Bell size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {medications.filter(m => !isMedicationTakenToday(m.id!)).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
        </View>

        {/* Add Medication Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Medication</Text>
        </TouchableOpacity>

        {/* Medications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Medications</Text>
          {medications.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Pill size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No medications added yet</Text>
              <Text style={styles.emptySubtext}>
                Add your prenatal vitamins and medications to track them
              </Text>
            </Card>
          ) : (
            medications.map(renderMedicationCard)
          )}
        </View>

        {/* Common Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Prenatal Medications</Text>
          <Card style={styles.commonMedsCard}>
            {COMMON_PREGNANCY_MEDICATIONS.slice(0, 5).map((med, index) => (
              <TouchableOpacity
                key={index}
                style={styles.commonMedItem}
                onPress={() => {
                  setMedicationName(med.name);
                  setDosage(med.typicalDosage);
                  setFrequency(med.typicalFrequency as any);
                  setInstructions(med.instructions || '');
                  setShowAddModal(true);
                }}
              >
                <View style={styles.commonMedInfo}>
                  <Text style={styles.commonMedName}>{med.name}</Text>
                  <Text style={styles.commonMedDosage}>{med.typicalDosage}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medication Name *</Text>
                <TextInput
                  style={styles.input}
                  value={medicationName}
                  onChangeText={setMedicationName}
                  placeholder="e.g., Prenatal Vitamins"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g., 1 tablet"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.frequencyOptions}>
                  {(['once_daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        frequency === freq && styles.frequencyOptionActive,
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.frequencyOptionText,
                          frequency === freq && styles.frequencyOptionTextActive,
                        ]}
                      >
                        {getFrequencyLabel(freq)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="e.g., Take with food"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Add Medication"
                onPress={handleAddMedication}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  medicationCard: {
    marginBottom: 12,
    padding: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  pillIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pillIconTaken: {
    backgroundColor: '#10B981',
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  medicationActions: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  takeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  takenText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deleteButton: {
    padding: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  commonMedsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  commonMedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commonMedInfo: {
    flex: 1,
  },
  commonMedName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  commonMedDosage: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  frequencyOptionActive: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  frequencyOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  frequencyOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
});
