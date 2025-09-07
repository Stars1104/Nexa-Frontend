import { apiClient } from "../../services/apiClient";

// Bank registration interface based on BankAccountForm component
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

// Creator payment specific APIs
export const creatorPaymentApi = {
  /**
   * Register bank account for freelancer/creator
   * POST /api/freelancer/register-bank
   */
  // registerBank: async (bankInfo: BankRegistrationRequest): Promise<BankRegistrationResponse> => {
  registerBank: async (): Promise<any> => {
    try {
      const response = await apiClient.post("/freelancer/register-bank");
      return response.data;
    } catch (error: any) {
      // Handle API errors
      if (error.response) {
        return {
          success: false,
          error:
            error.response.data.error ||
            error.response.data.message ||
            "Erro ao registrar informações bancárias",
          message: error.response.data.message,
        };
      }

      return {
        success: false,
        error:
          "Erro de Conexão. Não foi possível conectar ao servidor. Tente novamente.",
      };
    }
  },

  /**
   * Get creator's bank account information
   * GET /api/freelancer/bank-info
   */
  getBankInfo: async (): Promise<any> => {
    const response = await apiClient.get("/freelancer/bank-info");
    return response.data;
  },

  /**
   * Update creator's bank account information
   * PUT /api/freelancer/bank-info
   */
  updateBankInfo: async (bankInfo: BankRegistrationRequest): Promise<any> => {
    const response = await apiClient.put("/freelancer/bank-info", bankInfo);
    return response.data;
  },

  /**
   * Delete creator's bank account
   * DELETE /api/freelancer/bank-info
   */
  deleteBankInfo: async (): Promise<any> => {
    const response = await apiClient.delete("/freelancer/bank-info");
    return response.data;
  },

  /**
   * Get creator's withdrawal history
   * GET /api/freelancer/withdrawals
   */
  getWithdrawalHistory: async (
    page: number = 1,
    perPage: number = 10
  ): Promise<any> => {
    const response = await apiClient.get("/freelancer/withdrawals", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * Request withdrawal
   * POST /api/freelancer/withdrawals
   */
  requestWithdrawal: async (data: {
    amount: number;
    method: string;
    bank_account_id?: string;
  }): Promise<any> => {
    const response = await apiClient.post("/freelancer/withdrawals", data);
    return response.data;
  },

  /**
   * Get creator's earnings and balance
   * GET /api/freelancer/earnings
   */
  getEarnings: async (): Promise<any> => {
    const response = await apiClient.get("/freelancer/earnings");
    return response.data;
  },

  /**
   * Get available withdrawal methods
   * GET /api/freelancer/withdrawal-methods
   */
  getWithdrawalMethods: async (): Promise<any> => {
    const response = await apiClient.get("/freelancer/withdrawal-methods");
    return response.data;
  },
};
