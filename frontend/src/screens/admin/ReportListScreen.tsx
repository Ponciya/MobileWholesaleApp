import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const reports = [
  { id: 'sales', title: 'Sales Report', icon: 'trending-up', color: '#2e7d32' },
  { id: 'purchases', title: 'Purchase Report', icon: 'trending-down', color: '#f57c00' },
  { id: 'stock', title: 'Stock Report', icon: 'cube', color: '#1565C0' },
  { id: 'profit', title: 'Profit Report', icon: 'cash', color: '#1a237e' },
  { id: 'expenses', title: 'Expense Report', icon: 'receipt', color: '#d32f2f' },
  { id: 'low-stock', title: 'Low Stock Report', icon: 'alert-circle', color: '#e65100' },
];

export default function ReportListScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Header />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>📊 Reports</Text>
        </View>

        <View style={styles.grid}>
          {reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
            >
              <View style={[styles.iconContainer, { backgroundColor: report.color + '20' }]}>
                <Ionicons name={report.icon as any} size={32} color={report.color} />
              </View>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a237e',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  reportCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});