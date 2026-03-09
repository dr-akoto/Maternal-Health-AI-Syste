import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  Moon,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Phone,
  Heart,
  Baby,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

// Cross-platform alert helper
const showAlert = (
  title: string,
  message: string,
  buttons: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }[]
) => {
  if (Platform.OS === 'web') {
    // For web, use window.confirm for destructive actions
    const confirmButton = buttons.find(b => b.style === 'destructive' || (!b.style && b.text !== 'Cancel'));
    const hasCancel = buttons.some(b => b.style === 'cancel' || b.text === 'Cancel');
    
    if (hasCancel && confirmButton) {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && confirmButton.onPress) {
        confirmButton.onPress();
      }
    } else if (confirmButton?.onPress) {
      confirmButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function MotherSettingsScreen() {
  const { user, motherProfile, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      setShowSignOutModal(true);
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  const performSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowSignOutModal(false);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      showAlert('Error', 'Failed to sign out. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleFeatureNotAvailable = (featureName: string) => {
    showAlert('Coming Soon', `${featureName} will be available in a future update.`, [{ text: 'OK' }]);
  };

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingIcon}>
        <Icon size={20} color="#6b7280" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color="#9ca3af" />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {motherProfile?.full_name?.[0] || 'M'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {motherProfile?.full_name || 'Mom'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Baby size={12} color="#10B981" />
              <Text style={styles.roleText}>Expecting Mother</Text>
            </View>
          </View>
        </View>

        {/* Pregnancy Info */}
        {motherProfile?.pregnancy_week && (
          <View style={styles.pregnancyInfo}>
            <Heart size={18} color="#10B981" />
            <Text style={styles.pregnancyText}>
              Week {motherProfile.pregnancy_week} of pregnancy
            </Text>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={User}
              title="Edit Profile"
              subtitle="Update your information"
              onPress={() => handleFeatureNotAvailable('Edit Profile')}
            />
            <SettingItem
              icon={Shield}
              title="Change Password"
              subtitle="Update your password"
              onPress={() => handleFeatureNotAvailable('Change Password')}
            />
            <SettingItem
              icon={Phone}
              title="Emergency Contact"
              subtitle={motherProfile?.emergency_contact || 'Not set'}
              onPress={() => handleFeatureNotAvailable('Emergency Contact')}
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Bell}
              title="Push Notifications"
              subtitle="Receive alerts on your device"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={notifications ? '#10B981' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon={Bell}
              title="Medication Reminders"
              subtitle="Get reminded to take your medications"
              rightElement={
                <Switch
                  value={medicationReminders}
                  onValueChange={setMedicationReminders}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={medicationReminders ? '#10B981' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon={Bell}
              title="Appointment Reminders"
              subtitle="Never miss a doctor visit"
              rightElement={
                <Switch
                  value={appointmentReminders}
                  onValueChange={setAppointmentReminders}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={appointmentReminders ? '#10B981' : '#f3f4f6'}
                />
              }
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Moon}
              title="Dark Mode"
              subtitle="Use dark theme"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={darkMode ? '#10B981' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon={Globe}
              title="Language"
              subtitle="English"
              onPress={() => handleFeatureNotAvailable('Language Selection')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={HelpCircle}
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => handleFeatureNotAvailable('Help Center')}
            />
            <SettingItem
              icon={FileText}
              title="Terms of Service"
              onPress={() => handleFeatureNotAvailable('Terms of Service')}
            />
            <SettingItem
              icon={Shield}
              title="Privacy Policy"
              onPress={() => handleFeatureNotAvailable('Privacy Policy')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sign Out Modal for Web */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSignOutModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Out</Text>
              <TouchableOpacity onPress={() => setShowSignOutModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSignOutModal(false)}
                disabled={isSigningOut}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.signOutModalButton]}
                onPress={performSignOut}
                disabled={isSigningOut}
              >
                <Text style={styles.signOutModalButtonText}>
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  pregnancyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  pregnancyText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  signOutModalButton: {
    backgroundColor: '#dc2626',
  },
  signOutModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
