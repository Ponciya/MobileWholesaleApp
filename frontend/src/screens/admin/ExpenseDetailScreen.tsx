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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { expenseService, Expense } from '../../services/expenseService';

const categories = ['Transport', 'Rent', 'Electricity', 'Salary', 'Maintenance', 'Other'];

export default function ExpenseDetailScreen({ navigation, route }: any) {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Expense>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadExpense();
  }, []);

  const loadExpense = async () => {
    try {
      const response = await expenseService.getOne(expenseId);
      if (response.success) {
        setExpense(response.data);
        setEditData(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Delete "${expense?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await expenseService.delete(expenseId);
              if (response.success) {
                Alert.alert('Success', 'Expense deleted');
                navigation.navigate('ExpenseList');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      // ✅ Format date properly before sending
      const dataToSend = { ...editData };
      if (dataToSend.expense_date) {
        // Keep only YYYY-MM-DD format
        dataToSend.expense_date = dataToSend.expense_date.split('T')[0];
      }
      // Ensure amount is number
      if (dataToSend.amount) {
        dataToSend.amount = parseFloat(dataToSend.amount.toString()) || 0;
      }
      
      const response = await expenseService.update(expenseId, dataToSend);
      if (response.success) {
        setExpense(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Expense updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Transport': return '#1565C0';
      case 'Rent': return '#f57c00';
      case 'Electricity': return '#fdd835';
      case 'Salary': return '#2e7d32';
      case 'Maintenance': return '#6d4c41';
      case 'Other': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Transport': return 'car-outline';
      case 'Rent': return 'business-outline';
      case 'Electricity': return 'flash-outline';
      case 'Salary': return 'cash-outline';
      case 'Maintenance': return 'construct-outline';
      case 'Other': return 'ellipsis-horizontal-outline';
      default: return 'cube-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centered}>
        <Text>Expense not found</Text>
      </View>
    );
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEditData({ ...editData, expense_date: formattedDate });
    }
  };


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
            <Text style={styles.pageTitle}>📄 Expense Details</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.actionButton}>
                <Ionicons name={isEditing ? 'close' : 'pencil'} size={22} color="#1a237e" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={22} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <View>
              <Text style={styles.editTitle}>✏️ Edit Expense</Text>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Title</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.title}
                  onChangeText={(v) => setEditData({ ...editData, title: v })}
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
                <Text style={styles.editLabel}>Amount</Text>
                <TextInput
                  style={styles.editInput}
                  value={editData.amount?.toString()}
                  onChangeText={(v) => setEditData({ ...editData, amount: parseFloat(v) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Date</Text>
                <TextInput
                    style={styles.editInput}
                    value={editData.expense_date ? editData.expense_date.split('T')[0] : ''}
                    onChangeText={(v) => setEditData({ ...editData, expense_date: v })}
                    placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Description</Text>
                <TextInput
                  style={[styles.editInput, styles.textArea]}
                  value={editData.description}
                  onChangeText={(v) => setEditData({ ...editData, description: v })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.headerSection}>
                <View style={styles.iconContainer}>
                  <Ionicons name={getCategoryIcon(expense.category)} size={40} color={getCategoryColor(expense.category)} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.titleText}>{expense.title}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(expense.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(expense.category) }]}>
                      {expense.category}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Amount</Text>
                <Text style={[styles.value, styles.amount]}>₹{expense.amount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{new Date(expense.expense_date).toLocaleDateString()}</Text>
              </View>

              {expense.description && (
                <View style={styles.row}>
                  <Text style={styles.label}>Description</Text>
                  <Text style={styles.value}>{expense.description}</Text>
                </View>
              )}

              {expense.created_at && (
                <View style={styles.row}>
                  <Text style={styles.label}>Created</Text>
                  <Text style={styles.value}>{new Date(expense.created_at).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category Modal */}
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
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  amount: {
    fontWeight: '700',
    color: '#1a237e',
    fontSize: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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