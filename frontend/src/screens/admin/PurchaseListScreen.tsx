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
import { purchaseService, Purchase } from '../../services/purchaseService';

type PurchaseStatus = 'ALL' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export default function PurchaseListScreen({ navigation }: any) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PurchaseStatus>('ALL');

  const loadPurchases = useCallback(async () => {
    try {
      const response = await purchaseService.getAll();
      if (response.success) {
        setPurchases(response.data);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPurchases();
  };

  const getFilteredPurchases = () => {
    let filtered = purchases;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.supplier_name?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.model_name?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDERED': return '#f57c00';
      case 'RECEIVED': return '#2e7d32';
      case 'CANCELLED': return '#d32f2f';
      default: return '#666';
    }
  };

  const handleUpdateStatus = (id: number, currentStatus: string) => {
    if (currentStatus === 'RECEIVED') {
      Alert.alert('Info', 'Purchase already received');
      return;
    }

    Alert.alert(
      'Update Status',
      `Mark this purchase as RECEIVED? This will increase stock.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Received',
          onPress: async () => {
            try {
              const response = await purchaseService.updateStatus(id, 'RECEIVED');
              if (response.success) {
                Alert.alert('Success', 'Purchase received! Stock updated!');
                loadPurchases();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Purchase }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => navigation.navigate('PurchaseDetail', { purchaseId: item.id })}
    >
      <View style={styles.purchaseHeader}>
        <Text style={styles.supplierName}>{item.supplier_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'ORDERED') }]}>
          <Text style={styles.statusText}>{item.status || 'ORDERED'}</Text>
        </View>
      </View>

      <Text style={styles.productName}>
        {item.brand} {item.model_name}
      </Text>

      <View style={styles.purchaseDetails}>
        <Text style={styles.detailText}>Qty: {item.quantity}</Text>
        <Text style={styles.detailText}>₹{item.purchase_price}</Text>
        <Text style={styles.totalText}>Total: ₹{item.total_amount}</Text>
      </View>

      {item.status !== 'RECEIVED' && item.status !== 'CANCELLED' && (
        <TouchableOpacity
          style={styles.receiveButton}
          onPress={() => handleUpdateStatus(item.id!, item.status!)}
        >
          <Text style={styles.receiveButtonText}>📦 Mark as Received</Text>
        </TouchableOpacity>
      )}

      {item.status === 'RECEIVED' && (
        <View style={styles.receivedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
          <Text style={styles.receivedText}>Stock Updated</Text>
        </View>
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

  const filteredPurchases = getFilteredPurchases();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📦 Purchases</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by supplier, product..."
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
          {(['ALL', 'ORDERED', 'RECEIVED', 'CANCELLED'] as PurchaseStatus[]).map((status) => (
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
            {filteredPurchases.length} purchases found
          </Text>
        </View>

        <FlatList
          data={filteredPurchases}
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
              <Text style={styles.emptyText}>No purchases found</Text>
              <Text style={styles.emptySubText}>Tap + to create a new purchase</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddPurchase')}
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
  purchaseCard: {
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
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  supplierName: {
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
  purchaseDetails: {
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
  receiveButton: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  receiveButtonText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  receivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  receivedText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
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