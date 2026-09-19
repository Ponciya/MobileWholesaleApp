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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { saleService, Sale, SaleItem } from '../../services/saleService';

export default function SaleDetailScreen({ navigation, route }: any) {
  const { saleId } = route.params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSale();
  }, []);

  const loadSale = async () => {
    try {
      const response = await saleService.getOne(saleId);
      if (response.success) {
        const data = response.data;
        setSale(data);
        setItems(data.items || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await saleService.delete(saleId);
              if (response.success) {
                Alert.alert('Success', 'Sale deleted', [
                  { text: 'OK', onPress: () => navigation.navigate('SaleList') }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#2e7d32';
      case 'PARTIAL': return '#f57c00';
      case 'PENDING': return '#d32f2f';
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

  if (!sale) {
    return (
      <View style={styles.centered}>
        <Text>Sale not found</Text>
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
            <Text style={styles.pageTitle}>📄 Sale Details</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash" size={22} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.customerName}>{sale.customer_name || 'Customer'}</Text>
          <Text style={styles.saleId}>Sale ID: #{sale.id}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>₹{sale.subtotal}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Discount</Text>
            <Text style={styles.value}>₹{sale.discount || 0}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={[styles.label, styles.totalLabel]}>Total</Text>
            <Text style={[styles.value, styles.totalValue]}>₹{sale.total_amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Paid</Text>
            <Text style={styles.value}>₹{sale.paid_amount || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pending</Text>
            <Text style={[styles.value, { color: sale.pending_amount && sale.pending_amount > 0 ? '#d32f2f' : '#2e7d32' }]}>
              ₹{sale.pending_amount || 0}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Payment Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sale.payment_status || 'PENDING') }]}>
              <Text style={styles.statusText}>{sale.payment_status || 'PENDING'}</Text>
            </View>
          </View>

          {sale.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{sale.notes}</Text>
            </View>
          )}

          {sale.sale_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{new Date(sale.sale_date).toLocaleDateString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.itemsTitle}>Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.brand} {item.model_name}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemText}>Qty: {item.quantity}</Text>
                <Text style={styles.itemText}>₹{item.selling_price}</Text>
                <Text style={[styles.itemText, styles.itemTotal]}>₹{item.total_amount}</Text>
              </View>
            </View>
          ))}
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
  deleteButton: {
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
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  saleId: {
    fontSize: 14,
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
  },
  totalRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a237e',
  },
  totalLabel: {
    fontWeight: '700',
    color: '#1a237e',
  },
  totalValue: {
    fontWeight: '700',
    color: '#1a237e',
    fontSize: 16,
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
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontWeight: '700',
    color: '#1a237e',
  },
});