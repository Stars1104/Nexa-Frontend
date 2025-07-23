import { apiClient } from '../../services/apiClient';

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

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description: string;
  code: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentHistoryItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
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
    const response = await apiClient.post('/payment/process', data);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (page: number = 1, perPage: number = 10): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get('/payment/history', {
      params: { page, per_page: perPage }
    });
    return response.data;
  },
}; 