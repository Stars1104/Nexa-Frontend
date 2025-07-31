import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginStart, loginSuccess, loginFailure, signupStart, signupSuccess, signupFailure, logout } from '../slices/authSlice';
import { signup, signin, logout as logoutAPI, updatePassword } from '../../api/auth';
import { handleApiError } from '../../lib/api-error-handler';
import { initiateGoogleOAuth, handleOAuthCallback } from '../../api/auth/googleAuth';

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
        throw new Error(response.message || 'Sign up failed');
      }

      const authData: AuthResponse = {
        user: response.user,
        token: response.token,
      };
      dispatch(signupSuccess(authData));
      return authData;
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      dispatch(signupFailure(apiError.message));
      return rejectWithValue(apiError.message);
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
        throw new Error(response.message || 'Login failed');
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

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }: any) => {
    try {
      // Call logout API to invalidate token on server
      await logoutAPI();
    } catch (error) {
      // Log the error but don't throw - we still want to clear local state
      console.error('Logout API error:', error);
      // If it's a 401, the token was already invalid, so clearing state is correct
      // If it's another error, we still want to log the user out locally
    } finally {
      // Always clear state regardless of API call success
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
        throw new Error(response.message || 'Password update failed');
      }

      return response.message || 'Password updated successfully';
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      return rejectWithValue(apiError.message);
    }
  }
);

// Async thunk for Google OAuth initiation
export const initiateGoogleOAuthFlow = createAsyncThunk(
  'auth/googleOAuthInit',
  async (role: 'creator' | 'brand' | undefined, { rejectWithValue }: any) => {
    try {
      await initiateGoogleOAuth(role);
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
        throw new Error(response.message || 'Google OAuth failed');
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

