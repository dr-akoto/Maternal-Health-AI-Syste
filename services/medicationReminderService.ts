/**
 * Medication Reminder Service
 * 
 * Features:
 * - Create and manage medication reminders
 * - Track medication adherence
 * - Send notifications for medication times
 * - Generate adherence reports
 */

import { supabase } from '@/lib/supabase';

export interface MedicationReminder {
  id?: string;
  motherId: string;
  medicationName: string;
  dosage: string;
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'weekly' | 'as_needed';
  reminderTimes: string[]; // Array of times in HH:MM format
  startDate: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
  prescribedBy?: string;
  refillReminder?: boolean;
  refillDate?: string;
  category: 'prenatal_vitamin' | 'iron_supplement' | 'folic_acid' | 'prescription' | 'supplement' | 'other';
}

export interface MedicationLog {
  id?: string;
  reminderId: string;
  motherId: string;
  takenAt?: string;
  scheduledTime: string;
  status: 'taken' | 'skipped' | 'missed' | 'delayed';
  notes?: string;
}

export interface AdherenceStats {
  totalScheduled: number;
  totalTaken: number;
  totalSkipped: number;
  totalMissed: number;
  adherenceRate: number;
  streakDays: number;
}

// Common pregnancy medications
export const COMMON_PREGNANCY_MEDICATIONS: Array<{
  name: string;
  category: MedicationReminder['category'];
  typicalDosage: string;
  typicalFrequency: MedicationReminder['frequency'];
  instructions: string;
  importance: string;
}> = [
  {
    name: 'Prenatal Vitamins',
    category: 'prenatal_vitamin' as const,
    typicalDosage: '1 tablet',
    typicalFrequency: 'once_daily' as const,
    instructions: 'Take with food to reduce nausea',
    importance: 'Essential for baby\'s development, contains folic acid, iron, and other vital nutrients',
  },
  {
    name: 'Folic Acid',
    category: 'folic_acid' as const,
    typicalDosage: '400-800 mcg',
    typicalFrequency: 'once_daily' as const,
    instructions: 'Can be taken with or without food',
    importance: 'Prevents neural tube defects',
  },
  {
    name: 'Iron Supplement',
    category: 'iron_supplement' as const,
    typicalDosage: '27-30 mg',
    typicalFrequency: 'once_daily' as const,
    instructions: 'Take on empty stomach with vitamin C for better absorption. Avoid dairy.',
    importance: 'Prevents anemia and supports increased blood volume',
  },
  {
    name: 'Calcium',
    category: 'supplement' as const,
    typicalDosage: '1000 mg',
    typicalFrequency: 'twice_daily' as const,
    instructions: 'Take separately from iron supplements',
    importance: 'Supports baby\'s bone development',
  },
  {
    name: 'Vitamin D',
    category: 'supplement' as const,
    typicalDosage: '600-1000 IU',
    typicalFrequency: 'once_daily' as const,
    instructions: 'Take with a meal containing fat',
    importance: 'Helps calcium absorption, supports immune system',
  },
  {
    name: 'DHA/Omega-3',
    category: 'supplement' as const,
    typicalDosage: '200-300 mg DHA',
    typicalFrequency: 'once_daily' as const,
    instructions: 'Take with food',
    importance: 'Supports baby\'s brain and eye development',
  },
  {
    name: 'Magnesium',
    category: 'supplement' as const,
    typicalDosage: '350 mg',
    typicalFrequency: 'three_times_daily' as const,
    instructions: 'Take with meals to improve absorption',
    importance: 'Helps reduce leg cramps and supports muscle function',
  },
];

