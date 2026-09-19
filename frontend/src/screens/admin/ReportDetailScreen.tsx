import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { reportService } from '../../services/reportService';

type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function ReportDetailScreen({ navigation, route }: any) {
  const { reportId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const reportTitles: any = {
    sales: 'Sales Report',
    purchases: 'Purchase Report',
    stock: 'Stock Report',
    profit: 'Profit Report',
    expenses: 'Expense Report',
    'low-stock': 'Low Stock Report',
  };

  const loadData = useCallback(async (range?: DateRange, from?: string, to?: string) => {
    setLoading(true);
    try {
      let fromDate = '';
      let toDate = '';
      const now = new Date();

      if (range === 'today') {
        fromDate = now.toISOString().split('T')[0];
        toDate = fromDate;
      } else if (range === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        fromDate = start.toISOString().split('T')[0];
        toDate = now.toISOString().split('T')[0];
      } else if (range === 'month') {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        fromDate = start.toISOString().split('T')[0];
        toDate = now.toISOString().split('T')[0];
      } else if (range === 'custom' && from && to) {
        fromDate = from;
        toDate = to;
      }

      let response;
      const params = fromDate ? { from: fromDate, to: toDate } : {};

      switch (reportId) {
        case 'sales':
          response = await reportService.getSales(params);
          break;
        case 'purchases':
          response = await reportService.getPurchases(params);
          break;
        case 'stock':
          response = await reportService.getStock(params);
          break;
        case 'profit':
          response = await reportService.getProfit(params);
          break;
        case 'expenses':
          response = await reportService.getExpenses(params);
          break;
        case 'low-stock':
          response = await reportService.getLowStock();
          break;
        default:
          response = { success: false, data: [] };
      }

      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadData(dateRange);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(dateRange, customFrom, customTo);
  };

  const handleDateRange = (range: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      loadData(range);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      loadData('custom', customFrom, customTo);
      setShowCustom(false);
    } else {
      Alert.alert('Error', 'Please select both from and to dates');
    }
  };

  const renderItem = ({ item, index }: any) => {
    // Profit Report
    if (reportId === 'profit') {
      return (
        <View style={styles.profitCard}>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Total Sales</Text>
            <Text style={styles.profitValue}>₹{item.totalSales}</Text>
          </View>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>COGS</Text>
            <Text style={[styles.profitValue, { color: '#d32f2f' }]}>₹{item.cogs}</Text>
          </View>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Gross Profit</Text>
            <Text style={[styles.profitValue, { color: '#2e7d32' }]}>₹{item.grossProfit}</Text>
          </View>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Expenses</Text>
            <Text style={[styles.profitValue, { color: '#f57c00' }]}>₹{item.totalExpenses}</Text>
          </View>
          <View style={[styles.profitRow, styles.netRow]}>
            <Text style={styles.profitLabel}>Net Profit</Text>
            <Text style={[styles.profitValue, { color: item.netProfit >= 0 ? '#2e7d32' : '#d32f2f', fontWeight: '700' }]}>
              ₹{item.netProfit}
            </Text>
          </View>
          <Text style={styles.orderText}>Total Orders: {item.totalOrders}</Text>
        </View>
      );
    }
  
    // Stock Report or Low Stock Report
    if (reportId === 'stock' || reportId === 'low-stock') {
      const isLowStock = reportId === 'low-stock';
      
      // ✅ Correct Stock Badge Logic
      let stockStatus = 'IN STOCK';
      let stockColor = '#2e7d32';
      if (item.current_stock === 0) {
        stockStatus = 'OUT';
        stockColor = '#d32f2f';
      } else if (item.current_stock <= item.minimum_stock) {
        stockStatus = 'LOW';
        stockColor = '#f57c00';
      }
  
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName}>{item.brand} {item.model_name}</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
              <Text style={styles.stockBadgeText}>{stockStatus}</Text>
            </View>
          </View>
          <Text style={styles.skuText}>SKU: {item.sku}</Text>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Current Stock: {item.current_stock}</Text>
            <Text style={styles.stockLabel}>Min Stock: {item.minimum_stock}</Text>
          </View>
          {isLowStock && (
            <View style={styles.reorderRow}>
              <Text style={styles.reorderText}>Required: {item.required_quantity || 0}</Text>
              <Text style={styles.reorderText}>Amount: ₹{item.reorder_amount || 0}</Text>
            </View>
          )}
          {item.supplier_name && (
            <Text style={styles.supplierText}>Supplier: {item.supplier_name}</Text>
          )}
        </View>
      );
    }
  
    // Sales, Purchases, Expenses
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>
            {item.customer_name || item.supplier_name || item.title || 'N/A'}
          </Text>
          <Text style={styles.amountText}>₹{item.total_amount || item.amount || 0}</Text>
        </View>
        {item.category && (
          <Text style={styles.categoryText}>Category: {item.category}</Text>
        )}
        {item.payment_status && (
          <Text style={styles.statusText}>Status: {item.payment_status}</Text>
        )}
        <Text style={styles.dateText}>
          {new Date(item.sale_date || item.purchase_date || item.expense_date).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const reportData = Array.isArray(data) ? data : [data];
  const title = reportTitles[reportId] || 'Report';

  return (
    <View style={styles.container}>
      <Header showBack={true} onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📊 {title}</Text>
        </View>

        {/* Date Range Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, dateRange === 'today' && styles.filterActive]}
            onPress={() => handleDateRange('today')}
          >
            <Text style={[styles.filterText, dateRange === 'today' && styles.filterTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, dateRange === 'week' && styles.filterActive]}
            onPress={() => handleDateRange('week')}
          >
            <Text style={[styles.filterText, dateRange === 'week' && styles.filterTextActive]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, dateRange === 'month' && styles.filterActive]}
            onPress={() => handleDateRange('month')}
          >
            <Text style={[styles.filterText, dateRange === 'month' && styles.filterTextActive]}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, dateRange === 'custom' && styles.filterActive]}
            onPress={() => handleDateRange('custom')}
          >
            <Text style={[styles.filterText, dateRange === 'custom' && styles.filterTextActive]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Date Picker */}
        {showCustom && (
          <View style={styles.customContainer}>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="From (YYYY-MM-DD)"
                placeholderTextColor="#999"
                value={customFrom}
                onChangeText={setCustomFrom}
              />
              <TextInput
                style={styles.customInput}
                placeholder="To (YYYY-MM-DD)"
                placeholderTextColor="#999"
                value={customTo}
                onChangeText={setCustomTo}
              />
              <TouchableOpacity style={styles.customApply} onPress={handleCustomApply}>
                <Text style={styles.customApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {data && (
          <View style={styles.listContainer}>
            <FlatList
              data={reportData}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              renderItem={renderItem}
              scrollEnabled={false}
            />
            <Text style={styles.countText}>
              Total {reportId === 'profit' ? '1' : reportData.length} record(s)
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  filterActive: {
    backgroundColor: '#1a237e',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  customContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  customApply: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  customApplyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  profitCard: {
    paddingVertical: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  profitLabel: {
    fontSize: 14,
    color: '#666',
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },
  orderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
  },
  skuText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockLabel: {
    fontSize: 13,
    color: '#333',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 6,
  },
  reorderText: {
    fontSize: 13,
    color: '#e65100',
    fontWeight: '600',
  },
  supplierText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  countText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});