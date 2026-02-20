import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { Activity, MessageCircle, FileText, Brain } from 'lucide-react-native';

export default function SymptomsScreen() {
  const router = useRouter();
  const { motherProfile } = useAuth();
  const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);

  useEffect(() => {
    if (motherProfile) {
      loadRecentSymptoms();
    }
  }, [motherProfile]);

  const loadRecentSymptoms = async () => {
    if (!motherProfile) return;

    const { data } = await supabase
      .from('symptoms')
      .select('*, ai_assessment:ai_assessments(risk_level, recommendations)')
      .eq('mother_id', motherProfile.id)
      .order('reported_at', { ascending: false })
      .limit(5);

    if (data) setRecentSymptoms(data);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Symptom Checker & AI</Text>
          <Text style={styles.subtitle}>
            Report symptoms and get AI-powered health insights
          </Text>
        </View>

        <Card style={styles.mainCard}>
          <Brain size={48} color="#007AFF" />
          <Text style={styles.cardTitle}>AI Health Assistant</Text>
          <Text style={styles.cardDescription}>
            Our AI analyzes your symptoms and provides personalized
            recommendations
          </Text>
          <Button
            title="Report New Symptoms"
            onPress={() => router.push('/(mother)/symptoms/report')}
            style={styles.button}
          />
        </Card>

        <Card style={styles.chatCard}>
          <View style={styles.chatHeader}>
            <MessageCircle size={24} color="#5856D6" />
            <Text style={styles.chatTitle}>AI Chat Assistant</Text>
          </View>
          <Text style={styles.chatDescription}>
            Ask questions about your health and pregnancy
          </Text>
          <Button
            title="Start Chat"
            onPress={() => router.push('/(mother)/symptoms/chat')}
            variant="secondary"
            style={styles.button}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Assessments</Text>
          <TouchableOpacity
            onPress={() => router.push('/(mother)/symptoms/history')}
          >
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentSymptoms.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No symptoms reported yet. Start by reporting your symptoms.
            </Text>
          </Card>
        ) : (
          recentSymptoms.map((symptom) => (
            <Card key={symptom.id} style={styles.symptomCard}>
              <View style={styles.symptomHeader}>
                <Activity size={20} color="#007AFF" />
                <Text style={styles.symptomDate}>
                  {new Date(symptom.reported_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.symptomSeverity}>
                Severity: {symptom.severity}
              </Text>
              {symptom.description && (
                <Text style={styles.symptomDescription}>
                  {symptom.description}
                </Text>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(mother)/symptoms/assessment/${symptom.id}`)
                }
                style={styles.viewDetails}
              >
                <FileText size={16} color="#007AFF" />
                <Text style={styles.viewDetailsText}>View Assessment</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  mainCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  chatCard: {
    marginBottom: 24,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  chatDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  viewAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  symptomCard: {
    marginBottom: 12,
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  symptomSeverity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  symptomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
