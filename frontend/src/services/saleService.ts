import api from './api';

export interface Sale {
  id?: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  selling_price: number;
  discount?: number;
  paid_amount?: number;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
  sale_date?: string;
  customer_name?: string;
  brand?: string;
  model_name?: string;
  subtotal?: number;
  total_amount?: number;
  pending_amount?: number;
}

export const saleService = {
  getAll: async (params?: any) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },
  getOne: async (id: number) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
  create: async (data: Partial<Sale>) => {
    const response = await api.post('/sales', data);
    return response.data;
  },
  updatePayment: async (id: number, payment_status: string, paid_amount?: number) => {
    const response = await api.put(`/sales/${id}/payment`, { payment_status, paid_amount });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },
};