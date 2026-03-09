import { supabase } from '@/lib/supabase';
import { VitalSign } from '@/types/database.types';

export interface VitalInput {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  blood_sugar?: number;
  oxygen_saturation?: number;
  notes?: string;
}

export const monitoringService = {
  async recordVitals(motherId: string, vitals: VitalInput): Promise<VitalSign> {
    const { data, error } = await supabase
      .from('vital_signs')
      .insert({
        mother_id: motherId,
        ...vitals,
        source: 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVitalHistory(
    motherId: string,
    limit: number = 30
  ): Promise<VitalSign[]> {
    const { data, error } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('mother_id', motherId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getLatestVitals(motherId: string): Promise<VitalSign | null> {
    const { data, error } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('mother_id', motherId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async syncFromDevice(
    motherId: string,
    deviceId: string,
    vitals: VitalInput[]
  ): Promise<void> {
    const records = vitals.map((vital) => ({
      mother_id: motherId,
      ...vital,
      source: 'device',
      device_id: deviceId,
    }));

    const { error } = await supabase.from('vital_signs').insert(records);

    if (error) throw error;

    await supabase
      .from('monitoring_devices')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('device_id', deviceId);
  },

  async getVitalTrends(motherId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('mother_id', motherId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    return {
      bloodPressure: data.map((v) => ({
        date: v.recorded_at,
        systolic: v.systolic_bp,
        diastolic: v.diastolic_bp,
      })),
      heartRate: data.map((v) => ({
        date: v.recorded_at,
        value: v.heart_rate,
      })),
      weight: data.map((v) => ({
        date: v.recorded_at,
        value: v.weight,
      })),
    };
  },
};
