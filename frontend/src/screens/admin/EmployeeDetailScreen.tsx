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
import { employeeService, Employee } from '../../services/employeeService';

const ALL_PERMISSIONS = [
  'VIEW_PRODUCTS', 'VIEW_STOCK', 'MANAGE_PRODUCTS',
  'CREATE_SALE', 'MANAGE_SALES', 'MANAGE_CUSTOMERS',
  'MANAGE_DELIVERIES', 'VIEW_PAYMENTS', 'MANAGE_PAYMENTS',
  'VIEW_EXPENSES', 'VIEW_PROFIT', 'VIEW_REPORTS'
];

export default function EmployeeDetailScreen({ navigation, route }: any) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPasswordText, setShowResetPasswordText] = useState(false); // 👈 NEW

  const getRoleName = (permissions: string[]) => {
    if (!permissions || permissions.length === 0) return 'No Role';
    if (permissions.includes('VIEW_PAYMENTS') && permissions.includes('VIEW_PROFIT')) return 'Accountant';
    if (permissions.includes('MANAGE_DELIVERIES') && !permissions.includes('CREATE_SALE')) return 'Delivery Boy';
    if (permissions.includes('MANAGE_PRODUCTS') && permissions.includes('VIEW_STOCK')) return 'Store Manager';
    if (permissions.includes('CREATE_SALE') && permissions.includes('MANAGE_CUSTOMERS')) return 'Cashier';
    if (permissions.includes('CREATE_SALE')) return 'Sales Staff';
    return 'Employee';
  };

  useEffect(() => {
    loadEmployee();
  }, []);

  const loadEmployee = async () => {
    try {
      const response = await employeeService.getOne(employeeId);
      if (response.success) {
        setEmployee(response.data);
        setEditData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Deactivate Employee',
      `Deactivate ${employee?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await employeeService.delete(employeeId);
              if (response.success) {
                Alert.alert('Success', 'Employee deactivated');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate');
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      const response = await employeeService.update(employeeId, editData);
      if (response.success) {
        setEmployee(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Employee updated');
        loadEmployee();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    try {
      const response = await employeeService.resetPassword(employeeId, newPassword);
      if (response.success) {
        Alert.alert('Success', 'Password reset successfully');
        setShowResetPassword(false);
        setNewPassword('');
        setShowResetPasswordText(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const togglePermission = (perm: string) => {
    const perms = editData.permissions || [];
    const newPerms = perms.includes(perm)
      ? perms.filter((p) => p !== perm)
      : [...perms, perm];
    setEditData({ ...editData, permissions: newPerms });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#2e7d32';
      case 'INVITED': return '#f57c00';
      case 'DEACTIVATED': return '#d32f2f';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.centered}>
        <Text>Employee not found</Text>
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

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageTitleContainer}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>📄 Employee Details</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.actionButton}>
                <Ionicons name={isEditing ? 'close' : 'pencil'} size={22} color="#1a237e" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={22} color="#d32f2f" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowResetPassword(!showResetPassword)} style={styles.actionButton}>
                <Ionicons name="key" size={22} color="#f57c00" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <View>
              <Text style={styles.editTitle}>✏️ Edit Employee</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.name}
                  onChangeText={(v) => setEditData({ ...editData, name: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Employee ID</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.employee_id}
                  onChangeText={(v) => setEditData({ ...editData, employee_id: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Phone</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.phone}
                  onChangeText={(v) => setEditData({ ...editData, phone: v })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Email</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.email}
                  onChangeText={(v) => setEditData({ ...editData, email: v })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[styles.statusOption, editData.status === 'ACTIVE' && styles.statusActive]}
                    onPress={() => setEditData({ ...editData, status: 'ACTIVE' })}
                  >
                    <Text style={[styles.statusOptionText, editData.status === 'ACTIVE' && styles.statusOptionTextActive]}>
                      ACTIVE
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, editData.status === 'INVITED' && styles.statusInvited]}
                    onPress={() => setEditData({ ...editData, status: 'INVITED' })}
                  >
                    <Text style={[styles.statusOptionText, editData.status === 'INVITED' && styles.statusOptionTextActive]}>
                      INVITED
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, editData.status === 'DEACTIVATED' && styles.statusDeactivated]}
                    onPress={() => setEditData({ ...editData, status: 'DEACTIVATED' })}
                  >
                    <Text style={[styles.statusOptionText, editData.status === 'DEACTIVATED' && styles.statusOptionTextActive]}>
                      DEACTIVATED
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Permissions</Text>
                <View style={styles.permissionGrid}>
                  {ALL_PERMISSIONS.map((perm) => (
                    <TouchableOpacity
                      key={perm}
                      style={[styles.permissionItem, (editData.permissions || []).includes(perm) && styles.permissionSelected]}
                      onPress={() => togglePermission(perm)}
                    >
                      <Text style={[styles.permissionText, (editData.permissions || []).includes(perm) && styles.permissionTextSelected]}>
                        {perm.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeeRole}>👤 {getRoleName(employee.permissions)}</Text>
              <Text style={styles.employeeId}>ID: {employee.employee_id}</Text>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{employee.phone || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{employee.email}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{employee.role || 'EMPLOYEE'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status || 'INVITED') }]}>
                  <Text style={styles.statusText}>{employee.status || 'INVITED'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.permissionsTitle}>Permissions</Text>
              {employee.permissions && employee.permissions.length > 0 ? (
                <View style={styles.permissionsChips}>
                  {employee.permissions.map((perm, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{perm.replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPermissions}>No permissions assigned</Text>
              )}

              {showResetPassword && (
                <View style={styles.resetSection}>
                  <View style={styles.divider} />
                  <Text style={styles.resetTitle}>Reset Password</Text>
                  <View style={styles.resetInputContainer}>
                    <TextInput
                      style={styles.resetInput}
                      placeholder="Enter new password"
                      placeholderTextColor="#999"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showResetPasswordText}
                    />
                    <TouchableOpacity 
                      style={styles.resetEyeIcon}
                      onPress={() => setShowResetPasswordText(!showResetPasswordText)}
                    >
                      <Ionicons 
                        name={showResetPasswordText ? 'eye-off' : 'eye'} 
                        size={22} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a237e',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  employeeRole: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '500',
    marginTop: 2,
  },
  employeeId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  permissionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  permissionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    color: '#1a237e',
    fontWeight: '500',
  },
  noPermissions: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  resetSection: {
    marginTop: 12,
  },
  resetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  resetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  resetInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  resetEyeIcon: {
    padding: 10,
  },
  resetButton: {
    backgroundColor: '#f57c00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 16,
  },
  editRow: {
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#1a237e',
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  statusInvited: {
    backgroundColor: '#fff3e0',
    borderColor: '#f57c00',
  },
  statusDeactivated: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
  permissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionItem: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  permissionSelected: {
    backgroundColor: '#e8eaf6',
    borderColor: '#1a237e',
  },
  permissionText: {
    fontSize: 10,
    color: '#666',
  },
  permissionTextSelected: {
    color: '#1a237e',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});