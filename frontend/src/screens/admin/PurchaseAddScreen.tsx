import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { purchaseService } from '../../services/purchaseService';
import { productService, Product } from '../../services/productService';
import { supplierService, Supplier } from '../../services/supplierService';

export default function PurchaseAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // 👈 ADD THIS

  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    product_id: '',
    product_name: '',
    quantity: '',
    purchase_price: '',
    payment_status: 'PENDING',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productRes, supplierRes] = await Promise.all([
        productService.getAll(),
        supplierService.getAll(),
      ]);
      if (productRes.success) setProducts(productRes.data);
      if (supplierRes.success) setSuppliers(supplierRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.supplier_id) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }
    if (!formData.product_id) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }
    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      Alert.alert('Error', 'Purchase price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const data = {
        supplier_id: parseInt(formData.supplier_id),
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        payment_status: formData.payment_status,
        notes: formData.notes,
      };

      const response = await purchaseService.create(data);
      if (response.success) {
        Alert.alert('Success', 'Purchase created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create purchase');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Supplier Modal
  const SupplierModal = () => (
    <Modal visible={showSupplierModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Supplier</Text>
            <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {suppliers.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.modalItem}
                onPress={() => {
                  setFormData({
                    ...formData,
                    supplier_id: String(s.id),
                    supplier_name: s.supplier_name,
                  });
                  setShowSupplierModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>{s.supplier_name}</Text>
                {s.company_name && (
                  <Text style={styles.modalItemSub}>{s.company_name}</Text>
                )}
              </TouchableOpacity>
            ))}
            {suppliers.length === 0 && (
              <Text style={styles.modalEmpty}>No suppliers available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowSupplierModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ✅ Product Modal
  const ProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedProduct(p);
                  setFormData({
                    ...formData,
                    product_id: String(p.id),
                    product_name: `${p.brand} ${p.model_name}`,
                  });
                  setShowProductModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>
                  {p.brand} {p.model_name}
                </Text>
                <Text style={styles.modalItemSub}>
                  🏷️ {p.category || 'Mobile'} | Stock: {p.current_stock} | ₹{p.selling_price}
                </Text>
              </TouchableOpacity>
            ))}
            {products.length === 0 && (
              <Text style={styles.modalEmpty}>No products available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowProductModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loadingData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>➕ Create Purchase</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSupplierModal(true)}
            >
              <Text style={formData.supplier_id ? styles.pickerText : styles.pickerPlaceholder}>
                {formData.supplier_name || 'Select a supplier...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProductModal(true)}
            >
              <Text style={formData.product_id ? styles.pickerText : styles.pickerPlaceholder}>
                {formData.product_name || 'Select a product...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(v) => handleChange('quantity', v)}
                placeholder="10"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.purchase_price}
                onChangeText={(v) => handleChange('purchase_price', v)}
                placeholder="85000"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(v) => handleChange('notes', v)}
              placeholder="Additional notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Purchase</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SupplierModal />
      <ProductModal />
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
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a237e',
  },
  form: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 👇 Modal styles (ONLY ONCE)
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
    maxHeight: 400,
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
  modalItemSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
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