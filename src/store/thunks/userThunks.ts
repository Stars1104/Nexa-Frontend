import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchProfileStart, 
  fetchProfileSuccess, 
  fetchProfileFailure, 
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure 
} from '../slices/userSlice';
import { getProfile, profileUpdate, getUser } from '../../api/auth';
import { handleApiError } from '../../lib/api-error-handler';
import { RootState } from '../index';
import { GetCreatorProfile } from '../../api/user';

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchProfileStart());
      
      const response = await getProfile();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch profile');
      }

      dispatch(fetchProfileSuccess(response.profile));
      return response.profile;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      dispatch(fetchProfileFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);

// Async thunk for fetching comprehensive user data for editing
export const fetchUserForEditing = createAsyncThunk(
  'user/fetchUserForEditing',
  async (userId: string | undefined = undefined, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchProfileStart());
      
      const response = await getUser(userId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user data');
      }

      // Use the same success action since we're storing user data
      dispatch(fetchProfileSuccess(response.user));
      return response.user;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      dispatch(fetchProfileFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: any, { dispatch, rejectWithValue }) => {
    try {
      dispatch(updateProfileStart());
      
      // Always create FormData to ensure consistent data handling
      const formData = new FormData();
      
      // Add all profile fields to FormData, explicitly excluding avatar if not a file
      Object.keys(profileData).forEach(key => {
          // Skip avatar field entirely if it's not a File
          if (key === 'avatar') {
            if (profileData.avatar instanceof File) {
              formData.append('avatar', profileData.avatar);
            } else {
            }
            return; // Skip to next iteration
          }
        
        // Handle other fields
        if (key === 'languages' && Array.isArray(profileData[key])) {
          formData.append('languages', JSON.stringify(profileData[key]));
        } else if (key === 'categories' && Array.isArray(profileData[key])) {
          formData.append('categories', JSON.stringify(profileData[key]));
        } else if (profileData[key] !== undefined && profileData[key] !== null && !(Array.isArray(profileData[key]) && profileData[key].length === 0)) {
          formData.append(key, profileData[key]);
        } else {
        }
      });
      
      const response = await profileUpdate(formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }

      dispatch(updateProfileSuccess(response.profile));
      return response.profile;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      
      // Log detailed error information
      console.error('Profile update error details:', {
        error,
        apiError,
        response: (error as any)?.response?.data
      });
      
      dispatch(updateProfileFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
); 

// Fetch creator profile for brands
export const fetchCreatorProfile = createAsyncThunk<
  any,
  string,
  { state: RootState; rejectValue: string }
>('user/fetchCreatorProfile', async (creatorId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    console.log('Fetching creator profile:', { creatorId, hasToken: !!token, isAuthenticated: state.auth.isAuthenticated });
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    const response = await GetCreatorProfile(creatorId, token);
    return response.data;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    console.error('Error in fetchCreatorProfile:', { 
      error, 
      apiError, 
      creatorId,
      hasToken: !!getState().auth.token,
      isAuthenticated: getState().auth.isAuthenticated 
    });
    return rejectWithValue(apiError.message);
  }
}); 