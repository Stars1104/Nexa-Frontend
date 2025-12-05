import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure, logout } from '../slices/authSlice';
import { signup, signin, logout as logoutAPI, updatePassword } from '../../api/auth';
import { handleApiError } from '../../lib/api-error-handler';
import { initiateGoogleOAuth, handleOAuthCallback } from '../../api/auth/googleAuth';
import { resetNotifications } from '../slices/notificationSlice';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  whatsapp?: string;
  isStudent?: boolean;
  role: 'creator' | 'brand';
}

interface UpdatePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  userId: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string; 
    role: 'creator' | 'brand' | 'student';
    whatsapp?: string;
    isStudent?: boolean;
    isPremium?: boolean; 
    has_premium?: boolean;
    premium_expires_at?: string;
  };
  token: string;
}


export const signupUser = createAsyncThunk( 
  'auth/signup',
  async (credentials: SignupCredentials, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(signupStart());
      
      const response = await signup(credentials);
      
      if (!response.success) {
        throw new Error(response.message || 'Falha no cadastro');
      }

      const authData: AuthResponse = {
        user: response.user,
        token: response.token,
      };
      dispatch(signupSuccess(authData));
      return authData;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      
      
      if (apiError.response?.data?.can_restore) {
        const restorationData = apiError.response.data;
        dispatch(signupFailure('account_removed_restorable'));
        return rejectWithValue({
          type: 'account_removed_restorable',
          message: restorationData.message,
          can_restore: restorationData.can_restore,
          removed_at: restorationData.removed_at,
          days_since_deletion: restorationData.days_since_deletion,
        });
      }
      
      dispatch(signupFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);


export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(loginStart());
      
      const response = await signin(credentials);
      
      if (!response.success) {
        throw new Error(response.message || 'Falha no login');
      }

      const authData: AuthResponse = {
        user: response.user,
        token: response.token,
      };

      dispatch(loginSuccess(authData));
      return authData;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      
      
      if (apiError.response?.data?.errors?.email === 'account_removed_restorable') {
        const restorationData = apiError.response.data.errors;
        dispatch(loginFailure('account_removed_restorable'));
        return rejectWithValue({
          type: 'account_removed_restorable',
          message: 'Sua conta foi removida. Você pode restaurá-la.',
          removed_at: restorationData.removed_at,
          days_since_deletion: restorationData.days_since_deletion,
        });
      }
      
      dispatch(loginFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);


export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }: any) => {
    try {
      
      await logoutAPI();
    } catch (error) {
      
      
      
    } finally {
      
      
      dispatch(resetNotifications());
      
      dispatch(logout());
    }
  }
);


export const updateUserPassword = createAsyncThunk(
  'auth/updatePassword',
  async (credentials: UpdatePasswordCredentials, { rejectWithValue }: any) => {
    try {
      const response = await updatePassword(credentials.userId, credentials.newPassword, credentials.currentPassword);
      
      if (!response.success) {
        throw new Error(response.message || 'Falha na atualização da senha');
      }

      return response.message || 'Senha atualizada com sucesso';
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      return rejectWithValue(apiError.message);
    }
  }
);


export const initiateGoogleOAuthFlow = createAsyncThunk(
  'auth/googleOAuthInit',
  async (params: { role?: 'creator' | 'brand'; isStudent?: boolean } | 'creator' | 'brand' | undefined, { rejectWithValue }: any) => {
    try {
      
      let role: 'creator' | 'brand' | undefined;
      let isStudent = false;
      
      if (typeof params === 'object' && params !== null) {
        role = params.role;
        isStudent = params.isStudent || false;
      } else {
        role = params;
        isStudent = false;
      }
      
      await initiateGoogleOAuth(role, isStudent);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      return rejectWithValue(apiError.message);
    }
  }
);


export const handleGoogleOAuthCallback = createAsyncThunk(
  'auth/googleOAuthCallback',
  async (_, { dispatch, rejectWithValue }: any) => {
    try {
      dispatch(loginStart());
      
      const response = await handleOAuthCallback();
      
      if (!response.success) {
        throw new Error(response.message || 'Falha na autenticação Google OAuth');
      }

      const authData: AuthResponse = {
        user: response.user,
        token: response.token,
      };

      dispatch(loginSuccess(authData));
      return authData;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      dispatch(loginFailure(apiError.message));
      return rejectWithValue(apiError.message);
    }
  }
);