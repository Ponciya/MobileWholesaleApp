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
import { useAuth } from '../../context/AuthContext'; // 👈 ADD THIS
import { paymentService, Payment } from '../../services/paymentService';

type PaymentType = 'ALL' | 'CUSTOMER' | 'SUPPLIER';

export default function PaymentListScreen({ navigation, route }: any) {

  const { user } = useAuth(); // 👈 ADD THIS
  const isAdmin = user?.role === 'ADMIN'; // 👈 ADD THIS

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PaymentType>('ALL');
  const [customerIdFilter, setCustomerIdFilter] = useState<number | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      const params: any = {};
      if (filterType !== 'ALL') {
        params.type = filterType;
      }
      if (customerIdFilter) {
        params.customer_id = customerIdFilter;
      }
      console.log('📤 Loading payments with params:', params);
      const response = await paymentService.getAll(params);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, customerIdFilter]);

  // ✅ Set customerIdFilter from route params first
  useEffect(() => {
    if (route.params?.customer_id) {
      setCustomerIdFilter(route.params.customer_id);
    }
  }, [route.params?.customer_id]);

  // ✅ Load payments after customerIdFilter is set
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const getFilteredPayments = () => {
    let filtered = payments;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.customer_name?.toLowerCase().includes(query) ||
          p.supplier_name?.toLowerCase().includes(query) ||
          p.reference_number?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'ALL') {
      filtered = filtered.filter((p) => p.payment_type === filterType);
    }

    return filtered;
  };

  const renderItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
    >
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentName}>
          {item.customer_name || item.supplier_name || 'Unknown'}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: item.payment_type === 'CUSTOMER' ? '#e8eaf6' : '#fff3e0' }]}>
          <Text style={[styles.typeText, { color: item.payment_type === 'CUSTOMER' ? '#1a237e' : '#f57c00' }]}>
            {item.payment_type === 'CUSTOMER' ? 'Customer' : 'Supplier'}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={styles.dateText}>{new Date(item.payment_date).toLocaleDateString()}</Text>
      </View>

      {item.payment_method && (
        <Text style={styles.methodText}>Method: {item.payment_method}</Text>
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

  const filteredPayments = getFilteredPayments();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>💰 Payments</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, supplier..."
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
          {(['ALL', 'CUSTOMER', 'SUPPLIER'] as PaymentType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filterType === type && styles.filterTabActive]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterType === type && styles.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredPayments.length} payments found
          </Text>
        </View>

        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No payments found</Text>
              <Text style={styles.emptySubText}>Tap + to add a payment</Text>
            </View>
          }
        />

        {isAdmin && (
  <TouchableOpacity
    style={styles.fab}
    onPress={() => navigation.navigate('AddPayment')}
  >
    <Ionicons name="add" size={30} color="#fff" />
  </TouchableOpacity>
)}
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
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  methodText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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