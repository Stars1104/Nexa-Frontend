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
      throw new Error('Usuário não autenticado');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', campaignData.title);
    formData.append('description', campaignData.description);
    const requirements = (campaignData.briefing || campaignData.creatorRequirements || '').trim();
    formData.append('requirements', requirements);
    // Ensure budget is a valid number
    if (campaignData.remunerationType === 'paga') {
      const budgetValue = parseFloat(campaignData.budget);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        throw new Error('Orçamento deve ser um número válido e positivo para campanhas pagas');
      }
      formData.append('budget', budgetValue.toString());
    } else {
      // For permuta campaigns, budget is optional
      if (campaignData.budget.trim()) {
        const budgetValue = parseFloat(campaignData.budget);
        if (!isNaN(budgetValue) && budgetValue >= 0) {
          formData.append('budget', budgetValue.toString());
        } else {
          formData.append('budget', '0');
        }
      } else {
        formData.append('budget', '0');
      }
    }
    
    // Add remuneration type
    formData.append('remuneration_type', campaignData.remunerationType);
    

    // Add status if provided
    if (campaignData.status) {
      formData.append('status', campaignData.status);
    }
    
    // Ensure deadline is a valid date
    if (!campaignData.deadline || isNaN(campaignData.deadline.getTime())) {
      throw new Error('Prazo deve ser uma data válida');
    }
    formData.append('deadline', campaignData.deadline.toISOString().split('T')[0]); // Send only the date part
    
    // Handle target_states - send as array
    if (campaignData.target_states && campaignData.target_states.length > 0) {
      campaignData.target_states.forEach((state: string) => {
        formData.append('target_states[]', state);
      });
    }
    
    // Always send campaign_type and category, even if empty
    formData.append('campaign_type', campaignData.type?.trim() || '');
    formData.append('category', campaignData.type?.trim() || '');
    
    // Add creator filter fields
    if (campaignData.minAge) {
      formData.append('min_age', campaignData.minAge.toString());
    }
    if (campaignData.maxAge) {
      formData.append('max_age', campaignData.maxAge.toString());
    }
    
    // Handle target_genders - send as array
    if (campaignData.targetGenders && campaignData.targetGenders.length > 0) {
      campaignData.targetGenders.forEach((gender: string) => {
        formData.append('target_genders[]', gender);
      });
    }
    
    // Handle target_creator_types - send as array (required)
    if (campaignData.targetCreatorTypes && campaignData.targetCreatorTypes.length > 0) {
      campaignData.targetCreatorTypes.forEach((creatorType: string) => {
        formData.append('target_creator_types[]', creatorType);
      });
    }
    
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
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetAllCampaigns(token);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas';
    return rejectWithValue(errorMessage);
  }
});

// Fetch pending campaigns (admin only)
export const fetchPendingCampaigns = createAsyncThunk<
  Campaign[],
  void,
  { state: RootState; rejectValue: string }
>('campaign/fetchPending', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('Usuário não autenticado');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem acessar campanhas pendentes.');
    }

    const response = await GetPendingCampaigns(token);
    return (response.data);
  } catch (error: unknown) {
    const apiError = handleApiError(error);
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetUserCampaigns(user.id, token);
    return response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas do usuário';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetAvailableCampaigns(token, filters);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas disponíveis';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignStats(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar estatísticas da campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignById(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('briefing', data.briefing);
    formData.append('budget', data.budget);
    formData.append('deadline', data.deadline.toISOString());
    
    // Handle target_states - send as comma-separated string
    const filteredStates = data.target_states.filter(Boolean);
    formData.append('target_states', filteredStates.join(','));
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
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    await DeleteCampaign(campaignId, token);
    return { campaignId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao deletar campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    const { campaignId, ...applicationFormData } = applicationData;
    const response = await ApplyToCampaign(campaignId, applicationFormData, token);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Falha ao se candidatar à campanha';
    
    if (error instanceof Error) {
      // Check if it's an axios error with response data
      if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const responseData = error.response.data as any;
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.errors) {
          // Handle validation errors
          const errors = Object.values(responseData.errors).flat();
          errorMessage = errors.join(', ');
        }
      } else {
        errorMessage = error.message;
      }
    }
    
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignApplications(campaignId, token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar candidaturas';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCreatorApplications(token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar candidaturas';
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
      throw new Error('Usuário não autenticado');
    }
    
    await ApproveApplication(applicationId, token);
    return { campaignId, applicationId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao aprovar candidatura';
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
      throw new Error('Usuário não autenticado');
    }
    
    await RejectApplication(applicationId, token, reason);
    return { campaignId, applicationId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao rejeitar candidatura';
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
      throw new Error('Usuário não autenticado');
    }
    
    await WithdrawApplication(applicationId, token);
    return applicationId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao retirar candidatura';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetAllApplications(token, filters);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar candidaturas';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetApplication(applicationId, token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar candidatura';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetApplicationStatistics(token);
    return response.data?.data || response.data || response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar estatísticas da candidatura';
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
      throw new Error('Usuário não autenticado');
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
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignCategories(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar categorias';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignTypes(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar tipos';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await DuplicateCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao duplicar campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await ExtendCampaignDeadline(campaignId, newDeadline, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao estender prazo';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await UpdateCampaignBudget(campaignId, newBudget, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar orçamento';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetCampaignAnalytics(campaignId, token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar estatísticas da campanha';
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await ExportCampaigns(token, exportParams.format, {
      status: exportParams.status,
      dateFrom: exportParams.dateFrom,
      dateTo: exportParams.dateTo,
      brandId: exportParams.brandId,
    });
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao exportar campanhas';
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
      throw new Error('Usuário não autenticado');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem aprovar campanhas.');
    }
    
    const response = await ApproveCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
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
      throw new Error('Usuário não autenticado');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem rejeitar campanhas.');
    }
    
    const response = await RejectCampaign(campaignId, token, reason);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
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
      throw new Error('Usuário não autenticado');
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
    
    return [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas aprovadas';
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
      throw new Error('Usuário não autenticado');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem alterar o status de destaque.');
    }
    
    const response = await ToggleFeaturedCampaign(campaignId, token);
    return response;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await ToggleFavoriteCampaign(campaignId, token);
    return response.data;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
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
      throw new Error('Usuário não autenticado');
    }
    
    const response = await GetFavoriteCampaigns(token);
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar campanhas favoritas';
    return rejectWithValue(errorMessage);
  }
});