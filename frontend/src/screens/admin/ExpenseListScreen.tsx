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
import Header from '../../components/Header';
import { expenseService, Expense } from '../../services/expenseService';

const categories = ['ALL', 'Transport', 'Rent', 'Electricity', 'Salary', 'Maintenance', 'Other'];

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const loadExpenses = useCallback(async () => {
    try {
      const params: any = {};
      if (filterCategory !== 'ALL') {
        params.category = filterCategory;
      }
      const response = await expenseService.getAll(params);
      if (response.success) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(query) ||
          e.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
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

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await expenseService.delete(id);
              if (response.success) {
                Alert.alert('Success', 'Expense deleted');
                loadExpenses();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name={getCategoryIcon(item.category)} size={20} color={getCategoryColor(item.category)} />
          <Text style={styles.titleText}>{item.title}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
      </View>

      <View style={styles.expenseDetails}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={styles.dateText}>{new Date(item.expense_date).toLocaleDateString()}</Text>
      </View>

      {item.description && (
        <Text style={styles.descriptionText}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const filteredExpenses = getFilteredExpenses();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>💸 Expenses</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
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
          {categories.map((cat) => (
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

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredExpenses.length} expenses found
          </Text>
        </View>

        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubText}>Tap + to add an expense</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExpense')}
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
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
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
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a237e',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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