import React, { useState, useRef, useEffect } from 'react';
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
import { Heart, Mail, Lock, Eye, EyeOff, UserPlus, User, Stethoscope, Baby } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'mother' | 'doctor'>('mother');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signUpError } = await signUp(email, password, userType);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Header */}
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
            <UserPlus size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join our maternal health community</Text>
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
            {/* User Type Selection */}
            <Text style={styles.sectionLabel}>I am a:</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === 'mother' && styles.typeButtonActive,
                ]}
                onPress={() => setUserType('mother')}
              >
                <View style={[
                  styles.typeIconContainer,
                  userType === 'mother' && styles.typeIconActive
                ]}>
                  <Baby size={24} color={userType === 'mother' ? '#fff' : '#10B981'} />
                </View>
                <Text style={[
                  styles.typeButtonText,
                  userType === 'mother' && styles.typeButtonTextActive,
                ]}>
                  Expecting Mother
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  userType === 'doctor' && styles.typeButtonActive,
                ]}
                onPress={() => setUserType('doctor')}
              >
                <View style={[
                  styles.typeIconContainer,
                  userType === 'doctor' && styles.typeIconActive
                ]}>
                  <Stethoscope size={24} color={userType === 'doctor' ? '#fff' : '#10B981'} />
                </View>
                <Text style={[
                  styles.typeButtonText,
                  userType === 'doctor' && styles.typeButtonTextActive,
                ]}>
                  Healthcare Provider
                </Text>
              </TouchableOpacity>
            </View>

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
                  placeholder="Create a strong password"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#10B981" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
                <UserPlus size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Link */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.back()}
            >
              <Text style={styles.signInText}>
                Already have an account?{' '}
                <Text style={styles.signInLink}>Sign In</Text>
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
    height: height * 0.3,
    paddingTop: 50,
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
    marginTop: 10,
  },
  logoContainer: {
    width: 65,
    height: 65,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  formWrapper: {
    flex: 1,
    marginTop: -35,
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
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  typeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconActive: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#10B981',
  },
  inputContainer: {
    marginBottom: 16,
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
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: '#10B981',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
  signInButton: {
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signInLink: {
    color: '#10B981',
    fontWeight: '700',
  },
});
