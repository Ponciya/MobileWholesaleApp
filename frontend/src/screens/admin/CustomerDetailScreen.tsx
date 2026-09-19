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
  Linking, // 👈 NEW
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { customerService, Customer } from '../../services/customerService';
// import { Linking } from 'react-native'; // 👈 Ithu venum

export default function CustomerDetailScreen({ navigation, route }: any) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const response = await customerService.getOne(customerId);
      if (response.success) {
        setCustomer(response.data);
        setEditData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  // 👇 Handle Call
  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Info', 'No phone number available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  // 👇 Handle Email
  const handleEmail = (email: string) => {
    if (!email) {
      Alert.alert('Info', 'No email available');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email');
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await customerService.delete(customerId);
              if (response.success) {
                Alert.alert('Success', 'Customer deleted', [
                  { text: 'OK', onPress: () => navigation.navigate('CustomerList') }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      const response = await customerService.update(customerId, editData);
      if (response.success) {
        setCustomer(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Customer updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centered}>
        <Text>Customer not found</Text>
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
            <Text style={styles.pageTitle}>📄 Customer Details</Text>
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
              <Text style={styles.editTitle}>✏️ Edit Customer</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Name *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.name}
                  onChangeText={(v) => setEditData({ ...editData, name: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Business Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.business_name}
                  onChangeText={(v) => setEditData({ ...editData, business_name: v })}
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
                <Text style={styles.editLabel}>Credit Limit</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.credit_limit?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, credit_limit: parseFloat(v) || 0 })}
                  keyboardType="numeric"
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
                <Text style={styles.updateButtonText}>Update Customer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.business_name && (
                <Text style={styles.businessName}>{customer.business_name}</Text>
              )}

              <View style={styles.divider} />

              {/* 👇 Phone - Clickable */}
              {customer.phone && (
                <TouchableOpacity 
                  style={styles.row} 
                  onPress={() => handleCall(customer.phone!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name="call-outline" size={18} color="#1a237e" />
                    <Text style={styles.label}>Phone</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.value, styles.linkText]}>{customer.phone}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#1a237e" />
                  </View>
                </TouchableOpacity>
              )}

              {/* 👇 Email - Clickable */}
              {customer.email && (
                <TouchableOpacity 
                  style={styles.row} 
                  onPress={() => handleEmail(customer.email!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name="mail-outline" size={18} color="#1a237e" />
                    <Text style={styles.label}>Email</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.value, styles.linkText]}>{customer.email}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#1a237e" />
                  </View>
                </TouchableOpacity>
              )}

              {customer.address && (
                <View style={styles.row}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{customer.address}</Text>
                </View>
              )}
              {customer.credit_limit !== undefined && customer.credit_limit !== null && (
                <View style={styles.row}>
                  <Text style={styles.label}>Credit Limit</Text>
                  <Text style={styles.value}>₹{customer.credit_limit}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Text style={[styles.value, styles.status]}>
                  {customer.status || 'ACTIVE'}
                </Text>
              </View>
            </View>
          )}

  {/* 👇 Payment History Section */}
<View style={styles.divider} />

<View style={styles.paymentHistoryContainer}>
  <View style={styles.paymentHistoryHeader}>
    <Text style={styles.paymentHistoryTitle}>💰 Payment History</Text>
    <TouchableOpacity 
      style={styles.viewAllButton}
      onPress={() => navigation.navigate('PaymentList', { customer_id: customer.id })}
    >
      <Text style={styles.viewAllText}>View All</Text>
      <Ionicons name="chevron-forward" size={16} color="#1a237e" />
    </TouchableOpacity>
  </View>
  
  {/* ✅ Remove summary section - temporarily */}

</View>

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
  customerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  businessName: {
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  linkText: {
    color: '#1a237e',
    textDecorationLine: 'underline',
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

  paymentHistoryContainer: {
    marginTop: 4,
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: '#1a237e',
    fontWeight: '500',
  },
  paymentSummary: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    gap: 20,
  },
  paymentSummaryItem: {
    flex: 1,
  },
  paymentSummaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  paymentSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
});