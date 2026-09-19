import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const AUTH_TOKEN_STORAGE_KEY = 'mobileWholesaleApp:authToken';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👇 REQUEST INTERCEPTOR (Already exists - Keep this)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  console.log('📦 Token from storage:', token);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👇 ADD THIS - RESPONSE INTERCEPTOR (After request interceptor)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem('mobileWholesaleApp:authUser');
      console.log('❌ Token expired, session cleared');
    }
    return Promise.reject(error);
  }
);

export interface LoginResponseUser {
  id: number;
  employeeId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
  permissions: string[];
}

export interface LoginResponseData {
  token: string;
  user: LoginResponseUser;
}

export async function loginRequest(emailOrEmployeeId: string, password: string): Promise<LoginResponseData> {
  const response = await api.post('/auth/login', { emailOrEmployeeId, password });
  return response.data.data;
}

export default api;