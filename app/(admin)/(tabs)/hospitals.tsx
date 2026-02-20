import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Users,
  Plus,
  ChevronRight,
  MoreVertical,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  isEmergencyCapable: boolean;
  bedCount: number;
  activePatients: number;
}

export default function HospitalsScreen() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setHospitals(
        data?.map((h: any) => ({
          id: h.id,
          name: h.name,
          address: h.address || '',
          phone: h.phone || '',
          city: h.city || '',
          isEmergencyCapable: h.is_emergency_capable || false,
          bedCount: h.bed_count || 0,
          activePatients: 0,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHospitals();
    setRefreshing(false);
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hospitals</Text>
          <Text style={styles.subtitle}>{hospitals.length} registered hospitals</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Hospital List */}
      <ScrollView
        style={styles.hospitalList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredHospitals.length === 0 ? (
          <View style={styles.emptyState}>
            <Building2 size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No hospitals found</Text>
          </View>
        ) : (
          filteredHospitals.map((hospital) => (
            <TouchableOpacity key={hospital.id} style={styles.hospitalCard}>
              <View style={styles.hospitalHeader}>
                <View style={styles.hospitalIcon}>
                  <Building2 size={24} color="#7c3aed" />
                </View>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  {hospital.isEmergencyCapable && (
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyText}>Emergency Capable</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() =>
                    Alert.alert(
                      hospital.name,
                      'Hospital management options',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Edit', onPress: () => {} },
                        { text: 'View Details', onPress: () => {} },
                        { text: 'Delete', style: 'destructive', onPress: () => {} },
                      ]
                    )
                  }
                >
                  <MoreVertical size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.hospitalDetails}>
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{hospital.city || hospital.address || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Phone size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{hospital.phone || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.hospitalStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{hospital.bedCount}</Text>
                  <Text style={styles.statLabel}>Beds</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{hospital.activePatients}</Text>
                  <Text style={styles.statLabel}>Active Patients</Text>
                </View>
              </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
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
  hospitalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  hospitalCard: {
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
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emergencyBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  emergencyText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  hospitalDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
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
  hospitalStats: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
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
