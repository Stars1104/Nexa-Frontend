import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

const CampaignAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Response interceptor to handle common HTTP errors
CampaignAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Authentication failed - token may be expired');
        } else if (error.response?.status === 403) {
            console.warn('Access forbidden - user may not have required permissions');
        } else if (error.response?.status === 404) {
            console.warn('Resource not found');
        } else if (error.response?.status >= 500) {
            console.error('Server error:', error.response?.status, error.response?.statusText);
        }
        return Promise.reject(error);
    }
);

// Add token to requests
const setAuthToken = (token: string) => {
    if (token) {
        CampaignAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete CampaignAPI.defaults.headers.common['Authorization'];
    }
};

// Create new campaign
export const CreateNewCampaign = async (data: FormData, token: string) => {
    setAuthToken(token);

    // Create a new axios instance for form data
    const FormDataAPI = axios.create({
        baseURL: `${BackendURL}`,
        headers: {
            // Don't set Content-Type for FormData - let browser set it with boundary
            "Authorization": `Bearer ${token}`
        },
    });

    try {
        const response = await FormDataAPI.post("/api/campaigns", data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get all campaigns
export const GetAllCampaigns = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/get-all-campaigns", {
        params: {
            _t: Date.now() // Cache busting
        }
    });
    return response.data;
};

// Get pending campaigns (for admin)
export const GetPendingCampaigns = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.get("/api/campaigns/pending");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get user campaigns (for brands)
export const GetUserCampaigns = async (userId: string, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/user/${userId}`);
    return response.data;
};

// Get campaigns by status
export const GetCampaignsByStatus = async (status: string, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/status/${status}`, {
        params: {
            _t: Date.now() // Cache busting
        }
    });
    return response.data;
};

// Get available campaigns for creators
export const GetAvailableCampaigns = async (token: string, filters?: {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    states?: string[];
    type?: string;
}) => {
    setAuthToken(token);
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.minBudget) params.append('minBudget', filters.minBudget.toString());
    if (filters?.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
    if (filters?.states) params.append('states', filters.states.join(','));
    if (filters?.type) params.append('type', filters.type);

    const response = await CampaignAPI.get(`/api/campaigns/available?${params.toString()}`);
    return response.data;
};

// Get campaign statistics
export const GetCampaignStats = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/stats");
    return response.data;
};

// Approve campaign (admin only)
export const ApproveCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        // Send an empty object as request body to satisfy backend validation
        const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/approve`, {});
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Reject campaign (admin only)
export const RejectCampaign = async (campaignId: number, token: string, reason?: string) => {
    setAuthToken(token);
    try {
        const data = reason ? { reason } : {};
        const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/reject`, data);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Archive campaign (admin only)
export const ArchiveCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/archive`);
    return response.data;
};

// Toggle featured status (admin only)
export const ToggleFeaturedCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/toggle-featured`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Toggle favorite status (creator only)
export const ToggleFavoriteCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.post(`/api/campaigns/${campaignId}/toggle-favorite`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get favorite campaigns (creator only)
export const GetFavoriteCampaigns = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.get("/api/campaigns/favorites");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// Get campaign by ID
export const GetCampaignById = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}`);
    return response.data;
};

// Update campaign
export const UpdateCampaign = async (campaignId: number, data: FormData, token: string) => {
    setAuthToken(token);

    // Create a new axios instance for form data
    const FormDataAPI = axios.create({
        baseURL: `${BackendURL}`,
        headers: {
            // Don't set Content-Type for FormData - let browser set it with boundary
            "Authorization": `Bearer ${token}`
        },
    });

    const response = await FormDataAPI.patch(`/api/campaigns/${campaignId}`, data);
    return response.data;
};

// Delete campaign
export const DeleteCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.delete(`/api/campaigns/${campaignId}`);
    return response.data;
};

// Apply to campaign (for creators) - Updated to match backend API
export const ApplyToCampaign = async (campaignId: number, applicationData: {
    proposal: string;
    portfolio_links?: string[];
    estimated_delivery_days?: number;
    proposed_budget?: number;
}, token: string) => {
    setAuthToken(token);

    const response = await CampaignAPI.post(`/api/campaigns/${campaignId}/applications`, applicationData);
    return response.data;
};

// Get all applications (role-based)
export const GetAllApplications = async (token: string, filters?: {
    status?: string;
    campaign_id?: number;
}) => {
    setAuthToken(token);
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id.toString());

    const response = await CampaignAPI.get(`/api/applications?${params.toString()}`);
    return response.data;
};

// Get specific application
export const GetApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications/${applicationId}`);
    return response.data;
};

// Get campaign applications (for brands)
export const GetCampaignApplications = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}/applications`);
    return response.data;
};

// Approve application (for brands)
export const ApproveApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.post(`/api/applications/${applicationId}/approve`);
    return response.data;
};

// Reject application (for brands)
export const RejectApplication = async (applicationId: number, token: string, rejectionReason?: string) => {
    setAuthToken(token);
    const data = rejectionReason ? { rejection_reason: rejectionReason } : {};
    const response = await CampaignAPI.post(`/api/applications/${applicationId}/reject`, data);
    return response.data;
};

// Withdraw application (for creators)
export const WithdrawApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.delete(`/api/applications/${applicationId}/withdraw`);
    return response.data;
};

// Get application statistics
export const GetApplicationStatistics = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications/statistics`);
    return response.data;
};

// Get creator applications (for creators) - Updated to use new endpoint
export const GetCreatorApplications = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications`);
    return response.data;
};

// Search campaigns
export const SearchCampaigns = async (query: string, token: string, filters?: {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    states?: string[];
    type?: string;
    status?: string;
}) => {
    setAuthToken(token);
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.category) params.append('category', filters.category);
    if (filters?.minBudget) params.append('minBudget', filters.minBudget.toString());
    if (filters?.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
    if (filters?.states) params.append('states', filters.states.join(','));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const response = await CampaignAPI.get(`/api/campaigns/search?${params.toString()}`);
    return response.data;
};

// Get campaign categories
export const GetCampaignCategories = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/categories");
    return response.data;
};

// Get campaign types
export const GetCampaignTypes = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/types");
    return response.data;
};

// Duplicate campaign
export const DuplicateCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.post(`/api/campaigns/${campaignId}/duplicate`);
    return response.data;
};

// Extend campaign deadline
export const ExtendCampaignDeadline = async (campaignId: number, newDeadline: string, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/extend-deadline`, {
        newDeadline
    });
    return response.data;
};

// Update campaign budget
export const UpdateCampaignBudget = async (campaignId: number, newBudget: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/update-budget`, {
        newBudget
    });
    return response.data;
};

// Get campaign analytics
export const GetCampaignAnalytics = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}/analytics`);
    return response.data;
};

// Export campaigns data
export const ExportCampaigns = async (token: string, format: 'csv' | 'excel' | 'pdf', filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    brandId?: string;
}) => {
    setAuthToken(token);
    const params = new URLSearchParams();
    params.append('format', format);

    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.brandId) params.append('brandId', filters.brandId);

    const response = await CampaignAPI.get(`/api/campaigns/export?${params.toString()}`, {
        responseType: 'blob'
    });
    return response.data;
};

export default CampaignAPI;