/**
 * Pregnancy Tracker Service
 * 
 * Features:
 * - Weekly pregnancy tracking
 * - Symptom logging
 * - Weight tracking
 * - Fetal movement counting
 * - Mood and energy tracking
 * - Milestone reminders
 */

import { supabase } from '@/lib/supabase';

export interface WeeklyEntry {
  weekNumber: number;
  weight?: number;
  symptoms?: string[];
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'low' | 'difficult';
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  fetalMovementCount?: number;
  recordedDate?: string;
}

export interface PregnancyMilestone {
  week: number;
  title: string;
  description: string;
  babyDevelopment: string;
  motherChanges: string;
  tips: string[];
  importantTests?: string[];
}

// Pregnancy milestones by week
const PREGNANCY_MILESTONES: PregnancyMilestone[] = [
  {
    week: 4,
    title: 'Early Pregnancy Confirmed',
    description: 'You may just be finding out you\'re pregnant!',
    babyDevelopment: 'The fertilized egg implants in the uterus. The embryo is about the size of a poppy seed.',
    motherChanges: 'You might notice a missed period, fatigue, or breast tenderness.',
    tips: ['Start taking prenatal vitamins with folic acid', 'Avoid alcohol and smoking', 'Schedule your first prenatal appointment'],
    importantTests: ['Home pregnancy test', 'hCG blood test'],
  },
  {
    week: 8,
    title: 'First Prenatal Visit',
    description: 'Time for your first doctor\'s appointment!',
    babyDevelopment: 'Baby is about the size of a raspberry. Arms, legs, and fingers are forming.',
    motherChanges: 'Morning sickness may be at its peak. Increased need to urinate.',
    tips: ['Eat small, frequent meals to help with nausea', 'Stay hydrated', 'Get plenty of rest'],
    importantTests: ['Blood type and Rh factor', 'Complete blood count', 'Urine tests'],
  },
  {
    week: 12,
    title: 'End of First Trimester',
    description: 'You\'ve reached a major milestone!',
    babyDevelopment: 'Baby is about 2 inches long. All major organs are formed and starting to function.',
    motherChanges: 'Morning sickness often begins to ease. You may notice less fatigue.',
    tips: ['Consider sharing your news with others', 'Start thinking about maternity clothes', 'Begin pregnancy exercise routine'],
    importantTests: ['First trimester screening', 'Nuchal translucency ultrasound'],
  },
  {
    week: 16,
    title: 'Second Trimester Begins',
    description: 'Many women feel great during this time!',
    babyDevelopment: 'Baby is about 4-5 inches long. Starting to make facial expressions.',
    motherChanges: 'You may start to show. Increased appetite and energy.',
    tips: ['Enjoy this often more comfortable period', 'Start sleeping on your side', 'Keep exercising regularly'],
  },
  {
    week: 20,
    title: 'Halfway There!',
    description: 'You\'re at the midpoint of your pregnancy.',
    babyDevelopment: 'Baby is about 6 inches long. You might feel first movements (quickening)!',
    motherChanges: 'Your belly is definitely showing. You may feel baby\'s first kicks.',
    tips: ['Enjoy feeling baby move', 'Stay active but don\'t overdo it', 'Start thinking about nursery setup'],
    importantTests: ['Anatomy scan ultrasound', 'Gender can often be determined'],
  },
  {
    week: 24,
    title: 'Viability Milestone',
    description: 'An important developmental milestone for baby.',
    babyDevelopment: 'Baby could survive outside the womb with intensive care. Weighs about 1 pound.',
    motherChanges: 'Braxton Hicks contractions may begin. Backache and leg cramps common.',
    tips: ['Learn the difference between Braxton Hicks and real contractions', 'Wear supportive shoes', 'Consider prenatal massage'],
    importantTests: ['Glucose screening test'],
  },
  {
    week: 28,
    title: 'Third Trimester Begins',
    description: 'The final stretch of your pregnancy!',
    babyDevelopment: 'Baby weighs about 2+ pounds. Eyes can open and close.',
    motherChanges: 'More frequent urination returns. Shortness of breath may occur.',
    tips: ['Start counting baby kicks daily', 'Take childbirth classes', 'Begin setting up baby\'s room'],
    importantTests: ['Rh antibody test if Rh negative', 'Regular blood pressure monitoring'],
  },
  {
    week: 32,
    title: 'Getting Closer',
    description: 'Baby is practicing breathing movements!',
    babyDevelopment: 'Baby weighs about 4 pounds. Bones are hardening but skull remains soft.',
    motherChanges: 'Heartburn and difficulty sleeping are common. Nesting instinct may kick in.',
    tips: ['Pack your hospital bag', 'Finalize birth plan', 'Install car seat'],
    importantTests: ['Non-stress test may begin', 'Group B strep test soon'],
  },
  {
    week: 36,
    title: 'Almost Term',
    description: 'Baby is considered early term at 37 weeks!',
    babyDevelopment: 'Baby weighs about 6 pounds. Head may be moving down into pelvis.',
    motherChanges: 'Baby dropping may make breathing easier but increase pelvic pressure.',
    tips: ['Know the signs of labor', 'Rest when you can', 'Finish last-minute preparations'],
    importantTests: ['Group B strep test', 'Weekly appointments begin'],
  },
  {
    week: 40,
    title: 'Due Date!',
    description: 'Baby is due, though they\'ll come when ready!',
    babyDevelopment: 'Baby is fully developed, about 7-8 pounds and 19-21 inches long.',
    motherChanges: 'You may feel very uncomfortable. Watch for labor signs.',
    tips: ['Stay calm and patient', 'Rest as much as possible', 'Stay in touch with your healthcare provider'],
    importantTests: ['Monitoring if past due date', 'Discuss induction options'],
  },
];

