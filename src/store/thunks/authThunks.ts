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
    isPremium?: boolean; // Legacy field
    has_premium?: boolean;
    premium_expires_at?: string;
  };
  token: string;
}

// Async thunk for signup
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
    } catch (error: any) {
      // Propagar erros estruturados quando disponíveis (especialmente 422)
      const status = error?.response?.status;

      // Conta removida, porém restaurável
      if (error?.response?.data?.can_restore) {
        const restorationData = error.response.data;
        dispatch(signupFailure('account_removed_restorable'));
        return rejectWithValue({
          type: 'account_removed_restorable',
          message: restorationData.message,
          can_restore: restorationData.can_restore,
          removed_at: restorationData.removed_at,
          days_since_deletion: restorationData.days_since_deletion,
        });
      }

      // Validação por campo
      if (status === 422) {
        const data = error.response?.data;
        const message = data?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        dispatch(signupFailure(message));
        return rejectWithValue({
          type: 'validation_error',
          status,
          message,
          errors: data?.errors || null,
        });
      }

      // Rate limit com retry_after
      if (status === 429) {
        const data = error.response?.data;
        const retryAfter = data?.retry_after || 60;
        const message = error.config?.url?.includes('/register')
          ? `Muitas tentativas de registro. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`
          : `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
        dispatch(signupFailure(message));
        return rejectWithValue({
          type: 'rate_limited',
          status,
          message,
          retry_after: retryAfter,
        });
      }

      // Demais erros (401/403/500/etc.) com mensagem amigável
      const apiError = handleApiError(error);
      dispatch(signupFailure(apiError.message));
      return rejectWithValue({ message: apiError.message, status: apiError.status });
    }
  }
);

// Async thunk for login
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
      
      // Check if this is an account restoration case
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

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }: any) => {
    try {
      // Call logout API to invalidate token on server
      await logoutAPI();
    } catch (error) {
      // Log the error but don't throw - we still want to clear local state
      // If it's a 401, the token was already invalid, so clearing state is correct
      // If it's another error, we still want to log the user out locally
    } finally {
      // Always clear state regardless of API call success
      // Reset notification state
      dispatch(resetNotifications());
      // redux-persist will handle localStorage cleanup
      dispatch(logout());
    }
  }
);

// Async thunk for updating password
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

// Async thunk for Google OAuth initiation
export const initiateGoogleOAuthFlow = createAsyncThunk(
  'auth/googleOAuthInit',
  async (params: { role?: 'creator' | 'brand'; isStudent?: boolean } | 'creator' | 'brand' | undefined, { rejectWithValue }: any) => {
    try {
      // Handle both old and new parameter formats for backward compatibility
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

// Async thunk for Google OAuth callback
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