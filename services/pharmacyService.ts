import { supabase } from '@/lib/supabase';
import { Pharmacy, PharmacyOrder, Prescription } from '@/types/database.types';
import * as Location from 'expo-location';

export const pharmacyService = {
  async getNearbyPharmacies(limit: number = 10): Promise<Pharmacy[]> {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;

      if (data) {
        return data.sort((a, b) => {
          const distA = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            a.latitude || 0,
            a.longitude || 0
          );
          const distB = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            b.latitude || 0,
            b.longitude || 0
          );
          return distA - distB;
        });
      }
    }

    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async transmitPrescription(
    prescriptionId: string,
    pharmacyId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('prescriptions')
      .update({ status: 'transmitted', pharmacy_id: pharmacyId })
      .eq('id', prescriptionId);

    if (error) throw error;
  },

  async createOrder(
    prescriptionId: string,
    pharmacyId: string,
    motherId: string,
    deliveryAddress: string
  ): Promise<PharmacyOrder> {
    const { data, error } = await supabase
      .from('pharmacy_orders')
      .insert({
        prescription_id: prescriptionId,
        pharmacy_id: pharmacyId,
        mother_id: motherId,
        delivery_address: deliveryAddress,
        status: 'pending',
        delivery_fee: 5.0,
        tracking_number: 'TRK-' + Date.now(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.transmitPrescription(prescriptionId, pharmacyId);

    return data;
  },

  async getOrderStatus(orderId: string): Promise<PharmacyOrder> {
    const { data, error } = await supabase
      .from('pharmacy_orders')
      .select(`
        *,
        pharmacy:pharmacies(*),
        prescription:prescriptions(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  async getMotherOrders(motherId: string): Promise<PharmacyOrder[]> {
    const { data, error } = await supabase
      .from('pharmacy_orders')
      .select(`
        *,
        pharmacy:pharmacies(*),
        prescription:prescriptions(*)
      `)
      .eq('mother_id', motherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pharmacy_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
  },
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
