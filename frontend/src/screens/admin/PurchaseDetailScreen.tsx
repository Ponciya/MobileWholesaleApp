import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { purchaseService, Purchase } from '../../services/purchaseService';

export default function PurchaseDetailScreen({ navigation, route }: any) {
  const { purchaseId } = route.params;
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    quantity: '',
    purchase_price: '',
    notes: '',
  });

  useEffect(() => {
    loadPurchase();
  }, []);

  const loadPurchase = async () => {
    try {
      const response = await purchaseService.getOne(purchaseId);
      if (response.success) {
        const data = response.data;
        // ✅ Normalize status
        if (data.status) {
          data.status = data.status.toUpperCase().trim();
        }
        setPurchase(data);
        setEditData({
          quantity: String(data.quantity || ''),
          purchase_price: String(data.purchase_price || ''),
          notes: data.notes || '',
        });
        console.log('✅ Purchase loaded:', data);
        console.log('📦 Status:', data.status);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark as Received
  const handleMarkReceived = () => {
    if (!purchase) return;
    const status = purchase.status?.toUpperCase() || '';
    if (status === 'RECEIVED' || status === 'CANCELLED') {
      Alert.alert('Info', 'Cannot mark this purchase as received');
      return;
    }

    Alert.alert(
      'Mark as Received',
      'Stock will be increased. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Received',
          onPress: async () => {
            try {
              const response = await purchaseService.updateStatus(purchaseId, 'RECEIVED');
              if (response.success) {
                Alert.alert('Success', 'Purchase received! Stock updated!');
                loadPurchase();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  // ✅ Cancel Order
  const handleCancel = () => {
    if (!purchase) return;
    const status = purchase.status?.toUpperCase() || '';
    if (status === 'RECEIVED') {
      Alert.alert('Info', 'Cannot cancel a received purchase');
      return;
    }
    if (status === 'CANCELLED') {
      Alert.alert('Info', 'Purchase already cancelled');
      return;
    }

    Alert.alert(
      'Cancel Purchase',
      `Cancel this order?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await purchaseService.updateStatus(purchaseId, 'CANCELLED');
              if (response.success) {
                Alert.alert('Success', 'Purchase cancelled');
                loadPurchase();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel purchase');
            }
          }
        }
      ]
    );
  };

  // ✅ Return Items
  const handleReturn = () => {
    if (!purchase) return;
    const status = purchase.status?.toUpperCase() || '';
    if (status !== 'RECEIVED') {
      Alert.alert('Info', 'Only received purchases can be returned');
      return;
    }

    Alert.alert(
      'Return Items',
      `Return ${purchase.quantity} ${purchase.brand} ${purchase.model_name}? Stock will be decreased.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ New
      const response = await purchaseService.returnPurchase(purchaseId);
              if (response.success) {
                Alert.alert('Success', 'Items returned! Stock updated!');
                loadPurchase();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to return items');
            }
          }
        }
      ]
    );
  };

  // ✅ Delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Purchase',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await purchaseService.delete(purchaseId);
              if (response.success) {
                Alert.alert('Success', 'Purchase deleted');
                navigation.navigate('PurchaseList');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  // ✅ Save Edit
  const handleSaveEdit = async () => {
    if (!editData.quantity || parseInt(editData.quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }
    if (!editData.purchase_price || parseFloat(editData.purchase_price) <= 0) {
      Alert.alert('Error', 'Purchase price must be greater than 0');
      return;
    }

    try {
      const response = await purchaseService.update(purchaseId, {
        quantity: parseInt(editData.quantity),
        purchase_price: parseFloat(editData.purchase_price),
        notes: editData.notes,
      });
      if (response.success) {
        Alert.alert('Success', 'Purchase updated');
        setIsEditing(false);
        loadPurchase();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    switch (s) {
      case 'ORDERED': return '#f57c00';
      case 'RECEIVED': return '#2e7d32';
      case 'CANCELLED': return '#d32f2f';
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

  if (!purchase) {
    return (
      <View style={styles.centered}>
        <Text>Purchase not found</Text>
      </View>
    );
  }

  const status = purchase.status?.toUpperCase() || '';
  const isOrdered = status === 'ORDERED';
  const isReceived = status === 'RECEIVED';
  const isCancelled = status === 'CANCELLED';

  // Debug - show status if unknown
  if (!['ORDERED', 'RECEIVED', 'CANCELLED'].includes(status)) {
    console.warn('⚠️ Unknown status:', status);
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
            <Text style={styles.pageTitle}>📄 Purchase Details</Text>
            <View style={styles.actionButtons}>
              {isOrdered && !isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                  <Ionicons name="pencil" size={22} color="#1a237e" />
                </TouchableOpacity>
              )}
              {isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.actionButton}>
                  <Ionicons name="close" size={22} color="#d32f2f" />
                </TouchableOpacity>
              )}
              {!isCancelled && (
                <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                  <Ionicons name="trash" size={22} color="#d32f2f" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <View>
              <Text style={styles.editTitle}>✏️ Edit Purchase</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Quantity</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.quantity}
                  onChangeText={(v) => setEditData({ ...editData, quantity: v })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Purchase Price</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.purchase_price}
                  onChangeText={(v) => setEditData({ ...editData, purchase_price: v })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Notes</Text>
                <TextInput
                  style={[styles.editInput, styles.textArea]}
                  value={editData.notes}
                  onChangeText={(v) => setEditData({ ...editData, notes: v })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleSaveEdit}>
                <Text style={styles.updateButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.productName}>{purchase.brand} {purchase.model_name}</Text>
              <Text style={styles.supplierName}>Supplier: {purchase.supplier_name}</Text>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Quantity</Text>
                <Text style={styles.value}>{purchase.quantity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Purchase Price</Text>
                <Text style={styles.value}>₹{purchase.purchase_price}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Amount</Text>
                <Text style={[styles.value, styles.total]}>₹{purchase.total_amount}</Text>
              </View>
                 {/* 👇 Payment Summary */}
     <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>💰 Payment Summary</Text>
  
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Paid</Text>
            <Text style={[styles.paymentValue, { color: '#2e7d32' }]}>
               ₹{purchase.paid_amount || 0}
            </Text>
        </View>
  
        <View style={[styles.paymentRow, styles.pendingRow]}>
          <Text style={styles.paymentLabel}>Pending</Text>
            <Text style={[
              styles.paymentValue, 
           { 
             color: (purchase.pending_amount || 0) > 0 ? '#d32f2f' : '#2e7d32',
             fontWeight: '700'
           }
       ]}>
      ₹{purchase.pending_amount || 0}
    </Text>
  </View>
</View>

<View style={styles.divider} />


              <View style={styles.row}>
                <Text style={styles.label}>Payment Status</Text>
                <Text style={styles.value}>{purchase.payment_status || 'PENDING'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Order Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <Text style={styles.statusText}>{status || 'UNKNOWN'}</Text>
                </View>
              </View>

              {purchase.notes && (
                <View style={styles.row}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.value}>{purchase.notes}</Text>
                </View>
              )}

              {purchase.purchase_date && (
                <View style={styles.row}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{new Date(purchase.purchase_date).toLocaleDateString()}</Text>
                </View>
              )}

              {/* 👇 Action Buttons */}
              <View style={styles.actionContainer}>
                {isOrdered && (
                  <>
                    <TouchableOpacity style={styles.receiveButton} onPress={handleMarkReceived}>
                      <Text style={styles.receiveButtonText}>📦 Mark as Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                      <Text style={styles.cancelButtonText}> Cancel Order</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isReceived && (
                  <>
                    <View style={styles.receivedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                      <Text style={styles.receivedText}>Stock Updated</Text>
                    </View>
                    <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
                      <Text style={styles.returnButtonText}>↩️ Return Items</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isCancelled && (
                  <View style={styles.cancelledBadge}>
                    <Ionicons name="close-circle" size={20} color="#d32f2f" />
                    <Text style={styles.cancelledText}> Purchase Cancelled</Text>
                  </View>
                )}

                {/* 👇 Unknown status - show all buttons as fallback */}
                {!isOrdered && !isReceived && !isCancelled && (
                  <View>
                    <Text style={styles.unknownText}>⚠️ Unknown Status: {status || 'undefined'}</Text>
                    <TouchableOpacity style={styles.receiveButton} onPress={handleMarkReceived}>
                      <Text style={styles.receiveButtonText}>📦 Mark as Received (Force)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                      <Text style={styles.cancelButtonText}> Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  supplierName: {
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
    flex: 1,
    textAlign: 'right',
  },
  total: {
    fontWeight: '700',
    color: '#1a237e',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 16,
  },
  receiveButton: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  receiveButtonText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#d32f2f',
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#fff3e0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  returnButtonText: {
    fontSize: 15,
    color: '#e65100',
    fontWeight: '600',
  },
  receivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  receivedText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  cancelledText: {
    fontSize: 15,
    color: '#d32f2f',
    fontWeight: '600',
  },
  unknownText: {
    textAlign: 'center',
    color: '#d32f2f',
    fontWeight: 'bold',
    marginBottom: 8,
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
  paymentSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  pendingRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },

});