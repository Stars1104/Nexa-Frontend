import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';

// Types
export interface BrandProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  avatar_url?: string | null;
  company_name: string | null;
  whatsapp_number: string | null;
  gender: 'male' | 'female' | 'other' | null;
  state: string | null;
  languages?: string[];
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  company_name?: string;
  whatsapp_number?: string;
  gender?: 'male' | 'female' | 'other';
  state?: string;
  avatar?: File | string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface BrandProfileState {
  profile: BrandProfile | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  updateError: string | null;
  isChangingPassword: boolean;
  passwordError: string | null;
}

const initialState: BrandProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  isUpdating: false,
  updateError: null,
  isChangingPassword: false,
  passwordError: null,
};

// Async thunks
export const fetchBrandProfile = createAsyncThunk(
  'brandProfile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/brand-profile');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateBrandProfile = createAsyncThunk(
  'brandProfile/updateProfile',
  async (data: UpdateProfileData, { rejectWithValue }) => {
    try {
      // Create FormData to handle file uploads properly
      const formData = new FormData();
      
      // Add all profile fields to FormData
      Object.keys(data).forEach(key => {
        if (key === 'avatar' && data.avatar instanceof File) {
          formData.append('avatar', data.avatar);
        } else if (key !== 'avatar' && data[key as keyof UpdateProfileData] !== undefined && data[key as keyof UpdateProfileData] !== null && data[key as keyof UpdateProfileData] !== '') {
          formData.append(key, String(data[key as keyof UpdateProfileData]));
        }
      });
      
      const response = await apiClient.put('/brand-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Brand Profile Update - Error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'brandProfile/changePassword',
  async (data: ChangePasswordData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/brand-profile/change-password', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

// Remove the separate uploadAvatar thunk - we'll handle avatar upload in updateBrandProfile

// Slice
const brandProfileSlice = createSlice({
  name: 'brandProfile',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.updateError = null;
      state.passwordError = null;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
      state.updateError = null;
      state.passwordError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchBrandProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBrandProfile.fulfilled, (state, action: PayloadAction<BrandProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchBrandProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateBrandProfile.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateBrandProfile.fulfilled, (state, action: PayloadAction<BrandProfile>) => {
        state.isUpdating = false;
        state.profile = action.payload;
        state.updateError = null;
      })
      .addCase(updateBrandProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload as string;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isChangingPassword = true;
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isChangingPassword = false;
        state.passwordError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isChangingPassword = false;
        state.passwordError = action.payload as string;
      });

    // Avatar upload is now handled in updateBrandProfile
  },
});

export const { clearErrors, clearProfile } = brandProfileSlice.actions;
export default brandProfileSlice.reducer; 