import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { productService } from '../../services/productService';

type MenuItem = {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen: string;
};

export default function EmployeeDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth(); // 👈 Add logout
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // 👇 Remove Stock button
  const menuItems: MenuItem[] = [
    { id: 'products', title: 'Products', icon: 'cube-outline', color: '#1565C0', screen: 'ProductList' },
    { id: 'sales', title: 'Create Sale', icon: 'cart-outline', color: '#d32f2f', screen: 'AddSale' },
    { id: 'customers', title: 'Customers', icon: 'person-outline', color: '#6a1b9a', screen: 'CustomerList' },
    { id: 'profile', title: 'Profile', icon: 'person-circle-outline', color: '#1a237e', screen: 'Profile' },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await productService.getAll();
      if (response.success) {
        const products = response.data || [];
        let totalStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        products.forEach((p: any) => {
          totalStock += p.current_stock || 0;
          if (p.current_stock === 0) outOfStock++;
          else if (p.current_stock <= p.minimum_stock) lowStock++;
        });

        setStats({
          totalProducts: products.length,
          totalStock,
          lowStock,
          outOfStock,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>👋 Welcome, {user?.name || 'Employee'}!</Text>
          <Text style={styles.roleText}>You are logged in as Employee</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={[styles.statValue, { color: '#1565C0' }]}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.statValue, { color: '#2e7d32' }]}>{stats.totalStock}</Text>
            <Text style={styles.statLabel}>Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.statValue, { color: '#f57c00' }]}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
            <Text style={[styles.statValue, { color: '#d32f2f' }]}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 12,
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