import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { saleService, Sale } from '../../services/saleService';

type PaymentStatus = 'ALL' | 'PAID' | 'PARTIAL' | 'PENDING';

export default function SaleListScreen({ navigation }: any) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus>('ALL');

  const loadSales = useCallback(async () => {
    try {
      const response = await saleService.getAll();
      if (response.success) {
        setSales(response.data);
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  const getFilteredSales = () => {
    let filtered = sales;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.customer_name?.toLowerCase().includes(query) ||
          s.brand?.toLowerCase().includes(query) ||
          s.model_name?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((s) => s.payment_status === filterStatus);
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#2e7d32';
      case 'PARTIAL': return '#f57c00';
      case 'PENDING': return '#d32f2f';
      default: return '#666';
    }
  };

  const renderItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => navigation.navigate('SaleDetail', { saleId: item.id })}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status || 'PENDING') }]}>
          <Text style={styles.statusText}>{item.payment_status || 'PENDING'}</Text>
        </View>
      </View>

      <Text style={styles.productName}>
        {item.brand} {item.model_name}
      </Text>

      <View style={styles.saleDetails}>
        <Text style={styles.detailText}>Qty: {item.quantity}</Text>
        <Text style={styles.detailText}>₹{item.selling_price}</Text>
        <Text style={styles.totalText}>Total: ₹{item.total_amount}</Text>
      </View>

      {item.pending_amount && item.pending_amount > 0 && (
        <Text style={styles.pendingText}>Pending: ₹{item.pending_amount}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const filteredSales = getFilteredSales();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>💰 Sales</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, product..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterContainer}>
          {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as PaymentStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === status && styles.filterTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredSales.length} sales found
          </Text>
        </View>

        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No sales found</Text>
              <Text style={styles.emptySubText}>Tap + to create a new sale</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddSale')}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
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
    flex: 1,
    paddingHorizontal: 16,
  },
  pageTitleContainer: {
    backgroundColor: '#e8eaf6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a237e',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
    flexWrap: 'nowrap',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  filterTabActive: {
    backgroundColor: '#1a237e',
  },
  filterText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  countContainer: {
    paddingBottom: 6,
  },
  countText: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 100,
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
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
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a237e',
  },
  pendingText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
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
    color: '#666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#1a237e',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});