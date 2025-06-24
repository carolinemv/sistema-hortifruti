import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos básicos
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Customer {
  id: number;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  supplier_id?: number;
}

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
  };
}

export interface Sale {
  id: number;
  customer_id: number;
  seller_id: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  paid_at?: string;
  customer?: Customer;
  seller?: User;
  items: SaleItem[];
}

// Tipos para as novas funcionalidades
export interface CustomerSummary {
  customer: {
    id: number;
    name: string;
    cpf: string;
  };
  summary: {
    total_amount: number;
    total_paid: number;
    total_remaining: number;
    accounts_count: number;
    status_counts: Record<string, number>;
  };
  accounts: Array<{
    id: number;
    sale_id: number;
    amount: number;
    paid_amount: number;
    remaining: number;
    status: string;
    due_date: string;
    created_at: string;
    sale?: {
      id: number;
      total_amount: number;
      payment_method: string;
      created_at: string;
    };
  }>;
}

export interface SalesByCustomer {
  customer: {
    id: number;
    name: string;
    cpf: string;
  };
  summary: {
    sales_count: number;
    total_amount: number;
    avg_amount: number;
    status_stats: Record<string, { count: number; amount: number }>;
  };
  sales: Array<{
    id: number;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    seller?: {
      id: number;
      name: string;
    };
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
}

// Funções de API básicas
export const getSales = async (params?: {
  customer_name?: string;
  seller_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Sale[]> => {
  const response = await api.get('/sales', { params });
  return response.data;
};

export const getCustomers = async (params?: {
  name?: string;
}): Promise<Customer[]> => {
  const response = await api.get('/customers', { params });
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

// Funções de API para vendas agrupadas por cliente
export const getSalesByCustomer = async (params?: {
  customer_name?: string;
  seller_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}): Promise<SalesByCustomer[]> => {
  const response = await api.get('/sales/grouped-by-customer', { params });
  return response.data;
};

// Funções de API para contas a receber por cliente
export const getCustomerSummary = async (customerId: number): Promise<CustomerSummary> => {
  const response = await api.get(`/accounts-receivable/customer/${customerId}/summary`);
  return response.data;
};

export const createCustomerPayment = async (customerId: number, payment: {
  amount: number;
  payment_method: string;
  notes?: string;
}) => {
  const response = await api.post(`/accounts-receivable/customer/${customerId}/payments`, payment);
  return response.data;
}; 