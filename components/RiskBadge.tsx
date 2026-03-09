import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '@/types/database.types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'small' | 'medium' | 'large';
}

export function RiskBadge({ level, size = 'medium' }: RiskBadgeProps) {
  const config = {
    level_1: { label: 'Low Risk', color: '#34C759' },
    level_2: { label: 'Moderate', color: '#FF9500' },
    level_3: { label: 'High Risk', color: '#FF6B35' },
    level_4: { label: 'Critical', color: '#FF3B30' },
  };

  const { label, color } = config[level];
  const sizeStyles = styles[size];

  return (
    <View style={[styles.badge, { backgroundColor: color }, sizeStyles]}>
      <Text style={[styles.text, styles[`${size}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  small: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  smallText: {
    fontSize: 11,
  },
  medium: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mediumText: {
    fontSize: 13,
  },
  large: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  largeText: {
    fontSize: 15,
  },
});
