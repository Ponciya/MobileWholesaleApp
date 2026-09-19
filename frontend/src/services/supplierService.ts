import api from './api';

export interface Supplier {
  id?: number;
  supplier_name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export const supplierService = {
  // Get all suppliers
  getAll: async (params?: any) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  // Get single supplier
  getOne: async (id: number) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  create: async (data: Partial<Supplier>) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  // Update supplier
  update: async (id: number, data: Partial<Supplier>) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  // Delete supplier
  delete: async (id: number) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
};