import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { outgoingDeliveryService } from '../../services/outgoingDeliveryService';

export default function OutgoingDeliveryDetailScreen({ navigation, route }: any) {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelivery();
  }, []);

  const loadDelivery = async () => {
    try {
      const response = await outgoingDeliveryService.getOne(deliveryId);
      if (response.success) {
        setDelivery(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (newStatus: string) => {
    Alert.alert(
      'Update Status',
      `Change status to ${newStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              const response = await outgoingDeliveryService.updateStatus(deliveryId, newStatus);
              if (response.success) {
                Alert.alert('Success', 'Status updated');
                loadDelivery();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING': return '#f57c00';
      case 'OUT_FOR_DELIVERY': return '#1565C0';
      case 'DELIVERED': return '#2e7d32';
      case 'CANCELLED': return '#d32f2f';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PREPARING': return 'cube-outline';
      case 'OUT_FOR_DELIVERY': return 'car-outline';
      case 'DELIVERED': return 'checkmark-circle-outline';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'help-outline';
    }
  };

  const statuses = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centered}>
        <Text>Delivery not found</Text>
      </View>
    );
  }

  const currentStatus = delivery.status || 'PREPARING';

  return (
    <View style={styles.container}>
      <Header showBack={true} onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📦 Delivery Details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusSection}>
            <Ionicons name={getStatusIcon(currentStatus)} size={40} color={getStatusColor(currentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
              {currentStatus.replace('_', ' ')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Delivery ID</Text>
            <Text style={styles.value}>#{delivery.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{delivery.customer_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sale ID</Text>
            <Text style={styles.value}>#{delivery.sale_id}</Text>
          </View>

          {/* ✅ Items Section - Product Names */}
          {delivery.items && delivery.items.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.itemsTitle}>📦 Items</Text>
              {delivery.items.map((item: any, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.brand} {item.model_name}
                    </Text>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </View>
              ))}
            </>
          )}

          {delivery.delivery_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Delivery Date</Text>
              <Text style={styles.value}>{new Date(delivery.delivery_date).toLocaleDateString()}</Text>
            </View>
          )}

          {delivery.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{delivery.notes}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.statusTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  currentStatus === status && styles.statusButtonActive,
                  { borderColor: getStatusColor(status) }
                ]}
                onPress={() => updateStatus(status)}
                disabled={currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'}
              >
                <Ionicons name={getStatusIcon(status)} size={16} color={getStatusColor(status)} />
                <Text style={[
                  styles.statusButtonText,
                  currentStatus === status && styles.statusButtonTextActive,
                ]}>
                  {status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
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
  statusSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
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
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemQty: {
    fontSize: 12,
    color: '#666',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    gap: 4,
  },
  statusButtonActive: {
    backgroundColor: '#e8eaf6',
  },
  statusButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#1a237e',
    fontWeight: '700',
  },
});