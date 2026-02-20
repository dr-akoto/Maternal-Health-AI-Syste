import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { loading, userRole } = useAuth();

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (userRole === 'mother') {
          router.replace('/(mother)/(tabs)' as any);
        } else if (userRole === 'doctor') {
          router.replace('/(doctor)/(tabs)' as any);
        } else if (userRole === 'admin') {
          router.replace('/(admin)/(tabs)' as any);
        } else {
          router.replace('/login');
        }
      }, 2000);
    }
  }, [loading, userRole]);

  return (
    <View style={styles.container}>
      <Heart size={80} color="#007AFF" fill="#007AFF" />
      <Text style={styles.title}>Maternal Health</Text>
      <Text style={styles.subtitle}>Caring for mothers, protecting lives</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
