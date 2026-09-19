import api from './api';

export interface OutgoingDelivery {
  id?: number;
  sale_id: number;
  status?: 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  delivery_date?: string;
  created_at?: string;
  customer_name?: string;
}

export const outgoingDeliveryService = {
  getAll: async (params?: any) => {
    const response = await api.get('/outgoing-deliveries', { params });
    return response.data;
  },
  getOne: async (id: number) => {
    const response = await api.get(`/outgoing-deliveries/${id}`);
    return response.data;
  },
  create: async (data: { sale_id: number; notes?: string }) => {
    const response = await api.post('/outgoing-deliveries', data);
    return response.data;
  },
  updateStatus: async (id: number, status: string, notes?: string) => {
    const response = await api.put(`/outgoing-deliveries/${id}/status`, { status, notes });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/outgoing-deliveries/${id}`);
    return response.data;
  },
};