import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

export interface EmergencyActivation {
  motherId: string;
  description?: string;
  symptoms?: Record<string, any>;
}

export const emergencyService = {
  async activateEmergency(activation: EmergencyActivation): Promise<string> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;

      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          mother_id: activation.motherId,
          status: 'active',
          location_latitude: location?.latitude,
          location_longitude: location?.longitude,
          description: activation.description,
          symptoms: activation.symptoms,
        })
        .select()
        .single();

      if (error) throw error;

      await this.notifyAvailableDoctors(data.id, activation.motherId);

      return data.id;
    } catch (error) {
      console.error('Emergency activation error:', error);
      throw error;
    }
  },

  async notifyAvailableDoctors(emergencyId: string, motherId: string): Promise<void> {
    const { data: doctors } = await supabase
      .from('doctor_profiles')
      .select('user_id, full_name')
      .eq('is_available', true)
      .limit(5);

    if (doctors) {
      const notifications = doctors.map((doctor: { user_id: string; full_name: string }) => ({
        user_id: doctor.user_id,
        title: 'Emergency Alert',
        message: 'A mother has activated an emergency. Immediate response required.',
        type: 'emergency',
        data: { emergency_id: emergencyId, mother_id: motherId },
      }));

      await supabase.from('notifications').insert(notifications);
    }
  },

  async respondToEmergency(
    emergencyId: string,
    doctorId: string,
    actionTaken: string
  ): Promise<void> {
    await supabase.from('emergency_responses').insert({
      emergency_id: emergencyId,
      doctor_id: doctorId,
      action_taken: actionTaken,
    });

    await supabase
      .from('emergencies')
      .update({ status: 'responding', doctor_id: doctorId, responded_at: new Date().toISOString() })
      .eq('id', emergencyId);
  },

  async resolveEmergency(emergencyId: string): Promise<void> {
    await supabase
      .from('emergencies')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', emergencyId);
  },

  async getActiveEmergencies() {
    const { data, error } = await supabase
      .from('emergencies')
      .select(`
        *,
        mother:mother_profiles(full_name, phone, current_risk_level)
      `)
      .in('status', ['active', 'responding'])
      .order('activated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Request ambulance for emergency
   */
  async requestAmbulance(
    emergencyId: string,
    motherId: string,
    pickupLocation: { latitude: number; longitude: number; address?: string },
    destinationHospital?: string
  ): Promise<string> {
    try {
      // Find nearest available ambulance service
      const { data: services } = await supabase
        .from('ambulance_services')
        .select('*')
        .eq('is_active', true);

      let selectedService: { id: string; name?: string; latitude?: number; longitude?: number } | null = null;
      if (services && services.length > 0) {
        // Sort by distance (simplified - would use proper geolocation in production)
        selectedService = services.sort((a: { latitude?: number; longitude?: number }, b: { latitude?: number; longitude?: number }) => {
          const distA = Math.sqrt(
            Math.pow((a.latitude || 0) - pickupLocation.latitude, 2) +
            Math.pow((a.longitude || 0) - pickupLocation.longitude, 2)
          );
          const distB = Math.sqrt(
            Math.pow((b.latitude || 0) - pickupLocation.latitude, 2) +
            Math.pow((b.longitude || 0) - pickupLocation.longitude, 2)
          );
          return distA - distB;
        })[0];
      }

      // Create ambulance request
      const { data, error } = await supabase
        .from('ambulance_requests')
        .insert({
          emergency_id: emergencyId,
          ambulance_service_id: selectedService?.id,
          mother_id: motherId,
          pickup_latitude: pickupLocation.latitude,
          pickup_longitude: pickupLocation.longitude,
          pickup_address: pickupLocation.address,
          destination_hospital: destinationHospital,
          status: 'requested',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify the ambulance service (would integrate with actual dispatch API)
      console.log(`Ambulance requested from ${selectedService?.name || 'nearest service'}`);

      return data.id;
    } catch (error) {
      console.error('Ambulance request error:', error);
      throw error;
    }
  },

  /**
   * Get ambulance request status
   */
  async getAmbulanceStatus(requestId: string) {
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select(`
        *,
        ambulance_service:ambulance_services(name, phone)
      `)
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get nearby ambulance services
   */
  async getNearbyAmbulanceServices(latitude: number, longitude: number, limit: number = 5) {
    const { data, error } = await supabase
      .from('ambulance_services')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    if (data) {
      // Sort by distance and return nearest
      return data
        .map((service: { id: string; latitude?: number; longitude?: number; name?: string; phone?: string }) => ({
          ...service,
          distance: Math.sqrt(
            Math.pow((service.latitude || 0) - latitude, 2) +
            Math.pow((service.longitude || 0) - longitude, 2)
          ),
        }))
        .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
        .slice(0, limit);
    }

    return [];
  },
};
