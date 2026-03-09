/**
 * Nutrition Guidance Service
 * 
 * Features:
 * - Pregnancy nutrition recommendations
 * - Meal logging and tracking
 * - Nutrient intake analysis
 * - Safe/unsafe food guidance
 * - Trimester-specific advice
 */

import { supabase } from '@/lib/supabase';

export interface NutritionLog {
  id?: string;
  motherId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItems: string[];
  portionSize?: string;
  waterIntake?: number; // in ml
  notes?: string;
  loggedAt?: string;
}

export interface NutrientRecommendation {
  nutrient: string;
  dailyAmount: string;
  unit: string;
  importance: string;
  sources: string[];
  trimesterVariation?: { [key: number]: string };
}

export interface FoodSafety {
  food: string;
  status: 'safe' | 'caution' | 'avoid';
  reason: string;
  alternatives?: string[];
}

// Essential nutrients during pregnancy
export const PREGNANCY_NUTRIENTS: NutrientRecommendation[] = [
  {
    nutrient: 'Folic Acid',
    dailyAmount: '600',
    unit: 'mcg',
    importance: 'Prevents neural tube defects, essential for baby\'s brain and spine development',
    sources: ['Leafy greens', 'Fortified cereals', 'Beans', 'Citrus fruits', 'Asparagus'],
    trimesterVariation: {
      1: '600-800 mcg (critical first 12 weeks)',
      2: '600 mcg',
      3: '600 mcg',
    },
  },
  {
    nutrient: 'Iron',
    dailyAmount: '27',
    unit: 'mg',
    importance: 'Supports increased blood volume and prevents anemia',
    sources: ['Red meat', 'Spinach', 'Beans', 'Fortified cereals', 'Dried fruits'],
    trimesterVariation: {
      1: '27 mg',
      2: '27 mg',
      3: '27 mg (needs increase as blood volume peaks)',
    },
  },
  {
    nutrient: 'Calcium',
    dailyAmount: '1000',
    unit: 'mg',
    importance: 'Builds baby\'s bones and teeth, maintains mother\'s bone health',
    sources: ['Dairy products', 'Fortified plant milks', 'Tofu', 'Sardines', 'Almonds'],
  },
  {
    nutrient: 'Vitamin D',
    dailyAmount: '600',
    unit: 'IU',
    importance: 'Helps absorb calcium, supports immune system',
    sources: ['Sunlight exposure', 'Fortified milk', 'Fatty fish', 'Egg yolks'],
  },
  {
    nutrient: 'Protein',
    dailyAmount: '71',
    unit: 'g',
    importance: 'Essential for baby\'s growth, especially brain development',
    sources: ['Lean meats', 'Fish', 'Eggs', 'Dairy', 'Legumes', 'Nuts'],
    trimesterVariation: {
      1: '46 g (same as non-pregnant)',
      2: '71 g (extra 25g needed)',
      3: '71 g',
    },
  },
  {
    nutrient: 'DHA (Omega-3)',
    dailyAmount: '200-300',
    unit: 'mg',
    importance: 'Critical for baby\'s brain and eye development',
    sources: ['Salmon', 'Sardines', 'DHA-fortified eggs', 'Walnuts', 'Flaxseed'],
  },
  {
    nutrient: 'Iodine',
    dailyAmount: '220',
    unit: 'mcg',
    importance: 'Essential for baby\'s brain development and thyroid function',
    sources: ['Iodized salt', 'Seafood', 'Dairy', 'Eggs'],
  },
  {
    nutrient: 'Choline',
    dailyAmount: '450',
    unit: 'mg',
    importance: 'Supports brain development and prevents neural tube defects',
    sources: ['Eggs', 'Beef liver', 'Chicken', 'Fish', 'Soybeans'],
  },
  {
    nutrient: 'Fiber',
    dailyAmount: '28',
    unit: 'g',
    importance: 'Prevents constipation, common during pregnancy',
    sources: ['Whole grains', 'Fruits', 'Vegetables', 'Beans', 'Nuts'],
  },
  {
    nutrient: 'Water',
    dailyAmount: '8-10',
    unit: 'glasses (2.3L)',
    importance: 'Maintains amniotic fluid, prevents dehydration and constipation',
    sources: ['Water', 'Herbal tea', 'Fruits with high water content'],
  },
];

