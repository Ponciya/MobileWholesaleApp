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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext'; // 👈 Add this
import { productService, Product } from '../../services/productService';
import Header from '../../components/Header';

const CATEGORIES = ['Mobile', 'Headset', 'Earbud', 'Charger', 'Cable', 'Accessory'];

export default function ProductDetailScreen({ navigation, route }: any) {
  const { productId } = route.params;
  const { user } = useAuth(); // 👈 Get user
  const isAdmin = user?.role === 'ADMIN'; // 👈 Check if Admin

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await productService.getOne(productId);
      if (response.success) {
        setProduct(response.data);
        setEditData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product?.brand} ${product?.model_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await productService.delete(productId);
              if (response.success) {
                Alert.alert('Success', 'Product deleted successfully', [
                  { text: 'OK', onPress: () => navigation.navigate('ProductList') }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      const response = await productService.update(productId, editData);
      if (response.success) {
        setProduct(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Product updated successfully');
        loadProduct();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const CategoryModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.modalItem}
                onPress={() => {
                  setEditData({ ...editData, category: cat });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found</Text>
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
            <Text style={styles.pageTitle}>📄 Product Details</Text>
            {/* 👇 Only show Edit/Delete for Admin */}
            {isAdmin && (
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.actionButton}>
                  <Ionicons name={isEditing ? 'close' : 'pencil'} size={22} color="#1a237e" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                  <Ionicons name="trash" size={22} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          {isEditing ? (
            // Edit Mode - Only Admin can see this
            <View>
              <Text style={styles.editTitle}>✏️ Edit Product</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>SKU</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.sku}
                  onChangeText={(v) => setEditData({ ...editData, sku: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Brand</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.brand}
                  onChangeText={(v) => setEditData({ ...editData, brand: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Model</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.model_name}
                  onChangeText={(v) => setEditData({ ...editData, model_name: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.editPicker}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={editData.category ? styles.pickerText : styles.pickerPlaceholder}>
                    {editData.category || 'Select category...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Variant</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.variant}
                  onChangeText={(v) => setEditData({ ...editData, variant: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Color</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.color}
                  onChangeText={(v) => setEditData({ ...editData, color: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>RAM</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.ram}
                  onChangeText={(v) => setEditData({ ...editData, ram: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Storage</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.storage}
                  onChangeText={(v) => setEditData({ ...editData, storage: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>IMEI</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.imei_serial}
                  onChangeText={(v) => setEditData({ ...editData, imei_serial: v })}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Purchase Price</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.purchase_price?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, purchase_price: parseFloat(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Selling Price</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.selling_price?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, selling_price: parseFloat(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Wholesale Price</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.wholesale_price?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, wholesale_price: parseFloat(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Current Stock</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.current_stock?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, current_stock: parseInt(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Minimum Stock</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.minimum_stock?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, minimum_stock: parseInt(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Update Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // View Mode
            <View>
              <Text style={styles.productName}>{product.brand} {product.model_name}</Text>
              <Text style={styles.sku}>SKU: {product.sku}</Text>
              <Text style={styles.categoryTag}>🏷️ {product.category || 'Mobile'}</Text>

              <View style={styles.divider} />

              {/* 👇 Purchase Price - Only for Admin */}
              {isAdmin && (
                <View style={styles.row}>
                  <Text style={styles.label}>Purchase Price</Text>
                  <Text style={styles.value}>₹{product.purchase_price}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Selling Price</Text>
                <Text style={styles.value}>₹{product.selling_price}</Text>
              </View>
              {product.wholesale_price && isAdmin && (
                <View style={styles.row}>
                  <Text style={styles.label}>Wholesale Price</Text>
                  <Text style={styles.value}>₹{product.wholesale_price}</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Current Stock</Text>
                <Text style={[styles.value, styles.stock]}>{product.current_stock}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Minimum Stock</Text>
                <Text style={styles.value}>{product.minimum_stock}</Text>
              </View>

              {product.variant && (
                <View style={styles.row}>
                  <Text style={styles.label}>Variant</Text>
                  <Text style={styles.value}>{product.variant}</Text>
                </View>
              )}
              {product.color && (
                <View style={styles.row}>
                  <Text style={styles.label}>Color</Text>
                  <Text style={styles.value}>{product.color}</Text>
                </View>
              )}
              {product.ram && (
                <View style={styles.row}>
                  <Text style={styles.label}>RAM</Text>
                  <Text style={styles.value}>{product.ram}</Text>
                </View>
              )}
              {product.storage && (
                <View style={styles.row}>
                  <Text style={styles.label}>Storage</Text>
                  <Text style={styles.value}>{product.storage}</Text>
                </View>
              )}
              {product.imei_serial && (
                <View style={styles.row}>
                  <Text style={styles.label}>IMEI</Text>
                  <Text style={styles.value}>{product.imei_serial}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <CategoryModal />
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
  sku: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryTag: {
    fontSize: 13,
    color: '#1a237e',
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
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
  stock: {
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
  editPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#999',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalCancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
  },
});