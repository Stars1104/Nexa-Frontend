import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { 
  CreateNewCampaign, 
  GetAllCampaigns, 
  GetPendingCampaigns, 
  GetUserCampaigns, 
  GetAvailableCampaigns, 
  GetCampaignStats, 
  ApproveCampaign, 
  RejectCampaign, 
  ArchiveCampaign, 
  ToggleFeaturedCampaign,
  ToggleFavoriteCampaign,
  GetFavoriteCampaigns,
  GetCampaignById, 
  UpdateCampaign, 
  DeleteCampaign, 
  ApplyToCampaign, 
  GetCampaignApplications, 
  ApproveApplication, 
  RejectApplication, 
  GetCreatorApplications, 
  SearchCampaigns, 
  GetCampaignCategories, 
  GetCampaignTypes,
  DuplicateCampaign,
  ExtendCampaignDeadline,
  UpdateCampaignBudget,
  GetCampaignAnalytics,
  ExportCampaigns,
  GetCampaignsByStatus,
  WithdrawApplication,
  GetAllApplications,
  GetApplication,
  GetApplicationStatistics
} from '../../api/campaign';
import { handleApiError } from '../../lib/api-error-handler';
import { Campaign, CampaignFormData } from '../slices/campaignSlice';

// API Response types
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

interface CampaignStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
}

interface CampaignAnalytics {
  views: number;
  applications: number;
  engagement: number;
  conversion: number;
}

interface Application {
  id: number;
  campaignId: number;
  creatorId: string;
  creatorName: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  proposedDeadline?: string;
  proposedBudget?: number;
  portfolio?: string;
  appliedAt: string;
}

// Create new campaign
export const createCampaign = createAsyncThunk<
  Campaign,
  CampaignFormData,
  { state: RootState; rejectValue: string }
>('campaign/create', async (campaignData, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const user = state.auth.user;
    const token = state.auth.token;
    
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', campaignData.title);
    formData.append('description', campaignData.description);
    const requirements = (campaignData.briefing || campaignData.creatorRequirements || '').trim();
    formData.append('requirements', requirements);
    // Ensure budget is a valid number
    const budgetValue = parseFloat(campaignData.budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      throw new Error('Budget must be a valid positive number');
    }
    formData.append('budget', budgetValue.toString());
    // Ensure deadline is a valid date
    if (!campaignData.deadline || isNaN(campaignData.deadline.getTime())) {
      throw new Error('Deadline must be a valid date');
    }
    formData.append('deadline', campaignData.deadline.toISOString().split('T')[0]); // Send only the date part
    
    // Handle target_states - send as array
    if (campaignData.states && campaignData.states.length > 0) {
      campaignData.states.forEach((state: string) => {
        formData.append('target_states[]', state);
      });
    }
    
    // Always send campaign_type and category, even if empty
    formData.append('campaign_type', campaignData.type?.trim() || '');
    formData.append('category', campaignData.type?.trim() || '');
    
    if (campaignData.logo) {
      formData.append('logo', campaignData.logo);
    }
    
    if (campaignData.attachments && campaignData.attachments.length > 0) {
      // Use the first attachment as attach_file
      formData.append('attach_file', campaignData.attachments[0]);
    }
    
    const response = await CreateNewCampaign(formData, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
    return rejectWithValue(errorMessage);
  }
});

// Fetch all campaigns
export const fetchCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetAllCampaigns(token);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Fetch pending campaigns (for admin)
export const fetchPendingCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchPending', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    if (!user || user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem acessar campanhas pendentes.');
    }

    const response = await GetPendingCampaigns(token);
    return (response.data);
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in fetchPendingCampaigns:', apiError);
    return rejectWithValue(apiError.message);
  }
});

// Fetch user campaigns (for brands)
export const fetchUserCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchUserCampaigns', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetUserCampaigns(user.id, token);
    return response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Fetch available campaigns (for creators)
export const fetchAvailableCampaigns = createAsyncThunk<
  Campaign[],
  {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    states?: string[];
    type?: string;
  },
  { state: RootState; rejectValue: string }
