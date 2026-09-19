import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { outgoingDeliveryService } from '../../services/outgoingDeliveryService';
import { saleService, Sale } from '../../services/saleService';

export default function OutgoingDeliveryAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [notes, setNotes] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const response = await saleService.getAll();
      if (response.success) {
        // Filter only sales that don't have delivery yet
        // For now show all sales
        setSales(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sales');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSale) {
      Alert.alert('Error', 'Please select a sale');
      return;
    }

    setLoading(true);
    try {
      const data = {
        sale_id: selectedSale.id!,
        notes: notes,
      };

      const response = await outgoingDeliveryService.create(data);
      if (response.success) {
        Alert.alert('Success', 'Delivery created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create delivery');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Sale Modal
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
            {sales.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSale(s);
                  setShowSaleModal(false);
                }}
              >
                <Text style={styles.modalItemText}>Sale #{s.id}</Text>
                <Text style={styles.modalItemSub}>
                  {s.customer_name} | ₹{s.total_amount}
                </Text>
                <Text style={styles.modalItemSub}>
                  Status: {s.payment_status || 'PENDING'}
                </Text>
              </TouchableOpacity>
            ))}
            {sales.length === 0 && (
              <Text style={styles.modalEmpty}>No sales available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowSaleModal(false)}
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
          <Text style={styles.pageTitle}>➕ Create Delivery</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Sale *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSaleModal(true)}
            >
              <Text style={selectedSale ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedSale ? `Sale #${selectedSale.id} - ${selectedSale.customer_name}` : 'Select a sale...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedSale && (
            <View style={styles.saleInfo}>
              <Text style={styles.saleInfoText}>Customer: {selectedSale.customer_name}</Text>
              <Text style={styles.saleInfoText}>Total: ₹{selectedSale.total_amount}</Text>
              <Text style={styles.saleInfoText}>Status: {selectedSale.payment_status || 'PENDING'}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
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
              <Text style={styles.submitText}>Create Delivery</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SaleModal />
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
  saleInfo: {
    backgroundColor: '#e8eaf6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  saleInfoText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
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