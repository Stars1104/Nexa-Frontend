import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  createCampaign, 
  fetchCampaigns, 
  fetchPendingCampaigns, 
  fetchUserCampaigns, 
  approveCampaign, 
  rejectCampaign,
  fetchAvailableCampaigns,
  fetchCampaignStats,
  fetchCampaignById,
  updateCampaign,
  deleteCampaign,
  applyToCampaign,
  fetchCampaignApplications,
  approveApplication,
  rejectApplication,
  fetchCreatorApplications,
  searchCampaigns,
  fetchCampaignCategories,
  fetchCampaignTypes,
  duplicateCampaign,
  extendCampaignDeadline,
  updateCampaignBudget,
  fetchCampaignAnalytics,
  exportCampaigns,
  fetchApprovedCampaigns,
  withdrawApplication,
  fetchAllApplications,
  fetchApplication,
  fetchApplicationStatistics
} from '../thunks/campaignThunks';

export interface Campaign {
  id: number;
  title: string;
  description: string;
  briefing: string;
  budget: number;
  deadline: string;
  states: string[];
  creatorRequirements: string[];
  brand: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  brandId: string;
  type: string;
  category?: string;
  value: number;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  submissionDate: string;
  approvedCreators: number;
  logo?: string;
  attachments?: string[];
}

export interface CampaignFormData {
  title: string;
  description: string;
  briefing: string;
  budget: string;
  deadline: Date;
  states: string[];
  creatorRequirements: string;
  type: string;
  logo?: File | null;
  attachments?: File[];
}

export interface Application {
  id: number;
  campaign_id: number;
  creator_id: number;
  status: 'pending' | 'approved' | 'rejected';
  proposal: string;
  portfolio_links?: string[];
  estimated_delivery_days?: number;
  proposed_budget?: number;
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  campaign?: {
    id: number;
    title: string;
    description: string;
    brand: {
      id: number;
      name: string;
    };
  };
  creator?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  reviewer?: {
    id: number;
    name: string;
  } | null;
  chat?: {
    id: number;
    campaign_id: number;
    brand_id: number;
    creator_id: number;
    status: string;
    created_at: string;
  } | null;
}

interface CampaignState {
  campaigns: Campaign[];
  pendingCampaigns: Campaign[];
  userCampaigns: Campaign[];
  availableCampaigns: Campaign[];
  approvedCampaigns: Campaign[];
  searchResults: Campaign[];
  applications: Application[];
  creatorApplications: Application[];
  categories: string[];
  types: string[];
  stats: any;
  analytics: any;
  isLoading: boolean;
  isCreating: boolean;
  isSearching: boolean;
  error: string | null;
  selectedCampaign: Campaign | null;
}

