import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || "https://nexacreators.com.br";

const CampaignAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
    },
});


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


const setAuthToken = (token: string) => {
    if (token) {
        CampaignAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete CampaignAPI.defaults.headers.common['Authorization'];
    }
};


export const CreateNewCampaign = async (data: FormData, token: string) => {
    setAuthToken(token);

    
    const FormDataAPI = axios.create({
        baseURL: `${BackendURL}`,
        headers: {
            
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


export const GetAllCampaigns = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/get-all-campaigns", {
        params: {
            _t: Date.now() 
        }
    });
    return response.data;
};


export const GetPendingCampaigns = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.get("/api/campaigns/pending");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const GetUserCampaigns = async (userId: string, token: string) => {
    setAuthToken(token);
    
    const numericUserId = parseInt(userId, 10);
    const response = await CampaignAPI.get(`/api/campaigns/user/${numericUserId}`);
    return response.data;
};


export const GetCampaignsByStatus = async (status: string, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/status/${status}`, {
        params: {
            _t: Date.now() 
        }
    });
    return response.data;
};


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


export const GetCampaignStats = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/stats");
    return response.data;
};


export const ApproveCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        
        const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/approve`, {});
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


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


export const ArchiveCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/archive`);
    return response.data;
};


export const ToggleFeaturedCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/toggle-featured`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const ToggleFavoriteCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.post(`/api/campaigns/${campaignId}/toggle-favorite`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const GetFavoriteCampaigns = async (token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.get("/api/campaigns/favorites");
        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const GetCampaignById = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}`);
    return response.data;
};


export const UpdateCampaign = async (campaignId: number, data: FormData, token: string, isAdmin: boolean = false) => {
    setAuthToken(token);

    
    const FormDataAPI = axios.create({
        baseURL: `${BackendURL}`,
        headers: {
            
            "Authorization": `Bearer ${token}`
        },
    });

    
    const endpoint = isAdmin 
        ? `/api/admin/campaigns/${campaignId}` 
        : `/api/campaigns/${campaignId}`;
    
    try {
        
        if (import.meta.env.DEV) {
            console.log('Sending FormData to:', endpoint);
            console.log('FormData size:', data.toString().length, 'bytes');
        }

        const response = await FormDataAPI.patch(endpoint, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                
            },
        });

        return response.data;
    } catch (error: any) {
        console.error('UpdateCampaign API error:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to update campaign');
        } else if (error.request) {
            console.error('Request made but no response:', error.request);
            throw new Error('No response from server');
        } else {
            console.error('Error setting up request:', error.message);
            throw error;
        }
    }
};


export const DeleteCampaign = async (campaignId: number, token: string, isAdmin: boolean = false) => {
    setAuthToken(token);
    
    
    const endpoint = isAdmin 
        ? `/api/admin/campaigns/${campaignId}` 
        : `/api/campaigns/${campaignId}`;
    
    const response = await CampaignAPI.delete(endpoint);
    return response.data;
};


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


export const GetApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications/${applicationId}`);
    return response.data;
};


export const GetCampaignApplications = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}/applications`);
    return response.data;
};


export const ApproveApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    try {
        const response = await CampaignAPI.post(`/api/applications/${applicationId}/approve`);
        return response.data;
    } catch (error: any) {
        
        if (error.response?.status === 402) {
            const errorData = error.response?.data || {};
            
            
            if (errorData.requires_funding || errorData.requires_stripe_account) {
            
            throw {
                ...error,
                requiresFunding: true,
                    requiresStripeAccount: errorData.requires_stripe_account || false,
                    redirectUrl: errorData.redirect_url,
                    checkoutSessionId: errorData.checkout_session_id,
                    contractId: errorData.contract_id,
                    message: errorData.message || 'Payment method required',
            };
            }
        }
        throw error;
    }
};


export const RejectApplication = async (applicationId: number, token: string, rejectionReason?: string) => {
    setAuthToken(token);
    const data = rejectionReason ? { rejection_reason: rejectionReason } : {};
    const response = await CampaignAPI.post(`/api/applications/${applicationId}/reject`, data);
    return response.data;
};


export const WithdrawApplication = async (applicationId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.delete(`/api/applications/${applicationId}/withdraw`);
    return response.data;
};


export const GetApplicationStatistics = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications/statistics`);
    return response.data;
};


export const GetCreatorApplications = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/applications`);
    return response.data;
};


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


export const GetCampaignCategories = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/categories");
    return response.data;
};


export const GetCampaignTypes = async (token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get("/api/campaigns/types");
    return response.data;
};


export const DuplicateCampaign = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.post(`/api/campaigns/${campaignId}/duplicate`);
    return response.data;
};


export const ExtendCampaignDeadline = async (campaignId: number, newDeadline: string, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/extend-deadline`, {
        newDeadline
    });
    return response.data;
};


export const UpdateCampaignBudget = async (campaignId: number, newBudget: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.patch(`/api/campaigns/${campaignId}/update-budget`, {
        newBudget
    });
    return response.data;
};


export const GetCampaignAnalytics = async (campaignId: number, token: string) => {
    setAuthToken(token);
    const response = await CampaignAPI.get(`/api/campaigns/${campaignId}/analytics`);
    return response.data;
};


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