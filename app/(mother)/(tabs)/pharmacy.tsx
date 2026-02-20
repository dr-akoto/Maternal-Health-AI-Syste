import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { pharmacyService } from '@/services/pharmacyService';
import { Pharmacy, PharmacyOrder } from '@/types/database.types';
import {
  MapPin,
  Phone,
  Clock,
  Package,
  Truck,
  CheckCircle,
  ChevronRight,
  Navigation,
} from 'lucide-react-native';

export default function PharmacyScreen() {
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'nearby' | 'orders'>('nearby');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pharmaciesData, ordersData] = await Promise.all([
        pharmacyService.getNearbyPharmacies(),
        pharmacyService.getMotherOrders(user.id),
      ]);
      setPharmacies(pharmaciesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading pharmacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (pharmacy: Pharmacy) => {
    if (pharmacy.latitude && pharmacy.longitude) {
      const url = `https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location unavailable', 'No coordinates available for this pharmacy');
    }
  };

  const getOrderStatusColor = (status: PharmacyOrder['status']) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'preparing':
        return '#5856D6';
      case 'out_for_delivery':
        return '#34C759';
      case 'delivered':
        return '#30D158';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getOrderStatusLabel = (status: PharmacyOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderPharmacyCard = ({ item }: { item: Pharmacy }) => (
    <View style={styles.pharmacyCard}>
      <View style={styles.pharmacyHeader}>
        <Text style={styles.pharmacyName}>{item.name}</Text>
        {item.delivery_available && (
          <View style={styles.deliveryBadge}>
            <Truck size={12} color="#fff" />
            <Text style={styles.deliveryText}>Delivery</Text>
          </View>
        )}
      </View>

      <View style={styles.pharmacyDetails}>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.address}, {item.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Phone size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        {item.operating_hours && (
          <View style={styles.detailRow}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              {typeof item.operating_hours === 'string' 
                ? item.operating_hours 
                : JSON.stringify(item.operating_hours)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.pharmacyActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCall(item.phone)}
        >
          <Phone size={16} color="#007AFF" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.directionsButton]}
          onPress={() => handleDirections(item)}
        >
          <Navigation size={16} color="#fff" />
          <Text style={styles.directionsButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderCard = ({ item }: { item: PharmacyOrder }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Package size={20} color="#007AFF" />
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{item.tracking_number || item.id.slice(0, 8)}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getOrderStatusLabel(item.status)}</Text>
        </View>
      </View>

      {item.delivery_address && (
        <View style={styles.orderDelivery}>
          <MapPin size={14} color="#8E8E93" />
          <Text style={styles.deliveryAddress} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      )}

      {item.status === 'out_for_delivery' && item.estimated_delivery && (
        <View style={styles.estimatedDelivery}>
          <Truck size={14} color="#34C759" />
          <Text style={styles.estimatedText}>
            Estimated: {new Date(item.estimated_delivery).toLocaleString()}
          </Text>
        </View>
      )}

      {item.status === 'delivered' && item.delivered_at && (
        <View style={styles.deliveredInfo}>
          <CheckCircle size={14} color="#34C759" />
          <Text style={styles.deliveredText}>
            Delivered: {new Date(item.delivered_at).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        {item.total_amount && (
          <Text style={styles.orderTotal}>GH₵{item.total_amount.toFixed(2)}</Text>
        )}
        <ChevronRight size={20} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'nearby' && styles.tabActive]}
          onPress={() => setSelectedTab('nearby')}
        >
          <MapPin size={18} color={selectedTab === 'nearby' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabText, selectedTab === 'nearby' && styles.tabTextActive]}>
            Nearby
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'orders' && styles.tabActive]}
          onPress={() => setSelectedTab('orders')}
        >
          <Package size={18} color={selectedTab === 'orders' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabText, selectedTab === 'orders' && styles.tabTextActive]}>
            My Orders
          </Text>
          {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
            <View style={styles.ordersBadge}>
              <Text style={styles.ordersBadgeText}>
                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {selectedTab === 'nearby' ? (
        <FlatList
          data={pharmacies}
          keyExtractor={(item) => item.id}
          renderItem={renderPharmacyCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MapPin size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No pharmacies found nearby</Text>
              <Text style={styles.emptySubtext}>Try enabling location services</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>Your prescription orders will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { color: '#007AFF' },
  ordersBadge: { backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  ordersBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16 },
  pharmacyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  pharmacyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pharmacyName: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  deliveryText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  pharmacyDetails: { gap: 8, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#666', flex: 1 },
  pharmacyActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  callButton: { backgroundColor: '#E3F2FD' },
  callButtonText: { color: '#007AFF', fontWeight: '600' },
  directionsButton: { backgroundColor: '#007AFF' },
  directionsButtonText: { color: '#fff', fontWeight: '600' },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  orderInfo: { flex: 1, marginLeft: 12 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  orderDate: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  orderDelivery: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliveryAddress: { fontSize: 13, color: '#666', flex: 1 },
  estimatedDelivery: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8, marginBottom: 8 },
  estimatedText: { fontSize: 13, color: '#34C759', fontWeight: '500' },
  deliveredInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliveredText: { fontSize: 13, color: '#34C759' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#C7C7CC', marginTop: 4 },
});
