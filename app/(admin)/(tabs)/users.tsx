import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Users,
  User,
  Shield,
  ChevronRight,
  MoreVertical,
  Ban,
  CheckCircle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'mother' | 'doctor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'mother' | 'doctor' | 'admin'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedRole, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch mothers
      const { data: mothers } = await (supabase as any)
        .from('mother_profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false });

      // Fetch doctors
      const { data: doctors } = await (supabase as any)
        .from('doctor_profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false });

      const allUsers: UserRecord[] = [
        ...(mothers?.map((m: any) => ({
          id: m.id,
          email: '',
          firstName: m.first_name,
          lastName: m.last_name,
          role: 'mother' as const,
          status: 'active' as const,
          createdAt: m.created_at,
        })) || []),
        ...(doctors?.map((d: any) => ({
          id: d.id,
          email: '',
          firstName: d.first_name,
          lastName: d.last_name,
          role: 'doctor' as const,
          status: 'active' as const,
          createdAt: d.created_at,
        })) || []),
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter((u) => u.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUserAction = (user: UserRecord, action: 'suspend' | 'activate' | 'delete') => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            // Implement user action
            console.log(`${action} user:`, user.id);
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#7c3aed';
      case 'doctor':
        return '#2563eb';
      case 'mother':
        return '#db2777';
      default:
        return '#6b7280';
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#f3e8ff';
      case 'doctor':
        return '#dbeafe';
      case 'mother':
        return '#fce7f3';
      default:
        return '#f3f4f6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>{users.length} total users</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Role Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'mother', 'doctor', 'admin'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterTab, selectedRole === role && styles.filterTabActive]}
            onPress={() => setSelectedRole(role)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedRole === role && styles.filterTabTextActive,
              ]}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User List */}
      <ScrollView
        style={styles.userList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <User size={24} color="#ffffff" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <View style={styles.userMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleBgColor(user.role) },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: user.status === 'active' ? '#dcfce7' : '#fee2e2' },
                    ]}
                  >
                    {user.status === 'active' ? (
                      <CheckCircle size={12} color="#22c55e" />
                    ) : (
                      <Ban size={12} color="#dc2626" />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        { color: user.status === 'active' ? '#22c55e' : '#dc2626' },
                      ]}
                    >
                      {user.status}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() =>
                  Alert.alert(
                    'User Actions',
                    `Manage ${user.firstName} ${user.lastName}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'View Profile', onPress: () => {} },
                      {
                        text: user.status === 'active' ? 'Suspend' : 'Activate',
                        onPress: () =>
                          handleUserAction(
                            user,
                            user.status === 'active' ? 'suspend' : 'activate'
                          ),
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleUserAction(user, 'delete'),
                      },
                    ]
                  )
                }
              >
                <MoreVertical size={20} color="#9ca3af" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