export const medicationReminderService = {
  /**
   * Create a new medication reminder
   */
  async createReminder(reminder: MedicationReminder): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('medication_reminders')
      .insert({
        mother_id: reminder.motherId,
        medication_name: reminder.medicationName,
        dosage: reminder.dosage,
        frequency: reminder.frequency,
        reminder_times: reminder.reminderTimes,
        start_date: reminder.startDate,
        end_date: reminder.endDate,
        instructions: reminder.instructions,
        is_active: reminder.isActive,
        prescribed_by: reminder.prescribedBy,
        refill_reminder: reminder.refillReminder,
        refill_date: reminder.refillDate,
        category: reminder.category,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all reminders for a mother
   */
  async getReminders(motherId: string, activeOnly: boolean = true): Promise<any[]> {
    let query = (supabase as any)
      .from('medication_reminders')
      .select('*')
      .eq('mother_id', motherId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a medication reminder
   */
  async updateReminder(reminderId: string, updates: Partial<MedicationReminder>): Promise<any> {
    const updateData: Record<string, any> = {};
    
    if (updates.medicationName) updateData.medication_name = updates.medicationName;
    if (updates.dosage) updateData.dosage = updates.dosage;
    if (updates.frequency) updateData.frequency = updates.frequency;
    if (updates.reminderTimes) updateData.reminder_times = updates.reminderTimes;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.prescribedBy !== undefined) updateData.prescribed_by = updates.prescribedBy;
    if (updates.refillReminder !== undefined) updateData.refill_reminder = updates.refillReminder;
    if (updates.refillDate !== undefined) updateData.refill_date = updates.refillDate;
    if (updates.category) updateData.category = updates.category;

    const { data, error } = await (supabase as any)
      .from('medication_reminders')
      .update(updateData)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a medication reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('medication_reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;
  },

  /**
   * Log medication taken/skipped
   */
  async logMedication(log: MedicationLog): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('medication_reminder_logs')
      .insert({
        reminder_id: log.reminderId,
        mother_id: log.motherId,
        taken_at: log.takenAt || (log.status === 'taken' ? new Date().toISOString() : null),
        scheduled_time: log.scheduledTime,
        status: log.status,
        notes: log.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get medication logs for a date range
   */
  async getLogs(motherId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('medication_reminder_logs')
      .select(`
        *,
        reminder:medication_reminders(medication_name, dosage, category)
      `)
      .eq('mother_id', motherId)
      .gte('scheduled_time', startDate)
      .lte('scheduled_time', endDate)
      .order('scheduled_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get today's medication schedule
   */
  async getTodaySchedule(motherId: string): Promise<{
    reminder: any;
    times: { time: string; status: 'pending' | 'taken' | 'missed' | 'skipped' }[];
  }[]> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Get active reminders
    const reminders = await this.getReminders(motherId, true);

    // Get today's logs
    const { data: logs } = await (supabase as any)
      .from('medication_reminder_logs')
      .select('*')
      .eq('mother_id', motherId)
      .gte('scheduled_time', today)
      .lt('scheduled_time', tomorrow);

    const logMap = new Map<string, any>();
    logs?.forEach((log: any) => {
      const key = `${log.reminder_id}-${log.scheduled_time}`;
      logMap.set(key, log);
    });

    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    return reminders.map((reminder: any) => {
      const times = reminder.reminder_times.map((time: string) => {
        const scheduledTime = `${today}T${time}:00`;
        const key = `${reminder.id}-${scheduledTime}`;
        const log = logMap.get(key);

        let status: 'pending' | 'taken' | 'missed' | 'skipped' = 'pending';
        if (log) {
          status = log.status;
        } else if (time < currentTime) {
          status = 'missed';
        }

        return { time, status };
      });

      return { reminder, times };
    });
  },

  /**
   * Get adherence statistics
   */
  async getAdherenceStats(motherId: string, days: number = 30): Promise<AdherenceStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: logs, error } = await (supabase as any)
      .from('medication_reminder_logs')
      .select('status')
      .eq('mother_id', motherId)
      .gte('scheduled_time', startDate.toISOString());

    if (error) throw error;

    const stats = {
      totalScheduled: logs?.length || 0,
      totalTaken: logs?.filter((l: any) => l.status === 'taken').length || 0,
      totalSkipped: logs?.filter((l: any) => l.status === 'skipped').length || 0,
      totalMissed: logs?.filter((l: any) => l.status === 'missed').length || 0,
      adherenceRate: 0,
      streakDays: 0,
    };

    if (stats.totalScheduled > 0) {
      stats.adherenceRate = Math.round((stats.totalTaken / stats.totalScheduled) * 100);
    }

    // Calculate streak (consecutive days with all medications taken)
    stats.streakDays = await this.calculateStreak(motherId);

    return stats;
  },

  /**
   * Calculate current adherence streak
   */
  async calculateStreak(motherId: string): Promise<number> {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const { data: dayLogs } = await (supabase as any)
        .from('medication_reminder_logs')
        .select('status')
        .eq('mother_id', motherId)
        .gte('scheduled_time', dateStr)
        .lt('scheduled_time', new Date(checkDate.getTime() + 86400000).toISOString().split('T')[0]);

      if (!dayLogs || dayLogs.length === 0) {
        if (i === 0) continue; // Skip today if no logs yet
        break;
      }

      const allTaken = dayLogs.every((l: any) => l.status === 'taken');
      if (allTaken) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * Get upcoming refills
   */
  async getUpcomingRefills(motherId: string, daysAhead: number = 14): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await (supabase as any)
      .from('medication_reminders')
      .select('*')
      .eq('mother_id', motherId)
      .eq('is_active', true)
      .eq('refill_reminder', true)
      .lte('refill_date', futureDate.toISOString().split('T')[0])
      .order('refill_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Quick add common pregnancy medication
   */
  async quickAddCommonMedication(
    motherId: string,
    medicationName: string,
    reminderTime: string = '08:00'
  ): Promise<any> {
    const common = COMMON_PREGNANCY_MEDICATIONS.find(
      m => m.name.toLowerCase() === medicationName.toLowerCase()
    );

    if (!common) {
      throw new Error('Unknown common medication');
    }

    let reminderTimes: string[];
    switch (common.typicalFrequency) {
      case 'twice_daily':
        reminderTimes = ['08:00', '20:00'];
        break;
      case 'three_times_daily':
        reminderTimes = ['08:00', '14:00', '20:00'];
        break;
      default:
        reminderTimes = [reminderTime];
    }

    return this.createReminder({
      motherId,
      medicationName: common.name,
      dosage: common.typicalDosage,
      frequency: common.typicalFrequency,
      reminderTimes,
      startDate: new Date().toISOString().split('T')[0],
      instructions: common.instructions,
      isActive: true,
      category: common.category,
    });
  },

  /**
   * Get common medications list
   */
  getCommonMedications() {
    return COMMON_PREGNANCY_MEDICATIONS;
  },
};

export default medicationReminderService;
