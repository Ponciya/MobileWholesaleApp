import api from './api';

export interface Purchase {
  id?: number;
  supplier_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  total_amount?: number;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  status?: 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  purchase_date?: string;
  supplier_name?: string;
  brand?: string;
  model_name?: string;
  paid_amount?: number;      // 👈 Add this
  pending_amount?: number;   // 👈 Add this
}

export const purchaseService = {
  // Get all purchases
  getAll: async (params?: any) => {
    const response = await api.get('/purchases', { params });
    return response.data;
  },

  // Get single purchase
  getOne: async (id: number) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },

  // Create purchase
  create: async (data: Partial<Purchase>) => {
    const response = await api.post('/purchases', data);
    return response.data;
  },

  // Update purchase (edit)
  update: async (id: number, data: Partial<Purchase>) => {
    const response = await api.put(`/purchases/${id}`, data);
    return response.data;
  },

  // Update purchase status
  updateStatus: async (id: number, status: string, notes?: string) => {
    const response = await api.put(`/purchases/${id}/status`, { status, notes });
    return response.data;
  },

  // Return purchase items (stock decrease)
  returnPurchase: async (id: number) => {
    const response = await api.post(`/purchases/${id}/return`);
    return response.data;
  },

  // Delete purchase
  delete: async (id: number) => {
    const response = await api.delete(`/purchases/${id}`);
    return response.data;
  },
};