import api from './api';

export interface Customer {
  id?: number;
  name: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export const customerService = {
  getAll: async (params?: any) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  getOne: async (id: number) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data: Partial<Customer>) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Customer>) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};