>('campaign/fetchAvailable', async (filters, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetAvailableCampaigns(token, filters);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign statistics
export const fetchCampaignStats = createAsyncThunk<
  CampaignStats,
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchStats', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignStats(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign statistics';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign by ID
export const fetchCampaignById = createAsyncThunk<
  Campaign,
  number,
  { state: RootState; rejectValue: string }
>('campaign/fetchById', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignById(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign';
    return rejectWithValue(errorMessage);
  }
});

// Update campaign
export const updateCampaign = createAsyncThunk<
  Campaign,
  { campaignId: number; data: CampaignFormData },
  { state: RootState; rejectValue: string }
>('campaign/update', async ({ campaignId, data }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('briefing', data.briefing);
    formData.append('budget', data.budget);
    formData.append('deadline', data.deadline.toISOString());
    
    // Handle states - send as comma-separated string
    const filteredStates = data.states.filter(Boolean);
    formData.append('states', filteredStates.join(','));
    formData.append('locations', filteredStates.join(',')); // Also send as locations in case backend expects it 
    
    formData.append('creatorRequirements', data.creatorRequirements);
    formData.append('type', data.type);
    formData.append('category', data.type); // Also send as category in case backend expects it
    
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    
    if (data.attachments && data.attachments.length > 0) {
      formData.append('attach_file', data.attachments[0]);
    }
    
    const response = await UpdateCampaign(campaignId, formData, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign';
    return rejectWithValue(errorMessage);
  }
});

// Delete campaign
export const deleteCampaign = createAsyncThunk<
  { campaignId: number },
  number,
  { state: RootState; rejectValue: string }
>('campaign/delete', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    await DeleteCampaign(campaignId, token);
    return { campaignId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
    return rejectWithValue(errorMessage);
  }
});

// Apply to campaign (for creators)
export const applyToCampaign = createAsyncThunk<
  Application,
  {
    campaignId: number;
    proposal: string;
    portfolio_links?: string[];
    estimated_delivery_days?: number;
    proposed_budget?: number;
  },
  { state: RootState; rejectValue: string }
>('campaign/apply', async (applicationData, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const { campaignId, ...applicationFormData } = applicationData;
    const response = await ApplyToCampaign(campaignId, applicationFormData, token);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to apply to campaign';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign applications (for brands)
export const fetchCampaignApplications = createAsyncThunk<
  Application[],
  number,
  { state: RootState; rejectValue: string }
>('campaign/fetchApplications', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignApplications(campaignId, token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
    return rejectWithValue(errorMessage);
  }
});

// Fetch creator applications (for creators)
export const fetchCreatorApplications = createAsyncThunk<
  Application[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchCreatorApplications', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCreatorApplications(token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
    return rejectWithValue(errorMessage);
  }
});

// Approve application (for brands)
export const approveApplication = createAsyncThunk<
  { campaignId: number; applicationId: number },
  { campaignId: number; applicationId: number },
  { state: RootState; rejectValue: string }
>('campaign/approveApplication', async ({ campaignId, applicationId }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    await ApproveApplication(applicationId, token);
    return { campaignId, applicationId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve application';
    return rejectWithValue(errorMessage);
  }
});

// Reject application (for brands)
export const rejectApplication = createAsyncThunk<
  { campaignId: number; applicationId: number },
  { campaignId: number; applicationId: number; reason?: string },
  { state: RootState; rejectValue: string }
>('campaign/rejectApplication', async ({ campaignId, applicationId, reason }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    await RejectApplication(applicationId, token, reason);
    return { campaignId, applicationId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject application';
    return rejectWithValue(errorMessage);
  }
});

// Withdraw application (for creators)
export const withdrawApplication = createAsyncThunk<
  number,
  number,
  { state: RootState; rejectValue: string }
>('campaign/withdrawApplication', async (applicationId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    await WithdrawApplication(applicationId, token);
    return applicationId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw application';
    return rejectWithValue(errorMessage);
  }
});

// Get all applications (role-based)
export const fetchAllApplications = createAsyncThunk<
  Application[],
  { status?: string; campaign_id?: number },
  { state: RootState; rejectValue: string }
>('campaign/fetchAllApplications', async (filters, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetAllApplications(token, filters);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
    return rejectWithValue(errorMessage);
  }
});

// Get specific application
export const fetchApplication = createAsyncThunk<
  Application,
  number,
  { state: RootState; rejectValue: string }
>('campaign/fetchApplication', async (applicationId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetApplication(applicationId, token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application';
    return rejectWithValue(errorMessage);
  }
});

// Get application statistics
export const fetchApplicationStatistics = createAsyncThunk<
  { total: number; pending: number; approved: number; rejected: number },
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchApplicationStatistics', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetApplicationStatistics(token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application statistics';
    return rejectWithValue(errorMessage);
  }
});

// Search campaigns
export const searchCampaigns = createAsyncThunk<
  Campaign[],
  {
    query: string;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    states?: string[];
    type?: string;
    status?: string;
  },
  { state: RootState; rejectValue: string }
