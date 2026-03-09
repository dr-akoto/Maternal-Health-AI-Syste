import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  AlertCircle,
  Thermometer,
  Heart,
  Activity,
  Droplets,
  Moon,
  Zap,
  Send,
  CheckCircle,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const SYMPTOM_CATEGORIES = [
  {
    id: 'pain',
    name: 'Pain & Discomfort',
    icon: Zap,
    color: '#EF4444',
    symptoms: ['Headache', 'Back Pain', 'Abdominal Pain', 'Cramps', 'Pelvic Pressure'],
  },
  {
    id: 'digestive',
    name: 'Digestive',
    icon: Droplets,
    color: '#10B981',
    symptoms: ['Nausea', 'Vomiting', 'Heartburn', 'Constipation', 'Diarrhea'],
  },
  {
    id: 'fatigue',
    name: 'Energy & Sleep',
    icon: Moon,
    color: '#10B981',
    symptoms: ['Fatigue', 'Insomnia', 'Dizziness', 'Weakness', 'Fainting'],
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    icon: Heart,
    color: '#EC4899',
    symptoms: ['Rapid Heartbeat', 'Shortness of Breath', 'Swelling', 'Chest Pain'],
  },
  {
    id: 'other',
    name: 'Other',
    icon: AlertCircle,
    color: '#F59E0B',
    symptoms: ['Fever', 'Bleeding', 'Reduced Baby Movement', 'Vision Changes', 'Severe Itching'],
  },
];

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', color: '#10B981', description: 'Noticeable but manageable' },
  { id: 'moderate', label: 'Moderate', color: '#F59E0B', description: 'Affecting daily activities' },
  { id: 'severe', label: 'Severe', color: '#EF4444', description: 'Very uncomfortable or concerning' },
];

export default function ReportSymptomsScreen() {
  const router = useRouter();
  const { user, motherProfile } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Select Symptoms', 'Please select at least one symptom to report.');
      return;
    }

    if (!severity) {
      Alert.alert('Select Severity', 'Please indicate how severe your symptoms are.');
      return;
    }

    setLoading(true);

    try {
      // Submit symptoms to database
      const { error } = await supabase
        .from('symptoms')
        .insert({
          mother_id: motherProfile?.id,
          symptoms: selectedSymptoms,
          severity,
          description: notes,
        });

      if (error) throw error;

      setSubmitted(true);

      // Check for emergency symptoms
      const emergencySymptoms = ['Bleeding', 'Severe Chest Pain', 'Fainting', 'Reduced Baby Movement'];
      const hasEmergency = selectedSymptoms.some((s) => emergencySymptoms.includes(s));

      if (hasEmergency || severity === 'severe') {
        Alert.alert(
          '⚠️ Important Notice',
          'Based on your symptoms, we recommend contacting your healthcare provider immediately. Would you like to send an alert to your doctor?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Alert Doctor',
              onPress: () => {
                // TODO: Send alert to doctor
                Alert.alert('Alert Sent', 'Your doctor has been notified.');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting symptoms:', error);
      Alert.alert('Error', 'Failed to submit symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={60} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Symptoms Reported</Text>
          <Text style={styles.successText}>
            Your symptoms have been recorded. Your healthcare provider will review them and respond if needed.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Report Symptoms</Text>
          <Text style={styles.headerSubtitle}>Tell us how you're feeling</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Symptom Categories */}
        {SYMPTOM_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                <category.icon size={20} color={category.color} />
              </View>
              <Text style={styles.categoryTitle}>{category.name}</Text>
            </View>
            <View style={styles.symptomsGrid}>
              {category.symptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomChip,
                    selectedSymptoms.includes(symptom) && {
                      backgroundColor: category.color,
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text
                    style={[
                      styles.symptomText,
                      selectedSymptoms.includes(symptom) && styles.symptomTextSelected,
                    ]}
                  >
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Severity Selection */}
        <View style={styles.severitySection}>
          <Text style={styles.sectionTitle}>How severe are your symptoms?</Text>
          <View style={styles.severityOptions}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.severityOption,
                  severity === level.id && {
                    borderColor: level.color,
                    backgroundColor: `${level.color}15`,
                  },
                ]}
                onPress={() => setSeverity(level.id)}
              >
                <View style={[styles.severityDot, { backgroundColor: level.color }]} />
                <Text style={styles.severityLabel}>{level.label}</Text>
                <Text style={styles.severityDesc}>{level.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Describe any other details about your symptoms..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Send size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 15,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  symptomText: {
    fontSize: 13,
    color: '#4B5563',
  },
  symptomTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  severitySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  severityOptions: {
    gap: 10,
  },
  severityOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    width: 80,
  },
  severityDesc: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
