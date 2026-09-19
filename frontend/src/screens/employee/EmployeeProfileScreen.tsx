import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';

const getRoleName = (permissions: string[]) => {
  if (!permissions || permissions.length === 0) return 'No Role';
  if (permissions.includes('VIEW_PAYMENTS') && permissions.includes('VIEW_PROFIT')) return 'Accountant';
  if (permissions.includes('MANAGE_DELIVERIES') && !permissions.includes('CREATE_SALE')) return 'Delivery Boy';
  if (permissions.includes('MANAGE_PRODUCTS') && permissions.includes('VIEW_STOCK')) return 'Store Manager';
  if (permissions.includes('CREATE_SALE') && permissions.includes('MANAGE_CUSTOMERS')) return 'Cashier';
  if (permissions.includes('CREATE_SALE')) return 'Sales Staff';
  return 'Employee';
};

export default function EmployeeProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await employeeService.getMyProfile();
      if (response.success) {
        setProfile(response.data);
        setEditData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const data: any = {};
      if (editData.name !== profile.name) data.name = editData.name;
      if (editData.phone !== profile.phone) data.phone = editData.phone;
      if (editData.email !== profile.email) data.email = editData.email;

      if (passwordData.new_password) {
        if (!passwordData.current_password) {
          Alert.alert('Error', 'Current password is required');
          return;
        }
        data.current_password = passwordData.current_password;
        data.new_password = passwordData.new_password;
      }

      const response = await employeeService.updateMyProfile(data);
      if (response.success) {
        Alert.alert('Success', 'Profile updated');
        setIsEditing(false);
        setPasswordData({ current_password: '', new_password: '' });
        loadProfile();
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Header showBack={true} onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>👤 Profile</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0) || 'E'}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.role}>{getRoleName(profile?.permissions)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: profile?.status === 'ACTIVE' ? '#2e7d32' : '#f57c00' }]}>
              <Text style={styles.statusText}>{profile?.status || 'ACTIVE'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {isEditing ? (
            <View>
              <Text style={styles.editTitle}>✏️ Edit Profile</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editData.name}
                  onChangeText={(v) => setEditData({ ...editData, name: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editData.phone}
                  onChangeText={(v) => setEditData({ ...editData, phone: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editData.email}
                  onChangeText={(v) => setEditData({ ...editData, email: v })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.editTitle}>Change Password</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor="#999"
                    value={passwordData.current_password}
                    onChangeText={(v) => setPasswordData({ ...passwordData, current_password: v })}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={passwordData.new_password}
                    onChangeText={(v) => setPasswordData({ ...passwordData, new_password: v })}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setIsEditing(false);
                setPasswordData({ current_password: '', new_password: '' });
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.row}>
                <Text style={styles.label}>Employee ID</Text>
                <Text style={styles.value}>{profile?.employee_id || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{profile?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{profile?.email}</Text>
              </View>

              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pageTitleContainer: {
    backgroundColor: '#e8eaf6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a237e',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 8,
  },
  role: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  editTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeIcon: {
    padding: 10,
  },
  updateButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
});