import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react-native';
import { api } from '@/lib/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, userRole, loading: authLoading, user, signOut, reloadProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noProfile, setNoProfile] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!authLoading && user && userRole) {
      setLoading(false);
      setNoProfile(false);
      if (userRole === 'mother') {
        router.replace('/(mother)/(tabs)' as any);
      } else if (userRole === 'doctor') {
        router.replace('/(doctor)/(tabs)' as any);
      } else if (userRole === 'admin') {
        router.replace('/(admin)/(tabs)' as any);
      }
    } else if (!authLoading && user && !userRole) {
      setLoading(false);
      setNoProfile(true);
      setError('Your profile was not created. Click below to create it.');
    }
  }, [userRole, authLoading, user]);

  const handleCreateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const { data, error: profileError } = await api.createProfile(fullName);
      if (profileError) {
        throw new Error(profileError.error || 'Failed to create profile');
      }
      setNoProfile(false);
      await reloadProfile();
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message || 'Login failed. Please try again.');
      setLoading(false);
    } else {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Heart size={32} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Sign in to continue your journey</Text>
        </View>
      </LinearGradient>

      {/* Form Container */}
      <KeyboardAvoidingView 
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color="#10B981" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#10B981" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            {noProfile ? (
              <View>
                <TouchableOpacity
                  style={[styles.signInButton, { backgroundColor: '#10B981' }]}
                  onPress={handleCreateProfile}
                  disabled={loading}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.signInButtonText}>
                      {loading ? 'Creating...' : 'Create My Profile'}
                    </Text>
                    <Sparkles size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await signOut();
                    setNoProfile(false);
                    setError('');
                  }}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Sign in with different account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.signInButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                  <ArrowRight size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.signUpText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLink}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    height: height * 0.35,
    paddingTop: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formWrapper: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  signUpButton: {
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signUpLink: {
    color: '#10B981',
    fontWeight: '700',
  },
});
