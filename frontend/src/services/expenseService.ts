import api from './api';

export interface Expense {
  id?: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  description?: string;
  created_by?: number;
  created_at?: string;
}

export const expenseService = {
  getAll: async (params?: any) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  getOne: async (id: number) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },
  create: async (data: Partial<Expense>) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Expense>) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};