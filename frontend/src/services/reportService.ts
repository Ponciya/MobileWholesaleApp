import api from './api';

export interface ProfitLossData {
  totalSales: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
}

export const reportService = {
  // Sales Report
  getSales: async (params?: any) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },
  
  // Purchase Report
  getPurchases: async (params?: any) => {
    const response = await api.get('/reports/purchases', { params });
    return response.data;
  },
  
  // Stock Report
  getStock: async (params?: any) => {
    const response = await api.get('/reports/stock', { params });
    return response.data;
  },
  
  // Profit Report
  getProfit: async (params?: any) => {
    const response = await api.get('/reports/profit', { params });
    return response.data;
  },
  
  // Expense Report
  getExpenses: async (params?: any) => {
    const response = await api.get('/reports/expenses', { params });
    return response.data;
  },
  
  // Low Stock Report
  getLowStock: async () => {
    const response = await api.get('/reports/low-stock');
    return response.data;
  },

  // Profit & Loss
  getProfitLoss: async (from?: string, to?: string) => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/reports/profit-loss', { params });
    return response.data;
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    const response = await api.get('/reports/dashboard-summary');
    return response.data;
  },
};