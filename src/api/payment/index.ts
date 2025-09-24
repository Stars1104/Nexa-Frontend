import { apiClient, paymentClient } from '../../services/apiClient';
import axios from 'axios';
export * from './creatorPayment';

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expires: string;
  isDefault: boolean;
  brand?: string;
  holder_name?: string;
}

export interface CreatePaymentMethodRequest {
  card_number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
  isDefault?: boolean;
}

export interface ProcessPaymentRequest {
  amount: number;
  card_id: string;
  description: string;
  campaign_id: number;
}

export interface SubscriptionPaymentRequest {
  card_number: string;
  card_holder_name: string;
  card_expiration_date: string; // MMYY format
  card_cvv: string;
  cpf: string; // Brazilian CPF in format XXX.XXX.XXX-XX
  subscription_plan_id: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  monthly_price: number;
  savings_percentage?: number;
  features: string[];
  sort_order: number;
}

export interface Transaction {
  id: number;
  pagarme_transaction_id: string;
  status: string;
  amount: number;
  payment_method: string;
  card_brand?: string;
  card_last4?: string;
  card_holder_name?: string;
  paid_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  amount_in_real: string;
}

export interface SubscriptionStatus {
  has_premium: boolean;
  premium_expires_at?: string;
  free_trial_expires_at?: string;
  is_premium_active: boolean;
  is_on_trial?: boolean;
  is_student?: boolean;
  days_remaining: number;
}

export interface PaymentHistoryResponse {
  transactions: Transaction[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Account payment request interface
export interface AccountPaymentRequest {
  amount: number;
  description: string;
  account_id: string;
  email: string;
}

export const paymentApi = {
  // Get user's payment methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get('/payment/methods');
    return response.data.data || [];
  },

  // Create a new payment method
  createPaymentMethod: async (data: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
    const response = await apiClient.post('/payment/methods', data);
    return response.data.data;
  },

  // Delete a payment method
  deletePaymentMethod: async (cardId: string): Promise<void> => {
    await apiClient.delete(`/payment/methods/${cardId}`);
  },

  // Process a payment
  processPayment: async (data: ProcessPaymentRequest): Promise<any> => {
    const response = await paymentClient.post('/payment/process', data);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (page: number = 1, perPage: number = 10): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get('/payment/history', {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  // Process subscription payment for creators
  processSubscription: async (data: SubscriptionPaymentRequest): Promise<any> => {
    const response = await paymentClient.post('/payment/subscription', data);
    return response.data;
  },

  // Get available subscription plans
  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/subscription/plans');
    return response.data.data || [];
  },

  // Get subscription history
  getSubscriptionHistory: async (): Promise<any> => {
    const response = await apiClient.get('/subscription/history');
    return response.data.data || [];
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<any> => {
    const response = await apiClient.post('/subscription/cancel');
    return response.data;
  },

  // Process payment using Pagar.me account_id
  processAccountPayment: async (data: AccountPaymentRequest): Promise<any> => {
    // Create a special axios instance for account_id authentication
    const accountPaymentClient = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br",
      headers: {
        'Content-Type': 'application/json',
        'X-PagarMe-Account-ID': data.account_id,
        'X-PagarMe-Email': data.email,
      },
    });

    const response = await accountPaymentClient.post('/api/payment/account-payment', {
      amount: data.amount,
      description: data.description,
      account_id: data.account_id,
      email: data.email,
    });

    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async (page: number = 1, perPage: number = 10): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get('/payment/transactions', {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  // Get subscription status
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get('/payment/subscription-status');
    return response.data;
  },
};

// Export creator payment API
export { creatorPaymentApi } from './creatorPayment';