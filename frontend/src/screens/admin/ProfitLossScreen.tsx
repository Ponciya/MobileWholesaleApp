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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { reportService, ProfitLossData } from '../../services/reportService';

type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function ProfitLossScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

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

      const response = await reportService.getProfitLoss(fromDate, toDate);
      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profit & loss');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  // ✅ Safe formatCurrency - handles any input type
  const formatCurrency = (amount: any): string => {
    // Convert to number
    let num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num) || num === undefined || num === null) {
      return '₹0.00';
    }
    return '₹' + num.toFixed(2);
  };

  const renderMetric = (label: string, value: any, color: string = '#1a237e') => {
    // Ensure value is a number
    const safeValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{formatCurrency(safeValue)}</Text>
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

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📊 Profit & Loss</Text>
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
          <View style={styles.card}>
            {/* Revenue Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue</Text>
              {renderMetric('Total Sales', data.totalSales)}
            </View>

            <View style={styles.divider} />

            {/* Cost Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost of Goods Sold</Text>
              {renderMetric('COGS', data.cogs, '#d32f2f')}
            </View>

            <View style={styles.divider} />

            {/* Gross Profit */}
            <View style={[styles.section, styles.highlight]}>
              <Text style={styles.sectionTitle}>Gross Profit</Text>
              {renderMetric('Gross Profit', data.grossProfit, '#2e7d32')}
            </View>

            <View style={styles.divider} />

            {/* Expenses */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              {renderMetric('Total Expenses', data.totalExpenses, '#f57c00')}
            </View>

            <View style={styles.divider} />

            {/* Net Profit */}
            <View style={[styles.section, styles.netProfit]}>
              <Text style={[styles.sectionTitle, styles.netTitle]}>Net Profit</Text>
              {renderMetric('Net Profit', data.netProfit, data.netProfit >= 0 ? '#2e7d32' : '#d32f2f')}
            </View>

            <View style={styles.divider} />

            {/* Extra Info */}
            <View style={styles.extraInfo}>
              <Text style={styles.extraText}>Total Orders: {data.totalOrders}</Text>
            </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metricCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  highlight: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  netProfit: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  netTitle: {
    color: '#1a237e',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  extraInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  extraText: {
    fontSize: 13,
    color: '#666',
  },
});