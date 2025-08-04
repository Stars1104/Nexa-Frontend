import { apiClient } from '@/services/apiClient';

// Types
export interface Offer {
  id: number;
  title: string;
  description: string;
  budget: string;
  estimated_days: number;
  requirements: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expires_at: string;
  days_until_expiry: number;
  is_expiring_soon: boolean;
  can_be_accepted: boolean;
  can_be_rejected: boolean;
  can_be_cancelled: boolean;
  is_expired: boolean;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  other_user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface Contract {
  id: number;
  title: string;
  description: string;
  budget: string;
  creator_amount: string;
  platform_fee: string;
  estimated_days: number;
  requirements: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'terminated';
  workflow_status?: 'active' | 'waiting_review' | 'payment_pending' | 'payment_available' | 'payment_withdrawn' | 'terminated';
  started_at: string;
  expected_completion_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  days_until_completion: number;
  progress_percentage: number;
  is_overdue: boolean;
  is_near_completion: boolean;
  can_be_completed: boolean;
  can_be_cancelled: boolean;
  can_be_started?: boolean;
  offer_id?: number;
  is_waiting_for_review?: boolean;
  is_payment_available?: boolean;
  is_payment_withdrawn?: boolean;
  creator: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  brand?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  other_user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  payment?: {
    id: number;
    status: string;
    total_amount: string;
    creator_amount: string;
    platform_fee: string;
    processed_at?: string;
  };
  review?: {
    id: number;
    rating: number;
    comment?: string;
    created_at: string;
  };
  // Review status fields
  has_brand_review?: boolean;
  has_creator_review?: boolean;
  has_both_reviews?: boolean;
  can_review?: boolean;
  review_message?: string;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  average_rating: number;
  rating_stars: string;
  formatted_rating: string;
  rating_category: string;
  rating_color: string;
  comment?: string;
  rating_categories?: Record<string, number>;
  is_public: boolean;
  is_high_rating: boolean;
  is_low_rating: boolean;
  reviewer: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  contract: {
    id: number;
    title: string;
  };
  created_at: string;
}

export interface CreatorBalance {
  balance: {
    available_balance: number;
    pending_balance: number;
    total_balance: number;
    total_earned: number;
    total_withdrawn: number;
    formatted_available_balance: string;
    formatted_pending_balance: string;
    formatted_total_balance: string;
    formatted_total_earned: string;
    formatted_total_withdrawn: string;
  };
  earnings: {
    this_month: number;
    this_year: number;
    formatted_this_month: string;
    formatted_this_year: string;
  };
  withdrawals: {
    pending_count: number;
    pending_amount: number;
    formatted_pending_amount: string;
  };
  recent_transactions: Array<{
    id: number;
    contract_title: string;
    amount: string;
    status: string;
    processed_at?: string;
  }>;
  recent_withdrawals: Array<{
    id: number;
    amount: string;
    method: string;
    status: string;
    created_at: string;
  }>;
}

export interface Withdrawal {
  id: number;
  amount: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_color: string;
  status_badge_color: string;
  transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  processed_at?: string;
  days_since_created: number;
  is_recent: boolean;
  can_be_cancelled: boolean;
  withdrawal_details: Record<string, any>;
  bank_account_info?: {
    bank: string;
    agency: string;
    account: string;
    account_type: string;
    holder_name: string;
  };
  pix_info?: {
    pix_key: string;
    pix_key_type: string;
    holder_name: string;
  };
}

export interface WithdrawalMethod {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number;
  processing_time: string;
  fee: number;
  required_fields?: string[];
  field_config?: Record<string, any>;
}

export interface CreateOfferRequest {
  creator_id: number;
  chat_room_id: string;
  title: string;
  description: string;
  budget: number;
  estimated_days: number;
  requirements: string[];
}

export interface CreateReviewRequest {
  contract_id: number;
  rating: number;
  comment?: string;
  rating_categories?: Record<string, number>;
  is_public?: boolean;
}

export interface CreateWithdrawalRequest {
  amount: number;
  withdrawal_method: string;
  withdrawal_details: Record<string, any>;
}

// API Functions
export const hiringApi = {
  // Offers
  createOffer: async (data: CreateOfferRequest): Promise<any> => {
    const response = await apiClient.post('/offers', data);
    return response.data;
  },

  getOffers: async (type?: 'sent' | 'received', status?: string): Promise<{ data: { data: Offer[] } }> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/offers?${params.toString()}`);
    return response.data;
  },

  getOffersForChatRoom: async (roomId: string): Promise<{ data: Offer[] }> => {
    const response = await apiClient.get(`/offers/chat-room/${roomId}`);
    return response.data;
  },

  getOffer: async (id: number): Promise<{ data: Offer }> => {
    const response = await apiClient.get(`/offers/${id}`);
    return response.data;
  },

  acceptOffer: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/offers/${id}/accept`);
    return response.data;
  },

  rejectOffer: async (id: number, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/offers/${id}/reject`, { reason });
    return response.data;
  },

  cancelOffer: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/offers/${id}`);
    return response.data;
  },

  // Contracts
  getContracts: async (status?: string): Promise<{ data: { data: Contract[] } }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/contracts?${params.toString()}`);
    return response.data;
  },

  getContractsForChatRoom: async (roomId: string): Promise<{ data: Contract[] }> => {
    const response = await apiClient.get(`/contracts/chat-room/${roomId}`);
    return response.data;
  },

  getContract: async (id: number): Promise<{ data: Contract }> => {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  },

  completeContract: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/contracts/${id}/complete`);
    return response.data;
  },

  activateContract: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/contracts/${id}/activate`);
    return response.data;
  },

  cancelContract: async (id: number, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/contracts/${id}/cancel`, { reason });
    return response.data;
  },

  disputeContract: async (id: number, reason: string): Promise<any> => {
    const response = await apiClient.post(`/contracts/${id}/dispute`, { reason });
    return response.data;
  },

  terminateContract: async (id: number, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/contracts/${id}/terminate`, { reason });
    return response.data;
  },

  // Reviews
  createReview: async (data: CreateReviewRequest): Promise<any> => {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  getContractReviewStatus: async (contractId: number): Promise<any> => {
    const response = await apiClient.get(`/contracts/${contractId}/review-status`);
    return response.data;
  },

  getReviews: async (userId: number, rating?: number, publicOnly?: boolean): Promise<{ data: { reviews: { data: Review[] }, stats: any } }> => {
    const params = new URLSearchParams();
    params.append('user_id', userId.toString());
    if (rating) params.append('rating', rating.toString());
    if (publicOnly !== undefined) params.append('public_only', publicOnly.toString());
    
    const response = await apiClient.get(`/reviews?${params.toString()}`);
    return response.data;
  },

  getReview: async (id: number): Promise<{ data: Review }> => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },

  updateReview: async (id: number, data: Partial<CreateReviewRequest>): Promise<any> => {
    const response = await apiClient.put(`/reviews/${id}`, data);
    return response.data;
  },

  deleteReview: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response.data;
  },

  // Creator Balance
  getCreatorBalance: async (): Promise<{ data: CreatorBalance }> => {
    const response = await apiClient.get('/creator-balance');
    return response.data;
  },

  getBalanceHistory: async (days?: number, type?: 'earnings' | 'withdrawals' | 'all'): Promise<{ data: { history: any[], summary: any } }> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (type) params.append('type', type);
    
    const response = await apiClient.get(`/creator-balance/history?${params.toString()}`);
    return response.data;
  },

  getWithdrawalMethods: async (): Promise<{ data: WithdrawalMethod[] }> => {
    const response = await apiClient.get('/creator-balance/withdrawal-methods');
    return response.data;
  },

  getCreatorWorkHistory: async (): Promise<{ data: { data: Contract[] } }> => {
    const response = await apiClient.get('/creator-balance/work-history');
    return response.data;
  },

  // Withdrawals
  createWithdrawal: async (data: CreateWithdrawalRequest): Promise<any> => {
    const response = await apiClient.post('/withdrawals', data);
    return response.data;
  },

  getWithdrawals: async (status?: string): Promise<{ data: { data: Withdrawal[] } }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/withdrawals?${params.toString()}`);
    return response.data;
  },

  getWithdrawal: async (id: number): Promise<{ data: Withdrawal }> => {
    const response = await apiClient.get(`/withdrawals/${id}`);
    return response.data;
  },

  cancelWithdrawal: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/withdrawals/${id}`);
    return response.data;
  },

  getWithdrawalStatistics: async (): Promise<{ data: any }> => {
    const response = await apiClient.get('/withdrawals/statistics');
    return response.data;
  },

  // Post-contract workflow
  getContractsWaitingForReview: async (): Promise<{ data: Contract[] }> => {
    const response = await apiClient.get('/post-contract/waiting-review');
    return response.data;
  },

  getContractsWithPaymentAvailable: async (): Promise<{ data: Contract[] }> => {
    const response = await apiClient.get('/post-contract/payment-available');
    return response.data;
  },

  getWorkHistory: async (userId: number, type: 'creator' | 'brand'): Promise<any> => {
    const params = new URLSearchParams();
    params.append('user_id', userId.toString());
    params.append('type', type);
    
    const response = await apiClient.get(`/post-contract/work-history?${params.toString()}`);
    return response.data;
  },
}; 