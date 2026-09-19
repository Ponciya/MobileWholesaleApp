import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { paymentService, Payment } from '../../services/paymentService';

export default function PaymentDetailScreen({ navigation, route }: any) {
  const { paymentId } = route.params;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayment();
  }, []);

  const loadPayment = async () => {
    try {
      const response = await paymentService.getOne(paymentId);
      if (response.success) {
        setPayment(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await paymentService.delete(paymentId);
              if (response.success) {
                Alert.alert('Success', 'Payment deleted');
                navigation.navigate('PaymentList');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.centered}>
        <Text>Payment not found</Text>
      </View>
    );
  }

  const isCustomer = payment.payment_type === 'CUSTOMER';

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
            <Text style={styles.pageTitle}>📄 Payment Details</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash" size={22} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.statusSection}>
            <Ionicons 
              name={isCustomer ? 'person' : 'business'} 
              size={40} 
              color={isCustomer ? '#1a237e' : '#f57c00'} 
            />
            <Text style={styles.typeText}>{isCustomer ? 'CUSTOMER PAYMENT' : 'SUPPLIER PAYMENT'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={[styles.value, styles.amount]}>₹{payment.amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{new Date(payment.payment_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{payment.payment_method || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{payment.reference_number || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          {isCustomer ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{payment.customer_name || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sale ID</Text>
                <Text style={styles.value}>#{payment.sale_id}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Supplier</Text>
                <Text style={styles.value}>{payment.supplier_name || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Purchase ID</Text>
                <Text style={styles.value}>#{payment.purchase_id}</Text>
              </View>
            </>
          )}

          {payment.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{payment.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  deleteButton: {
    padding: 4,
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
  statusSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 4,
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
  amount: {
    fontWeight: '700',
    color: '#1a237e',
    fontSize: 16,
  },
});