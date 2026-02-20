import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  Apple,
  Droplets,
  Plus,
  Check,
  Coffee,
  Sun,
  Moon,
  Utensils,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
  nutritionGuidanceService,
  NutritionLog,
  NutrientRecommendation,
} from '@/services/nutritionGuidanceService';

export default function NutritionScreen() {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [recommendations, setRecommendations] = useState<NutrientRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealDescription, setMealDescription] = useState('');
  const [vitaminTaken, setVitaminTaken] = useState(false);

  useEffect(() => {
    loadNutritionData();
  }, [user]);

  const loadNutritionData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [logs, water, recs] = await Promise.all([
        nutritionGuidanceService.getTodayLogs(user.id),
        nutritionGuidanceService.getTodayWaterIntake(user.id),
        nutritionGuidanceService.getNutrientRecommendations(2), // Second trimester default
      ]);

      setTodayLogs(logs);
      setWaterIntake(water);
      setRecommendations(recs);
      
      // Check if vitamin was taken today
      const vitaminLog = logs.find(log => 
        log.foodItems?.some((item: string) => item.toLowerCase().includes('vitamin'))
      );
      setVitaminTaken(!!vitaminLog);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!user || !mealDescription.trim()) {
      Alert.alert('Error', 'Please enter a meal description');
      return;
    }

    try {
      await nutritionGuidanceService.logMeal({
        motherId: user.id,
        mealType: selectedMealType,
        foodItems: [mealDescription],
      });

      setMealDescription('');
      setShowAddMeal(false);
      loadNutritionData();
      Alert.alert('Success', 'Meal logged successfully!');
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  const handleLogWater = async () => {
    if (!user) return;

    try {
      // Log water as a meal with water intake
      await nutritionGuidanceService.logMeal({
        motherId: user.id,
        mealType: 'snack',
        foodItems: ['Water'],
        waterIntake: 250, // 250ml glass
      });
      setWaterIntake(prev => prev + 250);
    } catch (error) {
      console.error('Error logging water:', error);
    }
  };

  const handleLogVitamin = async () => {
    if (!user || vitaminTaken) return;

    try {
      await nutritionGuidanceService.logMeal({
        motherId: user.id,
        mealType: 'snack',
        foodItems: ['Prenatal Vitamin'],
        notes: 'Daily prenatal vitamin',
      });
      setVitaminTaken(true);
      Alert.alert('Success', 'Prenatal vitamin logged!');
    } catch (error) {
      console.error('Error logging vitamin:', error);
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return <Coffee size={20} color="#F59E0B" />;
      case 'lunch':
        return <Sun size={20} color="#F59E0B" />;
      case 'dinner':
        return <Moon size={20} color="#6366F1" />;
      default:
        return <Utensils size={20} color="#10B981" />;
    }
  };

  const waterGoal = 2500; // 2.5L daily goal
  const waterProgress = Math.min((waterIntake / waterGoal) * 100, 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Track your meals and hydration</Text>
      </View>

      {/* Water Intake Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Droplets size={24} color="#3B82F6" />
          <Text style={styles.cardTitle}>Water Intake</Text>
        </View>
        <View style={styles.waterProgress}>
          <View style={[styles.waterBar, { width: `${waterProgress}%` }]} />
        </View>
        <Text style={styles.waterText}>
          {waterIntake}ml / {waterGoal}ml
        </Text>
        <TouchableOpacity style={styles.waterButton} onPress={handleLogWater}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.waterButtonText}>Add Glass (250ml)</Text>
        </TouchableOpacity>
      </View>

      {/* Prenatal Vitamin Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Apple size={24} color="#10B981" />
          <Text style={styles.cardTitle}>Prenatal Vitamin</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.vitaminButton,
            vitaminTaken && styles.vitaminButtonTaken,
          ]}
          onPress={handleLogVitamin}
          disabled={vitaminTaken}
        >
          {vitaminTaken ? (
            <>
              <Check size={20} color="#FFF" />
              <Text style={styles.vitaminButtonText}>Taken Today</Text>
            </>
          ) : (
            <>
              <Plus size={20} color="#FFF" />
              <Text style={styles.vitaminButtonText}>Mark as Taken</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Meals */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Utensils size={24} color="#F59E0B" />
          <Text style={styles.cardTitle}>Today's Meals</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMeal(true)}
          >
            <Plus size={20} color="#EC4899" />
          </TouchableOpacity>
        </View>

        {todayLogs.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged today</Text>
        ) : (
          todayLogs.map((log, index) => (
            <View key={log.id || index} style={styles.mealItem}>
              {getMealIcon(log.mealType)}
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>
                  {log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1)}
                </Text>
                <Text style={styles.mealFoods}>
                  {log.foodItems?.join(', ') || 'No details'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log Meal</Text>

            <View style={styles.mealTypeSelector}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === type && styles.mealTypeButtonActive,
                  ]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === type && styles.mealTypeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="What did you eat?"
              value={mealDescription}
              onChangeText={setMealDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddMeal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleLogMeal}>
                <Text style={styles.saveButtonText}>Log Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Nutrient Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Recommendations</Text>
        {recommendations.slice(0, 5).map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.nutrientName}>{rec.nutrient}</Text>
            <Text style={styles.nutrientAmount}>
              {rec.dailyAmount} {rec.unit}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  waterProgress: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  waterBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  waterText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  waterButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  vitaminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  vitaminButtonTaken: {
    backgroundColor: '#6B7280',
  },
  vitaminButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealInfo: {
    marginLeft: 12,
    flex: 1,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  mealFoods: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  mealTypeButtonActive: {
    backgroundColor: '#EC4899',
  },
  mealTypeText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  mealTypeTextActive: {
    color: '#FFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EC4899',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nutrientName: {
    fontSize: 14,
    color: '#374151',
  },
  nutrientAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});
