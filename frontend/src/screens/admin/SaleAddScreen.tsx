import React, { useState, useEffect, useCallback } from 'react';
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
import { saleService } from '../../services/saleService';
import { productService, Product } from '../../services/productService';
import { customerService, Customer } from '../../services/customerService';

export default function SaleAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Modal visibility
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productRes, customerRes] = await Promise.all([
        productService.getAll(),
        customerService.getAll(),
      ]);
      if (productRes.success) setProducts(productRes.data);
      if (customerRes.success) setCustomers(customerRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const addItem = () => {
    console.log('🔍 Adding item - selectedProduct:', selectedProduct);
    console.log('🔍 Quantity:', quantity);
    console.log('🔍 Selling Price:', sellingPrice);
    
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return;
    }
  
    // Check stock
    if (parseInt(quantity) > selectedProduct.current_stock) {
      Alert.alert('Error', `Only ${selectedProduct.current_stock} units available in stock`);
      return;
    }
  
    const total = parseInt(quantity) * parseFloat(sellingPrice);
    const newItem = {
      product_id: selectedProduct.id,  // ✅ Make sure product_id is set
      product_name: `${selectedProduct.brand} ${selectedProduct.model_name}`,
      quantity: parseInt(quantity),
      selling_price: parseFloat(sellingPrice),
      total_amount: total,
    };
    
    console.log('✅ New item:', newItem);
    
    setItems([...items, newItem]);
  
    // Reset fields
    setSelectedProduct(null);
    setQuantity('');
    setSellingPrice('');
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0);
    const discountAmount = parseFloat(discount) || 0;
    const total = subtotal - discountAmount;
    const paid = parseFloat(paidAmount) || 0;
    const pending = total - paid;
    return { subtotal, total, pending };
  };

// 👇 Wrap handleSubmit with useCallback
const handleSubmit = useCallback(async () => {
  if (!selectedCustomer) {
    Alert.alert('Error', 'Please select a customer');
    return;
  }
  
  console.log('📦 Items before submit:', items); // 👈 Debug - check items
  console.log('📦 Items length:', items.length);
  
  if (items.length === 0) {
    Alert.alert('Error', 'Add at least one product');
    return;
  }

  const { subtotal, total, pending } = calculateTotals();
  const paid = parseFloat(paidAmount) || 0;
  let paymentStatus = 'PENDING';
  if (paid >= total) paymentStatus = 'PAID';
  else if (paid > 0) paymentStatus = 'PARTIAL';

  setLoading(true);
  try {
    const data = {
      customer_id: selectedCustomer.id!,
      items: items,
      discount: parseFloat(discount) || 0,
      paid_amount: paid,
      notes: notes,
      payment_status: paymentStatus,
    };

    console.log('📤 Sending data:', data); // 👈 Debug

    const response = await saleService.create(data);
    if (response.success) {
      Alert.alert('Success', 'Sale created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', response.message || 'Failed to create sale');
    }
  } catch (error: any) {
    console.error('❌ Error:', error?.response?.data || error);
    Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
}, [selectedCustomer, items, discount, paidAmount, notes, navigation]); // 👈 Add dependencies
  const { subtotal, total, pending } = calculateTotals();

  // Customer Modal
  const CustomerModal = () => (
    <Modal visible={showCustomerModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCustomer(c);
                  setShowCustomerModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{c.name}</Text>
                {c.business_name && (
                  <Text style={styles.modalItemSub}>{c.business_name}</Text>
                )}
              </TouchableOpacity>
            ))}
            {customers.length === 0 && (
              <Text style={styles.modalEmpty}>No customers available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowCustomerModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Product Modal
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
                  setShowProductModal(false);
                }}
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
          <Text style={styles.pageTitle}>➕ Create Sale</Text>
        </View>

        <View style={styles.form}>
          {/* Customer */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={selectedCustomer ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedCustomer ? selectedCustomer.name : 'Select a customer...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Add Product Section */}
          <Text style={styles.sectionTitle}>Add Product</Text>
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProductModal(true)}
            >
              <Text style={selectedProduct ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model_name}` : 'Select a product...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Qty</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={sellingPrice}
                onChangeText={setSellingPrice}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.addButtonText}>➕ Add Product</Text>
          </TouchableOpacity>

          {/* Items List */}
          {items.length > 0 && (
            <View style={styles.itemsContainer}>
              <Text style={styles.sectionTitle}>Items</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Ionicons name="close-circle" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemDetails}>
                    Qty: {item.quantity} × ₹{item.selling_price} = ₹{item.total_amount}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Discount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Discount (₹)</Text>
            <TextInput
              style={styles.input}
              value={discount}
              onChangeText={setDiscount}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          {/* Paid Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid Amount</Text>
            <TextInput
              style={styles.input}
              value={paidAmount}
              onChangeText={setPaidAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-₹{(parseFloat(discount) || 0).toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pending</Text>
              <Text style={[styles.totalValue, { color: pending > 0 ? '#d32f2f' : '#2e7d32' }]}>
                ₹{pending.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
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
              <Text style={styles.submitText}>Create Sale</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomerModal />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginTop: 12,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#e8eaf6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  totalsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  submitButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
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