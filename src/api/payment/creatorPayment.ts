import { apiClient } from '../../services/apiClient';


export interface BankRegistrationRequest {
  bank_code: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  cpf: string;
  name: string;
}

export interface BankRegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    bank_account_id?: string;
    status?: string;
  };
}


export const creatorPaymentApi = {
  
  registerBank: async (bankInfo: BankRegistrationRequest): Promise<BankRegistrationResponse> => {
    try {
      const response = await apiClient.post('/freelancer/register-bank', bankInfo);
      return response.data;
    } catch (error: any) {
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Erro ao registrar informações bancárias',
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        error: 'Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.'
      };
    }
  },

  
  getBankInfo: async (): Promise<any> => {
    const response = await apiClient.get('/freelancer/bank-info');
    return response.data;
  },

  
  updateBankInfo: async (bankInfo: BankRegistrationRequest): Promise<any> => {
    const response = await apiClient.put('/freelancer/bank-info', bankInfo);
    return response.data;
  },

  
  deleteBankInfo: async (): Promise<any> => {
    const response = await apiClient.delete('/freelancer/bank-info');
    return response.data;
  },

  
  getWithdrawalHistory: async (page: number = 1, perPage: number = 10): Promise<any> => {
    const response = await apiClient.get('/freelancer/withdrawals', {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  
  requestWithdrawal: async (data: {
    amount: number;
    method: string;
    bank_account_id?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/freelancer/withdrawals', data);
    return response.data;
  },

  
  getEarnings: async (): Promise<any> => {
    const response = await apiClient.get('/freelancer/earnings');
    return response.data;
  },

  
  getWithdrawalMethods: async (): Promise<any> => {
    const response = await apiClient.get('/freelancer/withdrawal-methods');
    return response.data;
  }
}; 