// Food safety guide
export const FOOD_SAFETY_GUIDE: FoodSafety[] = [
  // AVOID
  { food: 'Raw fish/sushi', status: 'avoid', reason: 'Risk of parasites and bacteria', alternatives: ['Cooked fish', 'Vegetable sushi'] },
  { food: 'Raw or undercooked eggs', status: 'avoid', reason: 'Risk of Salmonella', alternatives: ['Fully cooked eggs', 'Pasteurized eggs'] },
  { food: 'Unpasteurized dairy', status: 'avoid', reason: 'Risk of Listeria', alternatives: ['Pasteurized milk and cheese'] },
  { food: 'Soft cheeses (brie, camembert)', status: 'avoid', reason: 'Risk of Listeria unless pasteurized', alternatives: ['Hard cheeses', 'Pasteurized soft cheeses'] },
  { food: 'Deli meats (cold)', status: 'avoid', reason: 'Risk of Listeria', alternatives: ['Heat until steaming', 'Freshly cooked meats'] },
  { food: 'Raw sprouts', status: 'avoid', reason: 'Risk of E. coli and Salmonella', alternatives: ['Cooked sprouts'] },
  { food: 'High mercury fish (shark, swordfish, king mackerel)', status: 'avoid', reason: 'Mercury affects baby\'s brain development', alternatives: ['Salmon', 'Tilapia', 'Shrimp'] },
  { food: 'Alcohol', status: 'avoid', reason: 'Can cause fetal alcohol spectrum disorders', alternatives: ['Mocktails', 'Sparkling water'] },
  { food: 'Excessive caffeine', status: 'avoid', reason: 'Linked to low birth weight. Limit to 200mg/day', alternatives: ['Decaf coffee', 'Herbal tea'] },
  { food: 'Raw or undercooked meat', status: 'avoid', reason: 'Risk of Toxoplasmosis, Salmonella, E. coli', alternatives: ['Well-cooked meat'] },
  
  // CAUTION
  { food: 'Canned tuna', status: 'caution', reason: 'Contains some mercury. Limit to 2-3 servings per week' },
  { food: 'Liver', status: 'caution', reason: 'High in vitamin A which can be harmful in excess' },
  { food: 'Herbal teas', status: 'caution', reason: 'Some herbs may not be safe. Stick to pregnancy-safe varieties' },
  { food: 'Artificial sweeteners', status: 'caution', reason: 'Some are safe in moderation, but limit intake' },
  
  // SAFE
  { food: 'Cooked eggs', status: 'safe', reason: 'Excellent source of protein and choline' },
  { food: 'Pasteurized dairy', status: 'safe', reason: 'Great source of calcium and vitamin D' },
  { food: 'Well-cooked poultry', status: 'safe', reason: 'Lean protein source' },
  { food: 'Fruits and vegetables', status: 'safe', reason: 'Essential vitamins and fiber. Wash thoroughly' },
  { food: 'Whole grains', status: 'safe', reason: 'Good source of fiber, B vitamins, and iron' },
  { food: 'Legumes', status: 'safe', reason: 'Excellent plant protein and iron source' },
  { food: 'Salmon (cooked)', status: 'safe', reason: 'Low mercury, high DHA. 2-3 servings per week is ideal' },
  { food: 'Nuts and seeds', status: 'safe', reason: 'Healthy fats, protein, and minerals' },
];

// Meal suggestions by trimester
export const MEAL_SUGGESTIONS = {
  1: {
    tips: [
      'Eat small, frequent meals to manage nausea',
      'Keep crackers by your bed for morning sickness',
      'Stay hydrated even if you don\'t feel like eating',
      'Focus on foods you can tolerate',
    ],
    breakfastIdeas: ['Dry toast with nut butter', 'Banana smoothie', 'Oatmeal with honey', 'Yogurt with berries'],
    lunchIdeas: ['Chicken soup', 'Avocado toast', 'Rice with vegetables', 'Grilled cheese sandwich'],
    dinnerIdeas: ['Baked potato with vegetables', 'Pasta with tomato sauce', 'Grilled chicken with rice', 'Soup and bread'],
    snackIdeas: ['Crackers', 'Ginger tea', 'Fresh fruit', 'Cheese and crackers'],
  },
  2: {
    tips: [
      'Appetite often increases - this is normal!',
      'Focus on nutrient-dense foods',
      'Include protein at every meal',
      'Eat iron-rich foods with vitamin C for better absorption',
    ],
    breakfastIdeas: ['Eggs with whole grain toast', 'Greek yogurt parfait', 'Spinach omelet', 'Fortified cereal with milk'],
    lunchIdeas: ['Salmon salad', 'Bean and vegetable soup', 'Whole grain wrap with lean meat', 'Quinoa bowl'],
    dinnerIdeas: ['Grilled fish with vegetables', 'Lean beef stir-fry', 'Chicken with sweet potato', 'Lentil curry'],
    snackIdeas: ['Hummus with vegetables', 'Apple with almond butter', 'Trail mix', 'Hard-boiled eggs'],
  },
  3: {
    tips: [
      'Eat smaller, more frequent meals as baby takes up space',
      'Stay hydrated to prevent swelling',
      'Continue focusing on iron and calcium',
      'Include foods that help with constipation (fiber, water)',
    ],
    breakfastIdeas: ['Overnight oats', 'Scrambled eggs with spinach', 'Whole grain pancakes', 'Fruit and nut bowl'],
    lunchIdeas: ['Chicken and vegetable stir-fry', 'Tuna salad on whole grain', 'Black bean soup', 'Mediterranean salad'],
    dinnerIdeas: ['Baked salmon', 'Turkey meatballs with pasta', 'Vegetable curry', 'Grilled chicken breast'],
    snackIdeas: ['Dates (may help with labor)', 'Yogurt', 'Whole grain crackers', 'Fresh fruit'],
  },
};