const initialState: CampaignState = {
  campaigns: [],
  pendingCampaigns: [],
  userCampaigns: [],
  availableCampaigns: [],
  approvedCampaigns: [],
  searchResults: [],
  applications: [],
  creatorApplications: [],
  categories: [],
  types: [],
  stats: null,
  analytics: null,
  isLoading: false,
  isCreating: false,
  isSearching: false,
  error: null,
  selectedCampaign: null,
};

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    // Utility actions
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.selectedCampaign = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    // Clear all campaign data
    clearAllCampaignData: (state) => {
      state.campaigns = [];
      state.pendingCampaigns = [];
      state.userCampaigns = [];
      state.availableCampaigns = [];
      state.approvedCampaigns = [];
      state.searchResults = [];
      state.applications = [];
      state.creatorApplications = [];
      state.categories = [];
      state.types = [];
      state.stats = null;
      state.analytics = null;
      state.selectedCampaign = null;
      state.error = null;
      state.isLoading = false;
      state.isCreating = false;
      state.isSearching = false;
    },
  },
  extraReducers: (builder) => {
    // Create campaign
    builder
      .addCase(createCampaign.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.isCreating = false;
        // Use immutable updates to prevent DOM manipulation issues
        state.userCampaigns = [...state.userCampaigns, action.payload];
        state.pendingCampaigns = [...state.pendingCampaigns, action.payload];
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload || 'Failed to create campaign';
      })
      
      // Fetch all campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch campaigns';
      })
      
      // Fetch pending campaigns
      .addCase(fetchPendingCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingCampaigns = action.payload;
      })
      .addCase(fetchPendingCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch pending campaigns';
      })
      
      // Fetch user campaigns
      .addCase(fetchUserCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userCampaigns = action.payload;
      })
      .addCase(fetchUserCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user campaigns';
      })
      
      // Fetch available campaigns
      .addCase(fetchAvailableCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableCampaigns = action.payload;
      })
      .addCase(fetchAvailableCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch available campaigns';
      })
      
      // Fetch approved campaigns
      .addCase(fetchApprovedCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApprovedCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvedCampaigns = action.payload;
      })
      .addCase(fetchApprovedCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch approved campaigns';
      })
      
      // Fetch campaign stats
      .addCase(fetchCampaignStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCampaignStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch campaign statistics';
      })
      
      // Fetch campaign by ID
      .addCase(fetchCampaignById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCampaign = action.payload;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch campaign';
      })
      
      // Update campaign
      .addCase(updateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCampaign = action.payload;
        
        // Ensure all arrays are properly initialized
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Update campaign in all arrays
        state.campaigns = state.campaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.pendingCampaigns = state.pendingCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.userCampaigns = state.userCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.availableCampaigns = state.availableCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.approvedCampaigns = state.approvedCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        
        if (state.selectedCampaign?.id === updatedCampaign.id) {
          state.selectedCampaign = updatedCampaign;
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update campaign';
      })
      
      // Delete campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const campaignId = action.payload.campaignId;
        
        // Ensure approvedCampaigns is an array
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Remove campaign from all arrays
        state.campaigns = state.campaigns.filter(campaign => campaign.id !== campaignId);
        state.pendingCampaigns = state.pendingCampaigns.filter(campaign => campaign.id !== campaignId);
        state.userCampaigns = state.userCampaigns.filter(campaign => campaign.id !== campaignId);
        state.availableCampaigns = state.availableCampaigns.filter(campaign => campaign.id !== campaignId);
        state.approvedCampaigns = state.approvedCampaigns.filter(campaign => campaign.id !== campaignId);
        
        if (state.selectedCampaign?.id === campaignId) {
          state.selectedCampaign = null;
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete campaign';
      })
      
      // Apply to campaign
      .addCase(applyToCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyToCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle successful application
      })
      .addCase(applyToCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to apply to campaign';
      })
      
      // Fetch campaign applications
      .addCase(fetchCampaignApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchCampaignApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch applications';
      })
      
      // Fetch creator applications
      .addCase(fetchCreatorApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCreatorApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creatorApplications = action.payload;
      })
      .addCase(fetchCreatorApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch applications';
      })
      
      // Approve application
      .addCase(approveApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        const { campaignId, applicationId } = action.payload;
        
        // Ensure arrays are properly initialized
        if (!Array.isArray(state.applications)) {
          state.applications = [];
        }
        if (!Array.isArray(state.creatorApplications)) {
          state.creatorApplications = [];
        }
        
        // Update application status
        state.applications = state.applications.map(app =>
          app.id === applicationId ? { ...app, status: 'approved' } : app
        );
        state.creatorApplications = state.creatorApplications.map(app =>
          app.id === applicationId ? { ...app, status: 'approved' } : app
        );
      })
      .addCase(approveApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to approve application';
      })
      
      // Reject application
      .addCase(rejectApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        const { campaignId, applicationId } = action.payload;
        
        // Ensure arrays are properly initialized
        if (!Array.isArray(state.applications)) {
          state.applications = [];
        }
        if (!Array.isArray(state.creatorApplications)) {
          state.creatorApplications = [];
        }
        
        // Update application status
        state.applications = state.applications.map(app =>
          app.id === applicationId ? { ...app, status: 'rejected' } : app
        );
        state.creatorApplications = state.creatorApplications.map(app =>
          app.id === applicationId ? { ...app, status: 'rejected' } : app
        );
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to reject application';
      })
      
      // Search campaigns
      .addCase(searchCampaigns.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchCampaigns.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchCampaigns.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload || 'Failed to search campaigns';
      })
      
      // Fetch categories
      .addCase(fetchCampaignCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCampaignCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch categories';
      })
      
      // Fetch types
      .addCase(fetchCampaignTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.types = action.payload;
      })
      .addCase(fetchCampaignTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch types';
      })
      
      // Duplicate campaign
      .addCase(duplicateCampaign.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(duplicateCampaign.fulfilled, (state, action) => {
        state.isCreating = false;
        // Use immutable updates to prevent DOM manipulation issues
        state.userCampaigns = [...state.userCampaigns, action.payload];
        state.pendingCampaigns = [...state.pendingCampaigns, action.payload];
      })
      .addCase(duplicateCampaign.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload || 'Failed to duplicate campaign';
      })
      
      // Extend deadline
      .addCase(extendCampaignDeadline.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(extendCampaignDeadline.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCampaign = action.payload;
        
        // Ensure approvedCampaigns is an array
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Update campaign in all arrays
        state.campaigns = state.campaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.pendingCampaigns = state.pendingCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.userCampaigns = state.userCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.availableCampaigns = state.availableCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        
        if (state.selectedCampaign?.id === updatedCampaign.id) {
          state.selectedCampaign = updatedCampaign;
        }
      })
      .addCase(extendCampaignDeadline.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to extend deadline';
      })
      
      // Update budget
      .addCase(updateCampaignBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCampaignBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCampaign = action.payload;
        
        // Ensure approvedCampaigns is an array
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Update campaign in all arrays
        state.campaigns = state.campaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.pendingCampaigns = state.pendingCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.userCampaigns = state.userCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        state.availableCampaigns = state.availableCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
        
        if (state.selectedCampaign?.id === updatedCampaign.id) {
          state.selectedCampaign = updatedCampaign;
        }
      })
      .addCase(updateCampaignBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update budget';
      })
      
      // Fetch analytics
      .addCase(fetchCampaignAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchCampaignAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch analytics';
      })
      
      // Export campaigns
      .addCase(exportCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportCampaigns.fulfilled, (state) => {
        state.isLoading = false;
        // Handle successful export (download file)
      })
      .addCase(exportCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to export campaigns';
      })
      
      // Approve campaign (admin only)
      .addCase(approveCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const approvedCampaign = action.payload;
        
        // Ensure approvedCampaigns is an array
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Update campaign status in all arrays
        state.campaigns = state.campaigns.map(campaign =>
          campaign.id === approvedCampaign.id ? { ...campaign, status: 'approved' } : campaign
        );
        state.pendingCampaigns = state.pendingCampaigns.filter(campaign => campaign.id !== approvedCampaign.id);
        state.userCampaigns = state.userCampaigns.map(campaign =>
          campaign.id === approvedCampaign.id ? { ...campaign, status: 'approved' } : campaign
        );
        state.approvedCampaigns = state.approvedCampaigns.map(campaign =>
          campaign.id === approvedCampaign.id ? { ...campaign, status: 'approved' } : campaign
        );
      })
      .addCase(approveCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to approve campaign';
      })
      
      // Reject campaign (admin only)
      .addCase(rejectCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const rejectedCampaign = action.payload;
        
        // Ensure approvedCampaigns is an array
        if (!Array.isArray(state.approvedCampaigns)) {
          state.approvedCampaigns = [];
        }
        
        // Update campaign status in all arrays
        state.campaigns = state.campaigns.map(campaign =>
          campaign.id === rejectedCampaign.id ? { ...campaign, status: 'rejected' } : campaign
        );
        state.pendingCampaigns = state.pendingCampaigns.filter(campaign => campaign.id !== rejectedCampaign.id);
        state.userCampaigns = state.userCampaigns.map(campaign =>
          campaign.id === rejectedCampaign.id ? { ...campaign, status: 'rejected' } : campaign
        );
        state.approvedCampaigns = state.approvedCampaigns.map(campaign =>
          campaign.id === rejectedCampaign.id ? { ...campaign, status: 'rejected' } : campaign
        );
      })
      .addCase(rejectCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to reject campaign';
      })
      
      // Withdraw application
      .addCase(withdrawApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        const applicationId = action.payload;
        
        // Remove application from arrays
        state.applications = state.applications.filter(app => app.id !== applicationId);
        state.creatorApplications = state.creatorApplications.filter(app => app.id !== applicationId);
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to withdraw application';
      })
      
      // Fetch all applications
      .addCase(fetchAllApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchAllApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch applications';
      })
      
      // Fetch specific application
      .addCase(fetchApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update or add the application to the arrays
        const application = action.payload;
        const existingIndex = state.applications.findIndex(app => app.id === application.id);
        if (existingIndex >= 0) {
          state.applications[existingIndex] = application;
        } else {
          state.applications.push(application);
        }
      })
      .addCase(fetchApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch application';
      })
      
      // Fetch application statistics
      .addCase(fetchApplicationStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplicationStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        // Store statistics in stats object
        state.stats = { ...state.stats, applications: action.payload };
      })
      .addCase(fetchApplicationStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch application statistics';
      });
  },
});

export const {
  clearError,
  setSelectedCampaign,
  clearSearchResults,
  clearAllCampaignData,
} = campaignSlice.actions;

export default campaignSlice.reducer; 