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
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, Send, CheckCircle, KeyRound } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

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
    if (success) {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [success]);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await api.forgotPassword(email);

    setLoading(false);

    if (resetError) {
      setError(resetError.error || 'Failed to send reset email');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successContainer}
        >
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          
          <Animated.View 
            style={[
              styles.successContent,
              { transform: [{ scale: successScale }] }
            ]}
          >
            <View style={styles.successIconContainer}>
              <CheckCircle size={60} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to
            </Text>
            <Text style={styles.successEmail}>{email}</Text>
            
            <View style={styles.successHint}>
              <Text style={styles.hintText}>
                Didn't receive the email? Check your spam folder or try again.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.backButtonGradient}
              >
                <ArrowLeft size={20} color="#fff" />
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

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
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <KeyRound size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Forgot Password?</Text>
          <Text style={styles.headerSubtitle}>
            No worries! Enter your email and we'll send you reset instructions.
          </Text>
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
                  placeholder="Enter your registered email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Text>
                <Send size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletText}>1</Text>
                </View>
                <Text style={styles.infoText}>Check your email inbox</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletText}>2</Text>
                </View>
                <Text style={styles.infoText}>Click the reset link in the email</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletText}>3</Text>
                </View>
                <Text style={styles.infoText}>Create your new password</Text>
              </View>
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={16} color="#10B981" />
              <Text style={styles.loginLinkText}>Back to Login</Text>
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
    height: height * 0.38,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 16,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBulletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  loginLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  loginLinkText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  successEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  successHint: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  hintText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backToLoginButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  backToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