export const nutritionGuidanceService = {
  /**
   * Log a meal
   */
  async logMeal(log: NutritionLog): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('nutrition_logs')
      .insert({
        mother_id: log.motherId,
        meal_type: log.mealType,
        food_items: log.foodItems,
        portion_size: log.portionSize,
        water_intake: log.waterIntake,
        notes: log.notes,
        logged_at: log.loggedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get nutrition logs for a date range
   */
  async getNutritionLogs(motherId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('nutrition_logs')
      .select('*')
      .eq('mother_id', motherId)
      .gte('logged_at', startDate)
      .lte('logged_at', endDate)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get today's logs
   */
  async getTodayLogs(motherId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return this.getNutritionLogs(motherId, today, tomorrow);
  },

  /**
   * Get water intake for today
   */
  async getTodayWaterIntake(motherId: string): Promise<number> {
    const logs = await this.getTodayLogs(motherId);
    return logs.reduce((total, log) => total + (log.water_intake || 0), 0);
  },

  /**
   * Get nutrient recommendations
   */
  getNutrientRecommendations(trimester?: 1 | 2 | 3): NutrientRecommendation[] {
    if (!trimester) return PREGNANCY_NUTRIENTS;

    return PREGNANCY_NUTRIENTS.map(nutrient => ({
      ...nutrient,
      dailyAmount: nutrient.trimesterVariation?.[trimester] || nutrient.dailyAmount,
    }));
  },

  /**
   * Check food safety
   */
  checkFoodSafety(food: string): FoodSafety | null {
    const normalizedFood = food.toLowerCase();
    return FOOD_SAFETY_GUIDE.find(item => 
      normalizedFood.includes(item.food.toLowerCase()) ||
      item.food.toLowerCase().includes(normalizedFood)
    ) || null;
  },

  /**
   * Get foods to avoid
   */
  getFoodsToAvoid(): FoodSafety[] {
    return FOOD_SAFETY_GUIDE.filter(item => item.status === 'avoid');
  },

  /**
   * Get foods with caution
   */
  getFoodsWithCaution(): FoodSafety[] {
    return FOOD_SAFETY_GUIDE.filter(item => item.status === 'caution');
  },

  /**
   * Get safe foods
   */
  getSafeFoods(): FoodSafety[] {
    return FOOD_SAFETY_GUIDE.filter(item => item.status === 'safe');
  },

  /**
   * Get meal suggestions for trimester
   */
  getMealSuggestions(trimester: 1 | 2 | 3) {
    return MEAL_SUGGESTIONS[trimester];
  },

  /**
   * Get weekly nutrition summary
   */
  async getWeeklySummary(motherId: string): Promise<{
    totalMeals: number;
    mealsByType: Record<string, number>;
    averageWaterIntake: number;
    daysLogged: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const logs = await this.getNutritionLogs(
      motherId, 
      startDate.toISOString(), 
      new Date().toISOString()
    );

    const mealsByType: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    let totalWater = 0;
    const daysSet = new Set<string>();

    logs.forEach(log => {
      mealsByType[log.meal_type] = (mealsByType[log.meal_type] || 0) + 1;
      totalWater += log.water_intake || 0;
      daysSet.add(log.logged_at.split('T')[0]);
    });

    return {
      totalMeals: logs.length,
      mealsByType,
      averageWaterIntake: daysSet.size > 0 ? Math.round(totalWater / daysSet.size) : 0,
      daysLogged: daysSet.size,
    };
  },

  /**
   * Get personalized nutrition tips
   */
  async getPersonalizedTips(motherId: string, currentWeek: number): Promise<string[]> {
    const tips: string[] = [];
    const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3;

    // Trimester-specific tips
    tips.push(...MEAL_SUGGESTIONS[trimester].tips);

    // Check water intake
    const todayWater = await this.getTodayWaterIntake(motherId);
    if (todayWater < 1500) {
      tips.push('💧 Remember to drink more water today! Aim for at least 8 glasses.');
    }

    // Check meal logging
    const todayMeals = await this.getTodayLogs(motherId);
    if (todayMeals.length === 0) {
      tips.push('📝 Start logging your meals to track your nutrition!');
    }

    // Week-specific tips
    if (currentWeek <= 8) {
      tips.push('🍋 If experiencing nausea, try eating ginger or drinking ginger tea.');
    }
    if (currentWeek >= 28) {
      tips.push('🥗 Focus on iron-rich foods as your blood volume is at its peak.');
    }
    if (currentWeek >= 36) {
      tips.push('🌴 Some studies suggest eating dates may help prepare for labor.');
    }

    return tips;
  },

  /**
   * Search food safety
   */
  searchFoodSafety(query: string): FoodSafety[] {
    const normalizedQuery = query.toLowerCase();
    return FOOD_SAFETY_GUIDE.filter(item =>
      item.food.toLowerCase().includes(normalizedQuery) ||
      item.reason.toLowerCase().includes(normalizedQuery)
    );
  },
};

export default nutritionGuidanceService;