>('campaign/search', async (searchParams, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await SearchCampaigns(searchParams.query, token, {
      category: searchParams.category,
      minBudget: searchParams.minBudget,
      maxBudget: searchParams.maxBudget,
      states: searchParams.states,
      type: searchParams.type,
      status: searchParams.status,
    });
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign categories
export const fetchCampaignCategories = createAsyncThunk<
  string[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchCategories', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignCategories(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign types
export const fetchCampaignTypes = createAsyncThunk<
  string[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchTypes', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignTypes(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch types';
    return rejectWithValue(errorMessage);
  }
});

// Duplicate campaign
export const duplicateCampaign = createAsyncThunk<
  Campaign,
  number,
  { state: RootState; rejectValue: string }
>('campaign/duplicate', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await DuplicateCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate campaign';
    return rejectWithValue(errorMessage);
  }
});

// Extend campaign deadline
export const extendCampaignDeadline = createAsyncThunk<
  Campaign,
  { campaignId: number; newDeadline: string },
  { state: RootState; rejectValue: string }
>('campaign/extendDeadline', async ({ campaignId, newDeadline }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await ExtendCampaignDeadline(campaignId, newDeadline, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to extend deadline';
    return rejectWithValue(errorMessage);
  }
});

// Update campaign budget
export const updateCampaignBudget = createAsyncThunk<
  Campaign,
  { campaignId: number; newBudget: number },
  { state: RootState; rejectValue: string }
>('campaign/updateBudget', async ({ campaignId, newBudget }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await UpdateCampaignBudget(campaignId, newBudget, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update budget';
    return rejectWithValue(errorMessage);
  }
});

// Fetch campaign analytics
export const fetchCampaignAnalytics = createAsyncThunk<
  CampaignAnalytics,
  number,
  { state: RootState; rejectValue: string }
>('campaign/fetchAnalytics', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignAnalytics(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return rejectWithValue(errorMessage);
  }
});

// Export campaigns
export const exportCampaigns = createAsyncThunk<
  Blob,
  {
    format: 'csv' | 'excel' | 'pdf';
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    brandId?: string;
  },
  { state: RootState; rejectValue: string }
>('campaign/export', async (exportParams, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await ExportCampaigns(token, exportParams.format, {
      status: exportParams.status,
      dateFrom: exportParams.dateFrom,
      dateTo: exportParams.dateTo,
      brandId: exportParams.brandId,
    });
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to export campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Approve campaign (admin only)
export const approveCampaign = createAsyncThunk<
  Campaign,
  number,
  { state: RootState; rejectValue: string }
>('campaign/approve', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem aprovar campanhas.');
    }
    
    const response = await ApproveCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in approveCampaign:', apiError);
    return rejectWithValue(apiError.message);
  }
});

// Reject campaign (admin only)
export const rejectCampaign = createAsyncThunk<
  Campaign,
  { campaignId: number; reason?: string },
  { state: RootState; rejectValue: string }
>('campaign/reject', async ({ campaignId, reason }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem rejeitar campanhas.');
    }
    
    const response = await RejectCampaign(campaignId, token, reason);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in rejectCampaign:', apiError);
    return rejectWithValue(apiError.message);
  }
});

// Fetch approved campaigns (for creators)
export const fetchApprovedCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchApproved', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCampaignsByStatus('approved', token);
    
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      return response;
    }
    
    console.error('Unexpected response structure:', response);
    return [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch approved campaigns';
    return rejectWithValue(errorMessage);
  }
});

// Toggle featured status (admin only)
export const toggleFeaturedCampaign = createAsyncThunk<
  Campaign,
  number,
  { state: RootState; rejectValue: string }
>('campaign/toggleFeatured', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem alterar o status de destaque.');
    }
    
    const response = await ToggleFeaturedCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in toggleFeaturedCampaign:', apiError);
    return rejectWithValue(apiError.message);
  }
});

// Toggle favorite status (for creators)
export const toggleFavoriteCampaign = createAsyncThunk<
  { campaign_id: number; is_favorited: boolean },
  number,
  { state: RootState; rejectValue: string }
>('campaign/toggleFavorite', async (campaignId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }
    
    const response = await ToggleFavoriteCampaign(campaignId, token);
    return response.data;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in toggleFavoriteCampaign:', apiError);
    return rejectWithValue(apiError.message);
  }
});

// Fetch favorite campaigns (for creators)
export const fetchFavoriteCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchFavoriteCampaigns', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetFavoriteCampaigns(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorite campaigns';
    return rejectWithValue(errorMessage);
  }
});