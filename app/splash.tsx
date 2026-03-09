import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Baby, Shield, Activity } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { loading, userRole } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the heart
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      }, 2500);
    }
  }, [loading, userRole]);

  return (
    <LinearGradient
      colors={['#10B981', '#059669', '#34D399']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />

      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        {/* Logo Container */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.logoInner}>
            <Heart size={50} color="#fff" fill="#fff" />
          </View>
          <View style={styles.logoRing} />
          <View style={styles.logoRing2} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>MaternalCare</Text>
        <Text style={styles.subtitle}>AI-Powered Health Companion</Text>

        {/* Feature Icons */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Baby size={20} color="#fff" />
            </View>
            <Text style={styles.featureText}>Track</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Activity size={20} color="#fff" />
            </View>
            <Text style={styles.featureText}>Monitor</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Shield size={20} color="#fff" />
            </View>
            <Text style={styles.featureText}>Protect</Text>
          </View>
        </View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View style={[styles.loadingProgress]} />
          </View>
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </View>
      </Animated.View>

      {/* Bottom tagline */}
      <Text style={styles.bottomText}>Caring for mothers, protecting lives</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: height * 0.3,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoRing2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  featuresRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 30,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  loadingBar: {
    width: 150,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    width: '60%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  bottomText: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
