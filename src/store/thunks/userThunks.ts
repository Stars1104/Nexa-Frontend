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
import { getCreatorProfile } from '../../api/user';

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchProfileStart());
      
      const response = await getProfile();
      
      if (!response.success) {
        throw new Error(response.message || 'Falha ao buscar dados do usuário');
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
        throw new Error(response.message || 'Falha ao buscar dados do usuário');
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
export const updateUserProfile = createAsyncThunk<
  any,
  any,
  { state: RootState; rejectValue: string }
>('user/updateProfile', async (profileData, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
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
      throw new Error(response.message || 'Falha ao atualizar perfil');
    }

    return response.profile;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    return rejectWithValue(apiError.message);
  }
}); 

// Fetch creator profile for brands
export const fetchCreatorProfile = createAsyncThunk<
  any,
  string,
  { state: RootState; rejectValue: string }
>('user/fetchCreatorProfile', async (creatorId, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await getCreatorProfile(creatorId, token);
    return response.data;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    return rejectWithValue(apiError.message);
  }
}); 