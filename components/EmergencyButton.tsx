import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface EmergencyButtonProps {
  onActivate: () => void;
}

export function EmergencyButton({ onActivate }: EmergencyButtonProps) {
  const handlePress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to activate emergency mode? This will immediately notify your doctor and emergency contacts.'
      );
      if (confirmed) {
        onActivate();
      }
    } else {
      Alert.alert(
        'Emergency Alert',
        'Are you sure you want to activate emergency mode? This will immediately notify your doctor and emergency contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Activate', onPress: onActivate, style: 'destructive' },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <AlertCircle color="#FFF" size={32} />
      <Text style={styles.text}>EMERGENCY</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#FF3B30',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  text: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
});
