import api from './api';

export interface Product {
  id?: number;
  sku: string;
  brand: string;
  model_name: string;
  variant?: string;
  ram?: string;
  storage?: string;
  color?: string;
  imei_serial?: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price?: number;
  current_stock: number;
  minimum_stock: number;
  supplier_id?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const productService = {
  // Get all products
  getAll: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product
  getOne: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  create: async (data: Partial<Product>) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Update product 👈 NEW
  update: async (id: number, data: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete product 👈 NEW
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get low stock products
  getLowStock: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },
};