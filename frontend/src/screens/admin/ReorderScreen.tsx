import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Header from '../../components/Header';
import api from '../../services/api';

export default function ReorderScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/reports/low-stock');
      if (response.data?.success) {
        const data = response.data.data || [];
        setItems(data);
        let sum = 0;
        data.forEach((item: any) => {
          sum += Number(item.reorder_amount || 0);
        });
        setTotal(sum);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>🔄 Reorder / Stock Planning</Text>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Reorder Amount</Text>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
          <Text style={styles.totalSub}>{items.length} product(s) need reorder</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>✅ All stocks are healthy!</Text>
            <Text style={styles.emptySubText}>No products need reorder</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View style={styles.card} key={item.id || index}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>
                  {item.brand} {item.model_name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.current_stock === 0 ? '#d32f2f' : '#f57c00' }]}>
                  <Text style={styles.statusText}>{item.current_stock === 0 ? 'OUT' : 'LOW'}</Text>
                </View>
              </View>
              <Text style={styles.skuText}>SKU: {item.sku}</Text>
              <View style={styles.stockRow}>
                <Text>Current: {item.current_stock}</Text>
                <Text>Min: {item.minimum_stock}</Text>
                <Text style={{ fontWeight: 'bold' }}>Need: {item.required_quantity || 0}</Text>
              </View>
              <Text style={styles.amountText}>Reorder Amount: ₹{item.reorder_amount || 0}</Text>
            </View>
          ))
        )}
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
  totalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 4,
  },
  totalSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  skuText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});