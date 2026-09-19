import api from './api';

export interface Payment {
  id?: number;
  customer_id?: number;
  supplier_id?: number;
  sale_id?: number;
  purchase_id?: number;
  amount: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  status?: 'PAID' | 'PARTIAL' | 'PENDING';
  customer_name?: string;
  supplier_name?: string;
}

export const paymentService = {
  getAll: async (params?: any) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },
  getOne: async (id: number) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
  createCustomerPayment: async (data: {
    customer_id: number;
    sale_id: number;
    amount: number;
    payment_method?: string;
    reference?: string;
    notes?: string;
  }) => {
    const response = await api.post('/payments/customer', data);
    return response.data;
  },
  createSupplierPayment: async (data: {
    supplier_id: number;
    purchase_id: number;
    amount: number;
    payment_method?: string;
    reference?: string;
    notes?: string;
  }) => {
    const response = await api.post('/payments/supplier', data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },
};