import api from './api';

export interface Employee {
  id?: number;
  name: string;
  employee_id: string;
  phone?: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
  created_at?: string;
}

export const employeeService = {
  // Get all employees
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  // Get single employee
  getOne: async (id: number) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Create employee
  create: async (data: Partial<Employee>) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  // Update employee
  update: async (id: number, data: Partial<Employee>) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  // Delete employee
  delete: async (id: number) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  // Reset password
  resetPassword: async (id: number, new_password: string) => {
    const response = await api.post(`/employees/${id}/reset-password`, { new_password });
    return response.data;
  },

  // Get own profile (for employee)
  getMyProfile: async () => {
    const response = await api.get('/employees/profile');
    return response.data;
  },

  // Update own profile
  updateMyProfile: async (data: Partial<Employee>) => {
    const response = await api.put('/employees/profile', data);
    return response.data;
  },
};