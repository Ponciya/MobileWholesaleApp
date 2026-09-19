import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import EmployeeDashboardScreen from '../screens/employee/EmployeeDashboardScreen';
import {
  AuthStackParamList,
  AdminStackParamList,
  EmployeeStackParamList,
} from './types';

import ProductListScreen from '../screens/admin/ProductListScreen';
import ProductAddScreen from '../screens/admin/ProductAddScreen';
import ProductDetailScreen from '../screens/admin/ProductDetailScreen';

import SupplierListScreen from '../screens/admin/SupplierListScreen';
import SupplierAddScreen from '../screens/admin/SupplierAddScreen';
import SupplierDetailScreen from '../screens/admin/SupplierDetailScreen';

import PurchaseListScreen from '../screens/admin/PurchaseListScreen';
import PurchaseAddScreen from '../screens/admin/PurchaseAddScreen';
import PurchaseDetailScreen from '../screens/admin/PurchaseDetailScreen';

import CustomerListScreen from '../screens/admin/CustomerListScreen';
import CustomerAddScreen from '../screens/admin/CustomerAddScreen';
import CustomerDetailScreen from '../screens/admin/CustomerDetailScreen';

// 👇 Sales imports
import SaleListScreen from '../screens/admin/SaleListScreen';
import SaleAddScreen from '../screens/admin/SaleAddScreen';
import SaleDetailScreen from '../screens/admin/SaleDetailScreen';

// Add imports
import OutgoingDeliveryListScreen from '../screens/admin/OutgoingDeliveryListScreen';
import OutgoingDeliveryAddScreen from '../screens/admin/OutgoingDeliveryAddScreen';
import OutgoingDeliveryDetailScreen from '../screens/admin/OutgoingDeliveryDetailScreen';

// Add imports
import PaymentListScreen from '../screens/admin/PaymentListScreen';
import PaymentAddScreen from '../screens/admin/PaymentAddScreen';
import PaymentDetailScreen from '../screens/admin/PaymentDetailScreen';

// Add imports
import ExpenseListScreen from '../screens/admin/ExpenseListScreen';
import ExpenseAddScreen from '../screens/admin/ExpenseAddScreen';
import ExpenseDetailScreen from '../screens/admin/ExpenseDetailScreen';

import ProfitLossScreen from '../screens/admin/ProfitLossScreen';

import ReportListScreen from '../screens/admin/ReportListScreen';
import ReportDetailScreen from '../screens/admin/ReportDetailScreen';

import ReorderScreen from '../screens/admin/ReorderScreen';

// Add imports
import EmployeeListScreen from '../screens/admin/EmployeeListScreen';
import EmployeeAddScreen from '../screens/admin/EmployeeAddScreen';
import EmployeeDetailScreen from '../screens/admin/EmployeeDetailScreen'
import EmployeeProfileScreen from '../screens/employee/EmployeeProfileScreen';


const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const EmployeeStack = createNativeStackNavigator<EmployeeStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="ProductList" component={ProductListScreen} />
      <AdminStack.Screen name="AddProduct" component={ProductAddScreen} />
      <AdminStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <AdminStack.Screen name="SupplierList" component={SupplierListScreen} />
      <AdminStack.Screen name="AddSupplier" component={SupplierAddScreen} />
      <AdminStack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <AdminStack.Screen name="PurchaseList" component={PurchaseListScreen} />
      <AdminStack.Screen name="AddPurchase" component={PurchaseAddScreen} />
      <AdminStack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
      <AdminStack.Screen name="CustomerList" component={CustomerListScreen} />
      <AdminStack.Screen name="AddCustomer" component={CustomerAddScreen} />
      <AdminStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <AdminStack.Screen name="SaleList" component={SaleListScreen} />
      <AdminStack.Screen name="AddSale" component={SaleAddScreen} />
      <AdminStack.Screen name="SaleDetail" component={SaleDetailScreen} />
      <AdminStack.Screen name="OutgoingDeliveryList" component={OutgoingDeliveryListScreen} />
      <AdminStack.Screen name="AddOutgoingDelivery" component={OutgoingDeliveryAddScreen} />
      <AdminStack.Screen name="OutgoingDeliveryDetail" component={OutgoingDeliveryDetailScreen} />
      <AdminStack.Screen name="PaymentList" component={PaymentListScreen} />
      <AdminStack.Screen name="AddPayment" component={PaymentAddScreen} />
      <AdminStack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <AdminStack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <AdminStack.Screen name="AddExpense" component={ExpenseAddScreen} />
      <AdminStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <AdminStack.Screen name="ProfitLoss" component={ProfitLossScreen} />
      <AdminStack.Screen name="ReportList" component={ReportListScreen} />
      <AdminStack.Screen name="ReportDetail" component={ReportDetailScreen} />

      <AdminStack.Screen name="Reorder" component={ReorderScreen} />

      <AdminStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <AdminStack.Screen name="AddEmployee" component={EmployeeAddScreen} />
      <AdminStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    </AdminStack.Navigator>
  );
}

function EmployeeNavigator() {
  return (
    <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
    <EmployeeStack.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} />
    <EmployeeStack.Screen name="ProductList" component={ProductListScreen} />
    <EmployeeStack.Screen name="AddSale" component={SaleAddScreen} />
    <EmployeeStack.Screen name="CustomerList" component={CustomerListScreen} />
    <EmployeeStack.Screen name="PaymentList" component={PaymentListScreen} />
    <EmployeeStack.Screen name="PaymentDetail" component={PaymentDetailScreen} /> 
    <EmployeeStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <EmployeeStack.Screen name="OutgoingDeliveryList" component={OutgoingDeliveryListScreen} />
    <EmployeeStack.Screen name="Profile" component={EmployeeProfileScreen} />
  </EmployeeStack.Navigator>
);
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'ADMIN' ? (
        <AdminNavigator />
      ) : (
        <EmployeeNavigator />
      )}
    </NavigationContainer>
  );
}