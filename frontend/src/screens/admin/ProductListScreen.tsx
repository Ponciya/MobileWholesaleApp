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
import { useAuth } from '../../context/AuthContext';
import { productService, Product } from '../../services/productService';
import Header from '../../components/Header';

type ProductStatus = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const CATEGORIES = ['ALL', 'Mobile', 'Headset', 'Earbud', 'Charger', 'Cable', 'Accessory'];

export default function ProductListScreen({ navigation }: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN'; // 👈 Check if Admin

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProductStatus>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const loadProducts = useCallback(async () => {
    try {
      const response = await productService.getAll();
      if (response.success) {
        const activeProducts = response.data.filter((p: Product) => p.status === 'ACTIVE');
        setProducts(activeProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.sku?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.model_name?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((p) => {
        if (filterStatus === 'IN_STOCK') return p.current_stock > p.minimum_stock;
        if (filterStatus === 'LOW_STOCK') return p.current_stock <= p.minimum_stock && p.current_stock > 0;
        if (filterStatus === 'OUT_OF_STOCK') return p.current_stock === 0;
        return true;
      });
    }

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    return filtered;
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) return { label: 'OUT OF STOCK', color: '#d32f2f' };
    if (product.current_stock <= product.minimum_stock) return { label: 'LOW STOCK', color: '#f57c00' };
    return { label: 'IN STOCK', color: '#2e7d32' };
  };

  // 👇 Handle product click based on role
  const handleProductPress = (product: Product) => {
    if (isAdmin) {
      // Admin → Full detail page
      navigation.navigate('ProductDetail', { productId: product.id });
    } else {
      // Employee → View Only (Alert)
      Alert.alert(
        '📱 Product Details',
        `Brand: ${product.brand}\n` +
        `Model: ${product.model_name}\n` +
        `SKU: ${product.sku}\n` +
        `Stock: ${product.current_stock}\n` +
        `Price: ₹${product.selling_price}\n` +
        `Category: ${product.category || 'Mobile'}` +
        (product.variant ? `\nVariant: ${product.variant}` : '') +
        (product.ram ? `\nRAM: ${product.ram}` : '') +
        (product.storage ? `\nStorage: ${product.storage}` : '') +
        (product.color ? `\nColor: ${product.color}` : '')
      );
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const status = getStockStatus(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>
            {item.brand} {item.model_name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.detailText}>SKU: {item.sku}</Text>
          <Text style={styles.detailText}>Stock: {item.current_stock}</Text>
          <Text style={styles.priceText}>₹{item.selling_price}</Text>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>🏷️ {item.category || 'Mobile'}</Text>
        </View>

        <View style={styles.variantContainer}>
          {item.variant ? <Text style={styles.variantText}>{item.variant}</Text> : null}
          {item.ram ? <Text style={styles.variantText}> | {item.ram}</Text> : null}
          {item.storage ? <Text style={styles.variantText}> | {item.storage}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📋 Products</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by SKU, Brand, Model..."
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
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterTab, filterCategory === cat && styles.filterTabActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterCategory === cat && styles.filterTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterContainer}>
          {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as ProductStatus[]).map((status) => (
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
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredProducts.length} products found
          </Text>
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>Tap + to add a new product</Text>
            </View>
          }
        />

        {/* 👇 FAB - Only for Admin */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddProduct')}
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
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
  },
  filterTabActive: {
    backgroundColor: '#1a237e',
  },
  filterText: {
    fontSize: 10,
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
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
    marginRight: 8,
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
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
  },
  categoryContainer: {
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#1a237e',
    fontWeight: '500',
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  variantText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  variantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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