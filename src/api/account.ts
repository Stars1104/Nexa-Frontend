import { apiClient } from '../services/apiClient';

export interface RemoveAccountRequest {
  password: string;
  reason?: string;
}

export interface RestoreAccountRequest {
  email: string;
  password: string;
}

export interface CheckRemovedAccountRequest {
  email: string;
}

export interface CheckAccountRequest {
  email: string;
}

export interface RemoveAccountResponse {
  success: boolean;
  message: string;
}

export interface RestoreAccountResponse {
  success: boolean;
  message: string;
  token?: string;
  token_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url: string | null;
    student_verified: boolean;
    has_premium: boolean;
  };
}

export interface CheckRemovedAccountResponse {
  success: boolean;
  can_restore: boolean;
  days_since_deletion: number;
  deleted_at: string;
  message?: string;
}
export interface CheckAccountResponse {
  success: boolean;
  message?: string;
}
export const accountApi = {
  /**
   * Remove user account
   */
  removeAccount: async (data: RemoveAccountRequest): Promise<RemoveAccountResponse> => {
    const response = await apiClient.post('/account/remove', data);
    return response.data;
  },

  /**
   * Restore user account
   */
  restoreAccount: async (data: RestoreAccountRequest): Promise<RestoreAccountResponse> => {
    const response = await apiClient.post('/account/restore', data);
    return response.data;
  },

  /**
   * Check if email exists in removed accounts
   */
  checkRemovedAccount: async (data: CheckRemovedAccountRequest): Promise<CheckRemovedAccountResponse> => {
    const response = await apiClient.post('/account/check-removed', data);
    return response.data;
  },
  /**
   * Check if email exists in accounts
   */
  checkAccount: async (data: CheckAccountRequest): Promise<CheckAccountResponse> => {
    const response = await apiClient.post('/account/checked', data);
    return response.data;
  }
};
