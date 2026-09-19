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
import { employeeService, Employee } from '../../services/employeeService';

export default function EmployeeListScreen({ navigation }: any) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getAll();
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  const getFilteredEmployees = () => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(query) ||
        e.employee_id?.toLowerCase().includes(query) ||
        e.email?.toLowerCase().includes(query) ||
        e.phone?.includes(query)
    );
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Deactivate Employee',
      `Are you sure you want to deactivate ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await employeeService.delete(id);
              if (response.success) {
                Alert.alert('Success', 'Employee deactivated');
                loadEmployees();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#2e7d32';
      case 'INVITED': return '#f57c00';
      case 'DEACTIVATED': return '#d32f2f';
      default: return '#666';
    }
  };

  const renderItem = ({ item }: { item: Employee }) => {
    // Determine role name based on permissions
    const getRoleName = (permissions: string[]) => {
      if (!permissions || permissions.length === 0) return 'No Role';
      
      // Check for role patterns
      if (permissions.includes('VIEW_PAYMENTS') && permissions.includes('VIEW_PROFIT')) {
        return 'Accountant';
      }
      if (permissions.includes('MANAGE_DELIVERIES') && !permissions.includes('CREATE_SALE')) {
        return 'Delivery Boy';
      }
      if (permissions.includes('MANAGE_PRODUCTS') && permissions.includes('VIEW_STOCK')) {
        return 'Store Manager';
      }
      if (permissions.includes('CREATE_SALE') && permissions.includes('MANAGE_CUSTOMERS')) {
        return 'Cashier';
      }
      if (permissions.includes('CREATE_SALE')) {
        return 'Sales Staff';
      }
      return 'Employee';
    };
  
    const roleName = getRoleName(item.permissions);
  
    return (
      <TouchableOpacity
        style={styles.employeeCard}
        onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id })}
      >
        <View style={styles.employeeHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: '#e8eaf6' }]}>
              <Text style={styles.roleBadgeText}>{roleName}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'INVITED'}</Text>
          </View>
        </View>
  
        <Text style={styles.employeeId}>ID: {item.employee_id}</Text>
  
        <View style={styles.employeeDetails}>
          {item.phone && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
          )}
        </View>
  
        {item.permissions && item.permissions.length > 0 && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsLabel}>Permissions:</Text>
            <View style={styles.permissionsChips}>
              {item.permissions.slice(0, 3).map((perm, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{perm.replace('_', ' ')}</Text>
                </View>
              ))}
              {item.permissions.length > 3 && (
                <Text style={styles.moreText}>+{item.permissions.length - 3}</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  const filteredEmployees = getFilteredEmployees();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>👥 Employees</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, email..."
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

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredEmployees.length} employees found
          </Text>
        </View>

        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No employees found</Text>
              <Text style={styles.emptySubText}>Tap + to add an employee</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddEmployee')}
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
  employeeCard: {
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
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  employeeId: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  employeeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  permissionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 9,
    color: '#1a237e',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#e8eaf6',
  },
  roleBadgeText: {
    fontSize: 9,
    color: '#1a237e',
    fontWeight: '600',
  },
});