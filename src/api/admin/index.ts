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

export interface AdminStudent {
  id: number;
  name: string;
  email: string;
  academic_email: string | null;
  institution: string | null;
  course_name: string | null;
  student_verified: boolean;
  student_expires_at: string | null;
  free_trial_expires_at: string | null;
  has_premium: boolean;
  created_at: string;
  email_verified_at: string | null;
  status: 'active' | 'expired' | 'premium';
  trial_status: 'active' | 'expired' | 'premium';
  days_remaining: number;
}

export interface StudentsResponse {
  success: boolean;
  data: AdminStudent[];
  pagination: PaginationData;
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
  budget: number;
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

export interface BrandRanking {
  rank: number;
  id: number;
  name: string;
  company_name: string | null;
  display_name: string;
  total_campaigns?: number;
  total_contracts?: number;
  total_paid?: number;
  total_paid_formatted?: string;
  avatar_url: string | null;
  has_premium: boolean;
  created_at: string;
  score?: number;
}

export interface BrandRankingsResponse {
  success: boolean;
  data: {
    mostPosted: BrandRanking[];
    mostHired: BrandRanking[];
    mostPaid: BrandRanking[];
  };
}

export interface ComprehensiveRankingsResponse {
  success: boolean;
  data: BrandRanking[];
}

export interface CampaignActionResponse {
  success: boolean;
  message: string;
}

export const adminApi = {
  
  getDashboardMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get('/admin/dashboard-metrics');
    return response.data;
  },

  
  getPendingCampaigns: async (): Promise<PendingCampaignsResponse> => {
    const response = await apiClient.get('/admin/pending-campaigns');
    return response.data;
  },

  
  getRecentUsers: async (): Promise<RecentUsersResponse> => {
    const response = await apiClient.get('/admin/recent-users');
    return response.data;
  },

  
  approveCampaign: async (campaignId: number): Promise<CampaignActionResponse> => {
    const response = await apiClient.patch(`/campaigns/${campaignId}/approve`);
    return response.data;
  },

  
  rejectCampaign: async (campaignId: number): Promise<CampaignActionResponse> => {
    const response = await apiClient.patch(`/campaigns/${campaignId}/reject`);
    return response.data;
  },

  
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

  
  getCreators: async (params?: {
    status?: 'active' | 'blocked' | 'removed' | 'pending';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<UsersResponse> => {
    const response = await apiClient.get('/admin/users/creators', { params });
    return response.data;
  },

  
  getBrands: async (params?: {
    status?: 'active' | 'blocked' | 'removed' | 'pending';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<UsersResponse> => {
    const response = await apiClient.get('/admin/users/brands', { params });
    return response.data;
  },

  
  getUserStatistics: async (): Promise<StatisticsResponse> => {
    const response = await apiClient.get('/admin/users/statistics');
    return response.data;
  },

  
  updateUserStatus: async (
    userId: number,
    action: 'activate' | 'block' | 'remove'
  ): Promise<UpdateUserStatusResponse> => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, {
      action,
    });
    return response.data;
  },

  
  getBrandRankings: async (): Promise<BrandRankingsResponse> => {
    const response = await apiClient.get('/admin/brand-rankings');
    return response.data;
  },

  
  getComprehensiveRankings: async (): Promise<ComprehensiveRankingsResponse> => {
    const response = await apiClient.get('/admin/brand-rankings/comprehensive');
    return response.data;
  },

  
  getStudents: async (params?: {
    status?: 'active' | 'expired' | 'premium';
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<StudentsResponse> => {
    const response = await apiClient.get('/admin/students', { params });
    return response.data;
  },

  
  updateStudentTrial: async (
    studentId: number,
    period: '1month' | '6months' | '1year'
  ): Promise<{ success: boolean; message: string; student: AdminStudent }> => {
    const response = await apiClient.patch(`/admin/students/${studentId}/trial`, {
      period,
    });
    return response.data;
  },

  
  updateStudentStatus: async (
    studentId: number,
    action: 'activate' | 'block' | 'remove'
  ): Promise<{ success: boolean; message: string; student: AdminStudent }> => {
    const response = await apiClient.patch(`/admin/students/${studentId}/status`, {
      action,
    });
    return response.data;
  },

  
  getStudentVerificationRequests: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    per_page?: number;
    page?: number;
  }): Promise<{
    success: boolean;
    data: {
      data: StudentVerificationRequest[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> => {
    const response = await apiClient.get('/admin/student-requests', { params });
    return response.data;
  },

  
  approveStudentVerification: async (
    requestId: number,
    data?: {
      duration_months?: number;
      review_notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/admin/student-requests/${requestId}/approve`, data);
    return response.data;
  },

  
  rejectStudentVerification: async (
    requestId: number,
    data?: {
      review_notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/admin/student-requests/${requestId}/reject`, data);
    return response.data;
  },
};

export interface StudentVerificationRequest {
  id: number;
  user_id: number;
  purchase_email: string;
  course_name: string | null;
  evidence: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url: string | null;
    student_verified: boolean;
  };
}