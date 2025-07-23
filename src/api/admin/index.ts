import { apiClient } from '../../services/apiClient';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: string;
  statusColor: string;
  time: string;
  campaigns: string;
  accountStatus: string;
  created_at: string;
  email_verified_at: string | null;
  has_premium: boolean;
  student_verified: boolean;
  premium_expires_at: string | null;
  free_trial_expires_at: string | null;
}

export interface AdminBrand {
  id: number;
  company: string;
  brandName: string;
  email: string;
  status: string;
  statusColor: string;
  campaigns: number;
  accountStatus: string;
  created_at: string;
  email_verified_at: string | null;
  has_premium: boolean;
  premium_expires_at: string | null;
  free_trial_expires_at: string | null;
}

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface UsersResponse {
  success: boolean;
  data: AdminUser[] | AdminBrand[];
  pagination: PaginationData;
}

export interface UserStatistics {
  total_users: number;
  creators: number;
  brands: number;
  premium_users: number;
  verified_students: number;
  active_users: number;
  pending_users: number;
}

export interface StatisticsResponse {
  success: boolean;
  data: UserStatistics;
}

export interface UpdateUserStatusRequest {
  action: 'activate' | 'block' | 'remove';
}

export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
  user: AdminUser | AdminBrand;
}

export interface DashboardMetrics {
  pendingCampaignsCount: number;
  allActiveCampaignCount: number;
  allRejectCampaignCount: number;
  allUserCount: number;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: DashboardMetrics;
}

export interface PendingCampaign {
  id: number;
  title: string;
  brand: string;
  type: string;
  value: number;
}

export interface PendingCampaignsResponse {
  success: boolean;
  data: PendingCampaign[];
}

export interface RecentUser {
  id: number;
  name: string;
  role: string;
  registeredDaysAgo: number;
  tag: string;
}

export interface RecentUsersResponse {
  success: boolean;
  data: RecentUser[];
}

export interface CampaignActionResponse {
  success: boolean;
  message: string;
}

export const adminApi = {
  /**
   * Get dashboard metrics
   */
  getDashboardMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get('/admin/dashboard-metrics');
    return response.data;
  },

  /**
   * Get pending campaigns for dashboard
   */
  getPendingCampaigns: async (): Promise<PendingCampaignsResponse> => {
    const response = await apiClient.get('/admin/pending-campaigns');
    return response.data;
  },

  /**
   * Get recent users for dashboard
   */
  getRecentUsers: async (): Promise<RecentUsersResponse> => {
    const response = await apiClient.get('/admin/recent-users');
    return response.data;
  },

  /**
   * Approve a campaign
   */
  approveCampaign: async (campaignId: number): Promise<CampaignActionResponse> => {
    const response = await apiClient.patch(`/campaigns/${campaignId}/approve`);
    return response.data;
  },

  /**
   * Reject a campaign
   */
  rejectCampaign: async (campaignId: number): Promise<CampaignActionResponse> => {
    const response = await apiClient.patch(`/campaigns/${campaignId}/reject`);
    return response.data;
  },

  /**
   * Get all users with filtering and pagination
   */
  getUsers: async (params?: {
    role?: 'creator' | 'brand';
    status?: 'active' | 'blocked' | 'removed' | 'pending';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<UsersResponse> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get creators with enhanced data
   */
  getCreators: async (params?: {
    status?: 'active' | 'blocked' | 'removed' | 'pending';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<UsersResponse> => {
    const response = await apiClient.get('/admin/users/creators', { params });
    return response.data;
  },

  /**
   * Get brands with enhanced data
   */
  getBrands: async (params?: {
    status?: 'active' | 'blocked' | 'removed' | 'pending';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<UsersResponse> => {
    const response = await apiClient.get('/admin/users/brands', { params });
    return response.data;
  },

  /**
   * Get user statistics
   */
  getUserStatistics: async (): Promise<StatisticsResponse> => {
    const response = await apiClient.get('/admin/users/statistics');
    return response.data;
  },

  /**
   * Update user status (activate, block, remove)
   */
  updateUserStatus: async (
    userId: number,
    action: 'activate' | 'block' | 'remove'
  ): Promise<UpdateUserStatusResponse> => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, {
      action,
    });
    return response.data;
  },
}; 