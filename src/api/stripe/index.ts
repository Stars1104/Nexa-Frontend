import { apiClient,paymentClient } from '../../services/apiClient';

export interface StripeAccountStatus {
  has_account: boolean;
  account_id?: string;
  verification_status?: 'pending' | 'restricted' | 'enabled' | 'disabled';
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export interface StripeAccountLink {
  url: string;
  expires_at: number;
}

export interface CreateStripeAccountRequest {
  type: 'express' | 'standard';
  country: string;
  email: string;
}

export const stripeApi = {
  
  createOrLinkAccount: async (data: CreateStripeAccountRequest) => {
    const response = await paymentClient.post('/stripe/connect/create-or-link', data);
    return response.data;
  },

  
  createAccountLink: async (): Promise<StripeAccountLink> => {
    const response = await paymentClient.post('/stripe/connect/account-link');
    return response.data;
  },

  
  getAccountStatus: async (): Promise<StripeAccountStatus> => {
    const response = await paymentClient.get('/stripe/connect/status');
    return response.data;
  },

  
  checkConfiguration: async () => {
    const response = await paymentClient.get('/stripe/check');
    return response.data;
  },

  
  createSetupIntent: async (data: { username: string; email: string }) => {
    const response = await paymentClient.post('/stripe/setup-intent', data);
    return response.data;
  },
};
