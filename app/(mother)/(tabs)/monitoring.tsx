import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { monitoringService } from '@/services/monitoringService';
import { HeartPulse, Activity, TrendingUp, Plus } from 'lucide-react-native';

export default function MonitoringScreen() {
  const router = useRouter();
  const { motherProfile } = useAuth();
  const [latestVitals, setLatestVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (motherProfile) {
      loadLatestVitals();
    }
  }, [motherProfile]);

  const loadLatestVitals = async () => {
    if (!motherProfile) return;

    try {
      const data = await monitoringService.getLatestVitals(motherProfile.id);
      setLatestVitals(data);
    } catch (error) {
      console.error('Error loading vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Health Monitoring</Text>
          <Text style={styles.subtitle}>Track your vital signs and health data</Text>
        </View>

        <Card style={styles.actionCard}>
          <View style={styles.actionContent}>
            <View>
              <Text style={styles.actionTitle}>Log Vital Signs</Text>
              <Text style={styles.actionSubtitle}>
                Record your blood pressure, heart rate, and more
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(mother)/monitoring/input')}
            >
              <Plus size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Card>

        {latestVitals && (
          <Card style={styles.latestCard}>
            <Text style={styles.cardTitle}>Latest Reading</Text>
            <Text style={styles.timestamp}>
              {new Date(latestVitals.recorded_at).toLocaleString()}
            </Text>

            <View style={styles.vitalsGrid}>
              {latestVitals.systolic_bp && latestVitals.diastolic_bp && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Blood Pressure</Text>
                  <Text style={styles.vitalValue}>
                    {latestVitals.systolic_bp}/{latestVitals.diastolic_bp}
                  </Text>
                  <Text style={styles.vitalUnit}>mmHg</Text>
                </View>
              )}

              {latestVitals.heart_rate && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Heart Rate</Text>
                  <Text style={styles.vitalValue}>
                    {latestVitals.heart_rate}
                  </Text>
                  <Text style={styles.vitalUnit}>bpm</Text>
                </View>
              )}

              {latestVitals.weight && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Weight</Text>
                  <Text style={styles.vitalValue}>{latestVitals.weight}</Text>
                  <Text style={styles.vitalUnit}>kg</Text>
                </View>
              )}

              {latestVitals.temperature && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Temperature</Text>
                  <Text style={styles.vitalValue}>
                    {latestVitals.temperature}
                  </Text>
                  <Text style={styles.vitalUnit}>°C</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <Card>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Trends & History</Text>
            <TouchableOpacity
              onPress={() => router.push('/(mother)/monitoring/history')}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.chartDescription}>
            View your health trends over time
          </Text>
          <Button
            title="View Charts"
            onPress={() => router.push('/(mother)/monitoring/charts')}
            variant="outline"
            style={styles.button}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Connected Devices</Text>
          <Text style={styles.chartDescription}>
            Sync data from wearable devices
          </Text>
          <Button
            title="Manage Devices"
            onPress={() => router.push('/(mother)/monitoring/devices')}
            variant="outline"
            style={styles.button}
          />
        </Card>
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
  actionCard: {
    marginBottom: 16,
    backgroundColor: '#007AFF',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#E5F2FF',
    marginTop: 4,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  vitalUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chartDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
