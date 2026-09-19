import React, { useState } from 'react';
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
import { productService } from '../../services/productService';
import Header from '../../components/Header';

const categories = ['Mobile', 'Headset', 'Earbud', 'Charger', 'Cable', 'Accessory'];

export default function ProductAddScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    brand: '',
    model_name: '',
    category: '',
    variant: '',
    ram: '',
    storage: '',
    color: '',
    imei_serial: '',
    purchase_price: '',
    selling_price: '',
    wholesale_price: '',
    current_stock: '',
    minimum_stock: '',
    status: 'ACTIVE',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.sku.trim()) {
      Alert.alert('Error', 'SKU is required');
      return;
    }
    if (!formData.brand.trim()) {
      Alert.alert('Error', 'Brand is required');
      return;
    }
    if (!formData.model_name.trim()) {
      Alert.alert('Error', 'Model name is required');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      Alert.alert('Error', 'Purchase price must be greater than 0');
      return;
    }
    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      Alert.alert('Error', 'Selling price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : undefined,
        current_stock: parseInt(formData.current_stock) || 0,
        minimum_stock: parseInt(formData.minimum_stock) || 5,
      };

      const response = await productService.create(data);
      if (response.success) {
        Alert.alert('Success', 'Product added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add product');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.modalItem}
                onPress={() => {
                  setFormData({ ...formData, category: cat });
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
          <Text style={styles.pageTitle}>📝 Add Product</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>SKU *</Text>
              <TextInput
                style={styles.input}
                value={formData.sku}
                onChangeText={(v) => handleChange('sku', v)}
                placeholder="e.g. PH-001"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 2, marginLeft: 10 }]}>
              <Text style={styles.label}>Brand *</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(v) => handleChange('brand', v)}
                placeholder="e.g. Samsung"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.model_name}
              onChangeText={(v) => handleChange('model_name', v)}
              placeholder="e.g. Galaxy S24 Ultra"
              placeholderTextColor="#999"
            />
          </View>

          {/* 👇 Category Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={formData.category ? styles.pickerText : styles.pickerPlaceholder}>
                {formData.category || 'Select category...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Variant</Text>
              <TextInput
                style={styles.input}
                value={formData.variant}
                onChangeText={(v) => handleChange('variant', v)}
                placeholder="e.g. Premium"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                value={formData.color}
                onChangeText={(v) => handleChange('color', v)}
                placeholder="e.g. Black"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>RAM</Text>
              <TextInput
                style={styles.input}
                value={formData.ram}
                onChangeText={(v) => handleChange('ram', v)}
                placeholder="e.g. 8GB"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Storage</Text>
              <TextInput
                style={styles.input}
                value={formData.storage}
                onChangeText={(v) => handleChange('storage', v)}
                placeholder="e.g. 256GB"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IMEI / Serial Number</Text>
            <TextInput
              style={styles.input}
              value={formData.imei_serial}
              onChangeText={(v) => handleChange('imei_serial', v)}
              placeholder="e.g. 356789012345678"
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Purchase Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.purchase_price}
                onChangeText={(v) => handleChange('purchase_price', v)}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Selling Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.selling_price}
                onChangeText={(v) => handleChange('selling_price', v)}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wholesale Price</Text>
            <TextInput
              style={styles.input}
              value={formData.wholesale_price}
              onChangeText={(v) => handleChange('wholesale_price', v)}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Stock</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Current Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.current_stock}
                onChangeText={(v) => handleChange('current_stock', v)}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Minimum Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.minimum_stock}
                onChangeText={(v) => handleChange('minimum_stock', v)}
                placeholder="5"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add Product</Text>
            )}
          </TouchableOpacity>
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
  pageTitleContainer: {
    backgroundColor: '#e8eaf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  form: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginTop: 16,
    marginBottom: 12,
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
    marginTop: 24,
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