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
  Linking, // 👈 NEW
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supplierService, Supplier } from '../../services/supplierService';

export default function SupplierListScreen({ navigation }: any) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await supplierService.getAll();
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSuppliers();
  };

  const getFilteredSuppliers = () => {
    if (!searchQuery.trim()) return suppliers;
    const query = searchQuery.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.supplier_name?.toLowerCase().includes(query) ||
        s.company_name?.toLowerCase().includes(query) ||
        s.phone?.includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
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

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await supplierService.delete(id);
              if (response.success) {
                Alert.alert('Success', 'Supplier deleted successfully');
                loadSuppliers();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete supplier');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      onPress={() => navigation.navigate('SupplierDetail', { supplierId: item.id })}
    >
      <View style={styles.supplierHeader}>
        <Text style={styles.supplierName}>{item.supplier_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#2e7d32' : '#d32f2f' }]}>
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
      </View>

      {item.company_name && (
        <Text style={styles.companyName}>{item.company_name}</Text>
      )}

      <View style={styles.supplierDetails}>
        {item.phone && (
          <TouchableOpacity 
            style={styles.detailItem} 
            onPress={() => handleCall(item.phone!)}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={16} color="#1a237e" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </TouchableOpacity>
        )}
        {item.email && (
          <TouchableOpacity 
            style={styles.detailItem} 
            onPress={() => handleEmail(item.email!)}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={16} color="#1a237e" />
            <Text style={styles.detailText}>{item.email}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const filteredSuppliers = getFilteredSuppliers();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>🏢 Suppliers</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, phone..."
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

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredSuppliers.length} suppliers found
          </Text>
        </View>

        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No suppliers found</Text>
              <Text style={styles.emptySubText}>Tap + to add a new supplier</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddSupplier')}
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
  supplierCard: {
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
  supplierHeader: {
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
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  supplierDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#1a237e',
    textDecorationLine: 'underline',
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