export const pregnancyTrackerService = {
  /**
   * Log a weekly entry
   */
  async logWeeklyEntry(motherId: string, entry: WeeklyEntry): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('pregnancy_tracker')
      .insert({
        mother_id: motherId,
        week_number: entry.weekNumber,
        weight: entry.weight,
        symptoms: entry.symptoms,
        notes: entry.notes,
        mood: entry.mood,
        energy_level: entry.energyLevel,
        sleep_quality: entry.sleepQuality,
        fetal_movement_count: entry.fetalMovementCount,
        recorded_date: entry.recordedDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get tracker history
   */
  async getTrackerHistory(motherId: string, limit: number = 20): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('pregnancy_tracker')
      .select('*')
      .eq('mother_id', motherId)
      .order('week_number', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get entry for specific week
   */
  async getWeekEntry(motherId: string, weekNumber: number): Promise<any | null> {
    const { data, error } = await (supabase as any)
      .from('pregnancy_tracker')
      .select('*')
      .eq('mother_id', motherId)
      .eq('week_number', weekNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get pregnancy milestone information for a week
   */
  getMilestone(weekNumber: number): PregnancyMilestone | null {
    // Find the milestone for this week or the most recent one
    const milestone = PREGNANCY_MILESTONES.find(m => m.week === weekNumber);
    if (milestone) return milestone;

    // Find the most recent milestone before this week
    const previousMilestones = PREGNANCY_MILESTONES.filter(m => m.week < weekNumber);
    if (previousMilestones.length > 0) {
      return previousMilestones[previousMilestones.length - 1];
    }

    return PREGNANCY_MILESTONES[0];
  },

  /**
   * Get upcoming milestones
   */
  getUpcomingMilestones(currentWeek: number, count: number = 3): PregnancyMilestone[] {
    return PREGNANCY_MILESTONES
      .filter(m => m.week >= currentWeek)
      .slice(0, count);
  },

  /**
   * Get weight trend data
   */
  async getWeightTrend(motherId: string): Promise<{ week: number; weight: number }[]> {
    const { data, error } = await (supabase as any)
      .from('pregnancy_tracker')
      .select('week_number, weight')
      .eq('mother_id', motherId)
      .not('weight', 'is', null)
      .order('week_number', { ascending: true });

    if (error) throw error;
    return data?.map((d: any) => ({ week: d.week_number, weight: d.weight })) || [];
  },

  /**
   * Get fetal movement trends
   */
  async getMovementTrend(motherId: string, days: number = 14): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await (supabase as any)
      .from('pregnancy_tracker')
      .select('recorded_date, fetal_movement_count, week_number')
      .eq('mother_id', motherId)
      .gte('recorded_date', startDate.toISOString().split('T')[0])
      .not('fetal_movement_count', 'is', null)
      .order('recorded_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calculate due date from last menstrual period
   */
  calculateDueDate(lastMenstrualPeriod: Date): Date {
    const dueDate = new Date(lastMenstrualPeriod);
    dueDate.setDate(dueDate.getDate() + 280); // 40 weeks
    return dueDate;
  },

  /**
   * Calculate current pregnancy week
   */
  calculateCurrentWeek(dueDate: Date): number {
    const today = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weeksPregnant = 40 - Math.floor(daysUntilDue / 7);
    return Math.max(1, Math.min(42, weeksPregnant));
  },

  /**
   * Get baby size comparison for week
   */
  getBabySizeComparison(week: number): string {
    const sizes: Record<number, string> = {
      4: 'poppy seed',
      5: 'sesame seed',
      6: 'lentil',
      7: 'blueberry',
      8: 'raspberry',
      9: 'grape',
      10: 'kumquat',
      11: 'fig',
      12: 'lime',
      13: 'lemon',
      14: 'nectarine',
      15: 'apple',
      16: 'avocado',
      17: 'pear',
      18: 'sweet potato',
      19: 'mango',
      20: 'banana',
      21: 'carrot',
      22: 'papaya',
      23: 'grapefruit',
      24: 'cantaloupe',
      25: 'cauliflower',
      26: 'lettuce head',
      27: 'cabbage',
      28: 'eggplant',
      29: 'butternut squash',
      30: 'coconut',
      31: 'pineapple',
      32: 'squash',
      33: 'celery',
      34: 'cantaloupe',
      35: 'honeydew melon',
      36: 'romaine lettuce',
      37: 'winter melon',
      38: 'leek',
      39: 'mini watermelon',
      40: 'small pumpkin',
    };

    return sizes[week] || 'growing baby';
  },

  /**
   * Get trimester from week
   */
  getTrimester(week: number): { number: 1 | 2 | 3; name: string; weeksRemaining: number } {
    if (week <= 12) {
      return { number: 1, name: 'First Trimester', weeksRemaining: 12 - week };
    } else if (week <= 27) {
      return { number: 2, name: 'Second Trimester', weeksRemaining: 27 - week };
    } else {
      return { number: 3, name: 'Third Trimester', weeksRemaining: 40 - week };
    }
  },
};

export default pregnancyTrackerService;
