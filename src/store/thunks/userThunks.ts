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
import { updateUser } from '../slices/authSlice';
import { handleApiError } from '../../lib/api-error-handler';
import { RootState } from '../index';
import { getCreatorProfile } from '../../api/user';



let inFlightProfileFetch: Promise<any> | null = null;
let lastProfileFetchAt = 0;
const PROFILE_TTL_MS = 30000; 

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      
      if (inFlightProfileFetch) {
        const result = await inFlightProfileFetch;
        return result.profile;
      }

      
      const now = Date.now();
      if (now - lastProfileFetchAt < PROFILE_TTL_MS) {
        return (undefined as any);
      }

      dispatch(fetchProfileStart());

      const p = getProfile();
      inFlightProfileFetch = p;
      const response = await p;
      inFlightProfileFetch = null;
      lastProfileFetchAt = Date.now();
      
      if (!response.success) {
        throw new Error(response.message || 'Falha ao buscar dados do usuário');
      }

      dispatch(fetchProfileSuccess(response.profile));
      
      dispatch(updateUser({
        name: response.profile?.name,
        email: response.profile?.email,
        avatar: response.profile?.avatar || response.profile?.avatar_url,
        avatar_url: response.profile?.avatar || response.profile?.avatar_url,
      }));
      return response.profile;
    } catch (error: unknown) {
      inFlightProfileFetch = null;
      const apiError = handleApiError(error);
      dispatch(fetchProfileFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);


export const fetchUserForEditing = createAsyncThunk(
  'user/fetchUserForEditing',
  async (userId: string | undefined = undefined, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchProfileStart());
      
      const response = await getUser(userId);
      
      if (!response.success) {
        throw new Error(response.message || 'Falha ao buscar dados do usuário');
      }

      
      dispatch(fetchProfileSuccess(response.user));
      return response.user;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      dispatch(fetchProfileFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);


export const updateUserProfile = createAsyncThunk<
  any,
  any,
  { state: RootState; rejectValue: string }
>('user/updateProfile', async (profileData, { getState, rejectWithValue, dispatch }) => {
  try {
    const state = getState();
    const token = state.auth.token;
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    
    const hasFile = profileData?.avatar instanceof File;

    let response;
    if (hasFile) {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (key === 'avatar') {
          if (profileData.avatar instanceof File) {
            formData.append('avatar', profileData.avatar);
          }
          return;
        }

        if (key === 'languages' && Array.isArray(profileData[key])) {
          formData.append('languages', JSON.stringify(profileData[key]));
        } else if (key === 'categories' && Array.isArray(profileData[key])) {
          formData.append('categories', JSON.stringify(profileData[key]));
        } else if (profileData[key] !== undefined && profileData[key] !== null && !(Array.isArray(profileData[key]) && profileData[key].length === 0)) {
          formData.append(key, profileData[key]);
        }
      });
      response = await profileUpdate(formData as any);
    } else {
      
      const jsonPayload: any = {};
      Object.keys(profileData).forEach(key => {
        if (key === 'avatar') return; 
        if (key === 'languages' && Array.isArray(profileData[key])) {
          
          jsonPayload.languages = JSON.stringify(profileData[key]);
        } else if (key === 'categories' && Array.isArray(profileData[key])) {
          
          jsonPayload.categories = JSON.stringify(profileData[key]);
        } else if (profileData[key] !== undefined && profileData[key] !== null && !(Array.isArray(profileData[key]) && profileData[key].length === 0)) {
          jsonPayload[key] = profileData[key];
        }
      });

      
      if (jsonPayload.birth_date && typeof jsonPayload.birth_date === 'string') {
        try {
          
          if (jsonPayload.birth_date.includes('T')) {
            jsonPayload.birth_date = jsonPayload.birth_date.slice(0, 10);
          }
        } catch {}
      }
      response = await profileUpdate(jsonPayload);
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Falha ao atualizar perfil');
    }

    
    try {
      const updated = response.profile;
      dispatch(updateUser({
        name: updated?.name,
        email: updated?.email,
        avatar: updated?.avatar || updated?.avatar_url,
        avatar_url: updated?.avatar || updated?.avatar_url,
      }));
    } catch {}
    return response.profile;
  } catch (error: unknown) {
    const apiError = handleApiError(error);
    return rejectWithValue(apiError.message);
  }
}); 


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