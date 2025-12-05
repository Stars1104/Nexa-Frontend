import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getProfile } from '../../api/auth';
import { createAuthenticatedClient } from '../../services/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'brand' | 'student' | 'admin';
  whatsapp?: string;
  isStudent?: boolean;
  student_verified?: boolean;
  isPremium?: boolean; 
  has_premium?: boolean;
  premium_expires_at?: string;
  stripe_account_id?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  email_verified_at?: string;
  creator_type?: string;
  birth_date?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_channel?: string;
  facebook_page?: string;
  twitter_handle?: string;
  industry?: string;
  gender?: string;
  state?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSigningUp: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isSigningUp: false,
};


export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { getState, dispatch }) => {
    const state = getState() as { auth: AuthState };
    const { token } = state.auth;
    
    
    if (!token) {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          
          const authenticatedClient = createAuthenticatedClient(storedToken);
          const response = await authenticatedClient.get('/user');
          
          if (response.data.success) {
            return {
              user: response.data.profile,
              token: storedToken
            };
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Token inválido');
        }
      }
      throw new Error('Nenhuma autenticação válida encontrada');
    }
    
    
    try {
      const authenticatedClient = createAuthenticatedClient(token);
      const response = await authenticatedClient.get('/user');
      
      if (response.data.success) {
        return {
          user: response.data.profile,
          token: token
        };
      }
    } catch (error) {
      dispatch(logout());
      throw new Error('Token inválido');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    signupStart: (state) => {
      state.isSigningUp = true;
      state.error = null;
    },
    signupSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isSigningUp = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.isSigningUp = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    
    togglePremium: (state) => {
      if (state.user) {
        state.user.has_premium = !state.user.has_premium;
        
        state.user.isPremium = state.user.has_premium;
      }
    },
    
    toggleAdminRole: (state) => {
      if (state.user) {
        state.user.role = state.user.role === 'admin' ? 'creator' : 'admin';
      }
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    resetLoadingStates: (state) => {
      state.isLoading = false;
      state.isSigningUp = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.error.message || 'Falha na verificação de autenticação';
      });
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  signupStart, 
  signupSuccess, 
  signupFailure, 
  logout, 
  clearError,
  togglePremium,
  toggleAdminRole,
  updateUser,
  resetLoadingStates
} = authSlice.actions;

export default authSlice.reducer; 