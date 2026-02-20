import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  Database,
  Brain,
  Globe,
  FileText,
  LogOut,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function AdminSettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [aiLearningEnabled, setAiLearningEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleMaintenanceToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Maintenance Mode',
        'This will prevent users from accessing the app. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            style: 'destructive',
            onPress: () => setMaintenanceMode(true),
          },
        ]
      );
    } else {
      setMaintenanceMode(false);
    }
  };

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Icon size={20} color={danger ? '#dc2626' : '#6b7280'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
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
          <Text style={styles.title}>Admin Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.first_name?.[0] || 'A'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Shield size={12} color="#7c3aed" />
              <Text style={styles.roleText}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Bell}
              title="System Notifications"
              subtitle="Receive system alerts and updates"
              rightElement={
                <Switch
                  value={systemNotifications}
                  onValueChange={setSystemNotifications}
                  trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                  thumbColor={systemNotifications ? '#7c3aed' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon={AlertTriangle}
              title="Emergency Alerts"
              subtitle="Critical system alerts"
              rightElement={
                <Switch
                  value={emergencyAlerts}
                  onValueChange={setEmergencyAlerts}
                  trackColor={{ false: '#e5e7eb', true: '#fca5a5' }}
                  thumbColor={emergencyAlerts ? '#dc2626' : '#f3f4f6'}
                />
              }
            />
          </View>
        </View>

        {/* AI Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Brain}
              title="AI Learning"
              subtitle="Enable continuous learning"
              rightElement={
                <Switch
                  value={aiLearningEnabled}
                  onValueChange={setAiLearningEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                  thumbColor={aiLearningEnabled ? '#7c3aed' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon={Database}
              title="Training Data"
              subtitle="Manage AI training datasets"
              onPress={() => {}}
            />
            <SettingItem
              icon={RefreshCw}
              title="Model Updates"
              subtitle="Deploy new AI models"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Shield}
              title="Access Control"
              subtitle="Manage user permissions"
              onPress={() => {}}
            />
            <SettingItem
              icon={FileText}
              title="Audit Logs"
              subtitle="View system activity logs"
              onPress={() => {}}
            />
            <SettingItem
              icon={AlertTriangle}
              title="Maintenance Mode"
              subtitle={maintenanceMode ? 'System is in maintenance' : 'Disable user access'}
              danger={maintenanceMode}
              rightElement={
                <Switch
                  value={maintenanceMode}
                  onValueChange={handleMaintenanceToggle}
                  trackColor={{ false: '#e5e7eb', true: '#fca5a5' }}
                  thumbColor={maintenanceMode ? '#dc2626' : '#f3f4f6'}
                />
              }
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon={Globe}
              title="API Documentation"
              onPress={() => {}}
            />
            <SettingItem
              icon={FileText}
              title="System Information"
              subtitle="Version 1.0.0"
              onPress={() => {}}
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

        <View style={{ height: 100 }} />
      </ScrollView>
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
    backgroundColor: '#7c3aed',
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
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#7c3aed',
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
  settingIconDanger: {
    backgroundColor: '#fee2e2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingTitleDanger: {
    color: '#dc2626',
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
});
