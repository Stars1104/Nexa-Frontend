import { apiClient } from '../../services/apiClient';

export interface BrandPaymentMethod {
  id: string;
  card_info: string;
  card_brand: string;
  card_last4: string;
  card_holder_name: string;
  is_default: boolean;
  created_at: string;
}

export interface SavePaymentMethodRequest {
  card_hash: string;
  card_holder_name: string;
  cnpj: string;
  is_default?: boolean;
}

export interface SavePaymentMethodResponse {
  success: boolean;
  message: string;
  data?: {
    payment_method_id: string;
    card_holder_name: string;
    card_brand: string;
    card_last4: string;
    is_default: boolean;
    created_at: string;
  };
  error?: string;
}

export interface ContractPaymentRequest {
  contract_id: string;
  payment_method_id?: string;
}

export interface ContractPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    contract_id: string;
    amount: number;
    payment_status: string;
    transaction_id: string;
    order_id: string;
  };
  error?: string;
}

export interface ContractPaymentStatus {
  contract_id: string;
  contract_status: string;
  workflow_status: string;
  budget: number;
  payment?: {
    status: string;
    total_amount: number;
    platform_fee: number;
    creator_amount: number;
    payment_method: string;
    created_at: string;
    transaction?: {
      id: string;
      status: string;
      paid_at: string;
    };
  };
}

export interface RetryPaymentRequest {
  contract_id: string;
}

export interface RetryPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    contract_id: string;
    status: string;
    workflow_status: string;
  };
  error?: string;
}

// Brand payment API functions
export const brandPaymentApi = {
  savePaymentMethod: async (paymentData: SavePaymentMethodRequest): Promise<SavePaymentMethodResponse> => {
    try {
      const response = await apiClient.post('/brand-payment/save-method', paymentData);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao salvar método de pagamento',
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.',
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Get brand's payment methods
   * GET /api/brand-payment/methods
   */
  getPaymentMethods: async (): Promise<{ success: boolean; data?: BrandPaymentMethod[]; error?: string }> => {
    try {
      const response = await apiClient.get('/brand-payment/methods');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao buscar métodos de pagamento'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Set payment method as default
   * POST /api/brand-payment/set-default
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/brand-payment/set-default', {
        payment_method_id: paymentMethodId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao definir método padrão'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Delete payment method
   * DELETE /api/brand-payment/methods
   */
  deletePaymentMethod: async (paymentMethodId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiClient.delete('/brand-payment/methods', {
        data: { payment_method_id: paymentMethodId }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        // Extract error message from all possible locations in the error response
        const errorMessage = errorData.message || errorData.error || 'Erro ao deletar método de pagamento';
        return {
          success: false,
          message: errorMessage,
          error: errorMessage
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.',
        message: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Process contract payment
   * POST /api/contract-payment/process
   */
  processContractPayment: async (paymentData: ContractPaymentRequest): Promise<ContractPaymentResponse> => {
    try {
      const response = await apiClient.post('/contract-payment/process', paymentData);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao processar pagamento do contrato',
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.',
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Get contract payment status
   * GET /api/contract-payment/status?contract_id={id}
   */
  getContractPaymentStatus: async (contractId: string): Promise<{ success: boolean; data?: ContractPaymentStatus; error?: string }> => {
    try {
      const response = await apiClient.get('/contract-payment/status', {
        params: { contract_id: contractId }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao buscar status do pagamento'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Retry contract payment
   * POST /api/contract-payment/retry
   */
  retryContractPayment: async (paymentData: RetryPaymentRequest): Promise<RetryPaymentResponse> => {
    try {
      const response = await apiClient.post('/contract-payment/retry', paymentData);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao tentar reprocessar pagamento do contrato',
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.',
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Get available payment methods for contract
   * GET /api/contract-payment/methods
   */
  getAvailablePaymentMethods: async (): Promise<{ success: boolean; data?: BrandPaymentMethod[]; error?: string }> => {
    try {
      const response = await apiClient.get('/contract-payment/methods');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao buscar métodos de pagamento disponíveis'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Create Stripe Checkout Session for adding payment method
   * POST /api/brand-payment/create-checkout-session
   */
  createCheckoutSession: async (): Promise<{ success: boolean; url?: string; session_id?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/brand-payment/create-checkout-session');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao criar sessão de checkout'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Handle successful Stripe Checkout Session
   * POST /api/brand-payment/handle-checkout-success
   */
  handleCheckoutSuccess: async (sessionId: string): Promise<SavePaymentMethodResponse> => {
    try {
      const response = await apiClient.post('/brand-payment/handle-checkout-success', {
        session_id: sessionId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao processar pagamento',
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.',
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  /**
   * Create Stripe Checkout Session for contract funding (escrow deposit)
   * POST /api/contract-payment/checkout-session
   */
  createContractCheckoutSession: async (contractId: number): Promise<{ success: boolean; url?: string; session_id?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/contract-payment/checkout-session', {
        contract_id: contractId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao criar sessão de checkout para contrato'
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  }
}; 