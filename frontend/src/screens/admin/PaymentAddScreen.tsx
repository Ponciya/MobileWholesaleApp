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
import { paymentService } from '../../services/paymentService';
import { customerService, Customer } from '../../services/customerService';
import { supplierService, Supplier } from '../../services/supplierService';
import { saleService, Sale } from '../../services/saleService';
import { purchaseService, Purchase } from '../../services/purchaseService';

type PaymentType = 'CUSTOMER' | 'SUPPLIER';

export default function PaymentAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [paymentType, setPaymentType] = useState<PaymentType>('CUSTOMER');

  // Customer Payment
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Supplier Payment
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [paymentType]);

  const loadData = async () => {
    try {
      const [customerRes, supplierRes, saleRes, purchaseRes] = await Promise.all([
        customerService.getAll(),
        supplierService.getAll(),
        saleService.getAll(),
        purchaseService.getAll(),
      ]);
      if (customerRes.success) setCustomers(customerRes.data);
      if (supplierRes.success) setSuppliers(supplierRes.data);
      if (saleRes.success) setCustomerSales(saleRes.data);
      if (purchaseRes.success) setSupplierPurchases(purchaseRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (paymentType === 'CUSTOMER') {
      if (!selectedCustomer) {
        Alert.alert('Error', 'Please select a customer');
        return;
      }
      if (!selectedSale) {
        Alert.alert('Error', 'Please select a sale');
        return;
      }
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Amount must be greater than 0');
        return;
      }

      setLoading(true);
      try {
        const response = await paymentService.createCustomerPayment({
          customer_id: selectedCustomer.id!,
          sale_id: selectedSale.id!,
          amount: parseFloat(amount),
          payment_method: paymentMethod || undefined,
          reference: reference || undefined,
          notes: notes || undefined,
        });
        if (response.success) {
          Alert.alert('Success', 'Customer payment added!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error: any) {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to add payment');
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedSupplier) {
        Alert.alert('Error', 'Please select a supplier');
        return;
      }
      if (!selectedPurchase) {
        Alert.alert('Error', 'Please select a purchase');
        return;
      }
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Amount must be greater than 0');
        return;
      }

      setLoading(true);
      try {
        const response = await paymentService.createSupplierPayment({
          supplier_id: selectedSupplier.id!,
          purchase_id: selectedPurchase.id!,
          amount: parseFloat(amount),
          payment_method: paymentMethod || undefined,
          reference: reference || undefined,
          notes: notes || undefined,
        });
        if (response.success) {
          Alert.alert('Success', 'Supplier payment added!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error: any) {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to add payment');
      } finally {
        setLoading(false);
      }
    }
  };

  // Modals
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
          </ScrollView>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCustomerModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
                  setSelectedSupplier(s);
                  setShowSupplierModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{s.supplier_name}</Text>
                {s.company_name && (
                  <Text style={styles.modalItemSub}>{s.company_name}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowSupplierModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SaleModal = () => (
    <Modal visible={showSaleModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sale</Text>
            <TouchableOpacity onPress={() => setShowSaleModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {customerSales.filter(s => s.customer_id === selectedCustomer?.id).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSale(s);
                  setShowSaleModal(false);
                }}
              >
                <Text style={styles.modalItemText}>Sale #{s.id}</Text>
                <Text style={styles.modalItemSub}>Total: ₹{s.total_amount}</Text>
                <Text style={styles.modalItemSub}>Pending: ₹{s.pending_amount}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowSaleModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const PurchaseModal = () => (
    <Modal visible={showPurchaseModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Purchase</Text>
            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {supplierPurchases.filter(p => p.supplier_id === selectedSupplier?.id).map((p) => {
              // ✅ Calculate pending amount
              const pending = p.pending_amount !== undefined ? p.pending_amount : p.total_amount;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPurchase(p);
                    setShowPurchaseModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>Purchase #{p.id}</Text>
                  <Text style={styles.modalItemSub}>Total: ₹{p.total_amount}</Text>
                  <Text style={[styles.modalItemSub, { color: pending > 0 ? '#d32f2f' : '#2e7d32' }]}>
                    Pending: ₹{pending > 0 ? pending : 0}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPurchaseModal(false)}>
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
          <Text style={styles.pageTitle}>➕ Add Payment</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, paymentType === 'CUSTOMER' && styles.typeButtonActive]}
              onPress={() => {
                setPaymentType('CUSTOMER');
                setSelectedCustomer(null);
                setSelectedSale(null);
              }}
            >
              <Text style={[styles.typeText, paymentType === 'CUSTOMER' && styles.typeTextActive]}>
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, paymentType === 'SUPPLIER' && styles.typeButtonActive]}
              onPress={() => {
                setPaymentType('SUPPLIER');
                setSelectedSupplier(null);
                setSelectedPurchase(null);
              }}
            >
              <Text style={[styles.typeText, paymentType === 'SUPPLIER' && styles.typeTextActive]}>
                Supplier
              </Text>
            </TouchableOpacity>
          </View>

          {paymentType === 'CUSTOMER' ? (
            <>
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

              {selectedCustomer && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sale *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSaleModal(true)}
                  >
                    <Text style={selectedSale ? styles.pickerText : styles.pickerPlaceholder}>
                      {selectedSale ? `Sale #${selectedSale.id}` : 'Select a sale...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Supplier *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowSupplierModal(true)}
                >
                  <Text style={selectedSupplier ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedSupplier ? selectedSupplier.supplier_name : 'Select a supplier...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedSupplier && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Purchase *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowPurchaseModal(true)}
                  >
                    <Text style={selectedPurchase ? styles.pickerText : styles.pickerPlaceholder}>
                      {selectedPurchase ? `Purchase #${selectedPurchase.id}` : 'Select a purchase...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <TextInput
              style={styles.input}
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="Cash / Bank / UPI"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reference / Transaction ID</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="e.g. UPI-123456"
            />
          </View>

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
              <Text style={styles.submitText}>Add Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomerModal />
      <SupplierModal />
      <SaleModal />
      <PurchaseModal />
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#1a237e',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 12,
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