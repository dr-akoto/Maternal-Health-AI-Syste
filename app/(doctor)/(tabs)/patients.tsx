import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  Baby,
  Calendar,
  Phone,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dueDate: string;
  weekNumber: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastVisit: string;
  alerts: number;
}

export default function PatientsScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, selectedFilter, patients]);

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('mother_profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          due_date,
          risk_level,
          created_at
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPatients: Patient[] = data?.map((p: any) => {
        const dueDate = new Date(p.due_date);
        const today = new Date();
        const weeksPregnant = 40 - Math.floor((dueDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));

        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          phone: p.phone || 'N/A',
          dueDate: p.due_date,
          weekNumber: Math.max(1, Math.min(42, weeksPregnant)),
          riskLevel: p.risk_level || 'low',
          lastVisit: p.created_at,
          alerts: 0,
        };
      }) || [];

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          p.phone.includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((p) => p.riskLevel === selectedFilter);
    }

    setFilteredPatients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return '#fee2e2';
      case 'medium':
        return '#fef3c7';
      case 'low':
        return '#dcfce7';
      default:
        return '#f3f4f6';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>{patients.length} total patients</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter === 'all' ? 'All' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Risk`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Patient List */}
      <ScrollView
        style={styles.patientList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <Baby size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        ) : (
          filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => {
                // Navigate to patient detail
              }}
            >
              <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {patient.firstName} {patient.lastName}
                  </Text>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskBgColor(patient.riskLevel) },
                    ]}
                  >
                    <AlertTriangle size={12} color={getRiskColor(patient.riskLevel)} />
                    <Text
                      style={[styles.riskText, { color: getRiskColor(patient.riskLevel) }]}
                    >
                      {patient.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </View>

              <View style={styles.patientDetails}>
                <View style={styles.detailItem}>
                  <Baby size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Week {patient.weekNumber}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Due: {formatDate(patient.dueDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Phone size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{patient.phone}</Text>
                </View>
              </View>

              {patient.alerts > 0 && (
                <View style={styles.alertBanner}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <Text style={styles.alertBannerText}>
                    {patient.alerts} pending alert{patient.alerts > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  patientList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    gap: 8,
  },
  alertBannerText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
