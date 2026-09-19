import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { employeeService } from '../../services/employeeService';

const ROLES = [
  { id: 'cashier', name: 'Cashier', permissions: ['VIEW_PRODUCTS', 'VIEW_STOCK', 'CREATE_SALE', 'MANAGE_CUSTOMERS'] },
  { id: 'delivery', name: 'Delivery Boy', permissions: ['VIEW_PRODUCTS', 'VIEW_STOCK', 'MANAGE_DELIVERIES'] },
  { id: 'accountant', name: 'Accountant', permissions: ['VIEW_PAYMENTS', 'MANAGE_PAYMENTS', 'VIEW_EXPENSES', 'VIEW_PROFIT', 'VIEW_REPORTS'] },
  { id: 'store', name: 'Store Manager', permissions: ['VIEW_PRODUCTS', 'VIEW_STOCK', 'MANAGE_PRODUCTS'] },
  { id: 'sales', name: 'Sales Staff', permissions: ['VIEW_PRODUCTS', 'VIEW_STOCK', 'CREATE_SALE'] },
  { id: 'custom', name: 'Custom', permissions: [] },
];

const ALL_PERMISSIONS = [
  'VIEW_PRODUCTS', 'VIEW_STOCK', 'MANAGE_PRODUCTS',
  'CREATE_SALE', 'MANAGE_SALES', 'MANAGE_CUSTOMERS',
  'MANAGE_DELIVERIES', 'VIEW_PAYMENTS', 'MANAGE_PAYMENTS',
  'VIEW_EXPENSES', 'VIEW_PROFIT', 'VIEW_REPORTS'
];

export default function EmployeeAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    phone: '',
    email: '',
    password: '',
    role: '',
    permissions: [] as string[],
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const selectRole = (role: any) => {
    setFormData({
      ...formData,
      role: role.name,
      permissions: role.permissions,
    });
    setShowRoleModal(false);
  };

  const togglePermission = (perm: string) => {
    const perms = formData.permissions.includes(perm)
      ? formData.permissions.filter((p) => p !== perm)
      : [...formData.permissions, perm];
    setFormData({ ...formData, permissions: perms });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!formData.employee_id.trim()) {
      Alert.alert('Error', 'Employee ID is required');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    if (!formData.role) {
      Alert.alert('Error', 'Role is required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        status: 'INVITED',
      };
      const response = await employeeService.create(data);
      if (response.success) {
        Alert.alert('Success', 'Employee added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add employee');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const RoleModal = () => (
    <Modal visible={showRoleModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.modalItem}
                onPress={() => selectRole(role)}
              >
                <Text style={styles.modalItemText}>{role.name}</Text>
                {role.permissions.length > 0 && (
                  <Text style={styles.modalItemSub}>
                    Permissions: {role.permissions.join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowRoleModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>➕ Add Employee</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => handleChange('name', v)}
              placeholder="e.g. John Doe"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employee ID *</Text>
            <TextInput
              style={styles.input}
              value={formData.employee_id}
              onChangeText={(v) => handleChange('employee_id', v)}
              placeholder="e.g. EMP001"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(v) => handleChange('phone', v)}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              placeholder="e.g. john@example.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* 👇 Password with Eye Icon */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(v) => handleChange('password', v)}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRoleModal(true)}
            >
              <Text style={formData.role ? styles.pickerText : styles.pickerPlaceholder}>
                {formData.role || 'Select role...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {formData.role === 'Custom' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Permissions</Text>
              <View style={styles.permissionGrid}>
                {ALL_PERMISSIONS.map((perm) => (
                  <TouchableOpacity
                    key={perm}
                    style={[styles.permissionItem, formData.permissions.includes(perm) && styles.permissionSelected]}
                    onPress={() => togglePermission(perm)}
                  >
                    <Text style={[styles.permissionText, formData.permissions.includes(perm) && styles.permissionTextSelected]}>
                      {perm.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add Employee</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RoleModal />
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
  form: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
  },
  modalList: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalItemSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalCancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
  },
  permissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionItem: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  permissionSelected: {
    backgroundColor: '#e8eaf6',
    borderColor: '#1a237e',
  },
  permissionText: {
    fontSize: 11,
    color: '#666',
  },
  permissionTextSelected: {
    color: '#1a237e',
    fontWeight: '600',
  },
  // 👇 Password styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
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
});