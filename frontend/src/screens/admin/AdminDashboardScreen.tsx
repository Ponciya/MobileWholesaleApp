import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

type MenuItem = {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen: string;
};

const menuItems: MenuItem[] = [
  { id: 'products', title: 'Products', icon: 'cube-outline', color: '#1565C0', screen: 'ProductList' },
  { id: 'suppliers', title: 'Suppliers', icon: 'people-outline', color: '#2e7d32', screen: 'SupplierList' },
  { id: 'purchases', title: 'Purchases', icon: 'cart-outline', color: '#f57c00', screen: 'PurchaseList' },
  { id: 'customers', title: 'Customers', icon: 'person-outline', color: '#6a1b9a', screen: 'CustomerList' },
  { id: 'sales', title: 'Sales', icon: 'trending-up-outline', color: '#d32f2f', screen: 'SaleList' },
  { id: 'deliveries', title: 'Deliveries', icon: 'car-outline', color: '#00838f', screen: 'OutgoingDeliveryList' },
  { id: 'payments', title: 'Payments', icon: 'cash-outline', color: '#2e7d32', screen: 'PaymentList' },
  { id: 'expenses', title: 'Expenses', icon: 'receipt-outline', color: '#e65100', screen: 'ExpenseList' },
  { id: 'profit', title: 'P&L', icon: 'stats-chart-outline', color: '#1a237e', screen: 'ProfitLoss' },
  { id: 'reports', title: 'Reports', icon: 'document-text-outline', color: '#4a148c', screen: 'ReportList' },
  { id: 'reorder', title: 'Reorder', icon: 'refresh-outline', color: '#e65100', screen: 'Reorder' },
  { id: 'employees', title: 'Employees', icon: 'people', color: '#6a1b9a', screen: 'EmployeeList' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📱 Wholesale Mobile Shop</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome, {user?.name || 'Admin'}!</Text>
          <Text style={styles.roleText}>You are logged in as {user?.role || 'Admin'}</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.gridLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  roleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d32f2f',
  },
});