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
import { supplierService, Supplier } from '../../services/supplierService';

export default function SupplierDetailScreen({ navigation, route }: any) {
  const { supplierId } = route.params;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    loadSupplier();
  }, []);

  const loadSupplier = async () => {
    try {
      const response = await supplierService.getOne(supplierId);
      if (response.success) {
        setSupplier(response.data);
        setEditData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier?.supplier_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await supplierService.delete(supplierId);
              if (response.success) {
                Alert.alert('Success', 'Supplier deleted successfully', [
                  { text: 'OK', onPress: () => navigation.navigate('SupplierList') }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete supplier');
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      const response = await supplierService.update(supplierId, editData);
      if (response.success) {
        setSupplier(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Supplier updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update supplier');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.centered}>
        <Text>Supplier not found</Text>
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageTitleContainer}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>📄 Supplier Details</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.actionButton}>
                <Ionicons name={isEditing ? 'close' : 'pencil'} size={22} color="#1a237e" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={22} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <View>
              <Text style={styles.editTitle}>✏️ Edit Supplier</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.supplier_name}
                  onChangeText={(v) => setEditData({ ...editData, supplier_name: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Company Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.company_name}
                  onChangeText={(v) => setEditData({ ...editData, company_name: v })}
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
                <Text style={styles.editLabel}>Address</Text>
                <TextInput
                  style={[styles.editInput, styles.textArea]}
                  value={editData.address}
                  onChangeText={(v) => setEditData({ ...editData, address: v })}
                  multiline
                  numberOfLines={3}
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
                    style={[styles.statusOption, editData.status === 'INACTIVE' && styles.statusInactive]}
                    onPress={() => setEditData({ ...editData, status: 'INACTIVE' })}
                  >
                    <Text style={[styles.statusOptionText, editData.status === 'INACTIVE' && styles.statusOptionTextActive]}>
                      INACTIVE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Update Supplier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.supplierName}>{supplier.supplier_name}</Text>
              {supplier.company_name && (
                <Text style={styles.companyName}>{supplier.company_name}</Text>
              )}

              <View style={styles.divider} />

              {supplier.phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{supplier.phone}</Text>
                </View>
              )}
              {supplier.email && (
                <View style={styles.row}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{supplier.email}</Text>
                </View>
              )}
              {supplier.address && (
                <View style={styles.row}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{supplier.address}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Text style={[styles.value, styles.status]}>
                  {supplier.status || 'ACTIVE'}
                </Text>
              </View>
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
  },
  actionButton: {
    padding: 4,
    marginLeft: 12,
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
  supplierName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  status: {
    color: '#2e7d32',
    fontWeight: '700',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#1a237e',
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