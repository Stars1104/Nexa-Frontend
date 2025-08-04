import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getProfile } from '../../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'brand' | 'student' | 'admin';
  whatsapp?: string;
  isStudent?: boolean;
  isPremium?: boolean; // Legacy field, use has_premium instead
  has_premium?: boolean;
  premium_expires_at?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
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

// Async thunk for checking authentication status
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { getState, dispatch }) => {
    const state = getState() as { auth: AuthState };
    const { token } = state.auth;
    
    // If no token in state, check localStorage
    if (!token) {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Validate token with backend
          const response = await getProfile();
          if (response.success) {
            return {
              user: response.profile,
              token: storedToken
            };
          }
        } catch (error) {
          // Token is invalid, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Invalid token');
        }
      }
      throw new Error('No valid authentication found');
    }
    
    // If token exists in state, validate it
    try {
      const response = await getProfile();
      if (response.success) {
        return {
          user: response.profile,
          token: token
        };
      }
    } catch (error) {
      // Token is invalid, clear state
      dispatch(logout());
      throw new Error('Invalid token');
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
      
      // Also store in localStorage as backup
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    // Sign-up actions
    signupStart: (state) => {
      state.isSigningUp = true;
      state.error = null;
    },
    signupSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isSigningUp = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      
      // Also store in localStorage as backup
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
      
      // Clear localStorage as well
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    // Toggle premium status (for testing)
    togglePremium: (state) => {
      if (state.user) {
        state.user.has_premium = !state.user.has_premium;
        // Also update legacy field for backward compatibility
        state.user.isPremium = state.user.has_premium;
      }
    },
    // Temporary action to toggle admin role for testing
    toggleAdminRole: (state) => {
      if (state.user) {
        state.user.role = state.user.role === 'admin' ? 'creator' : 'admin';
      }
    },
    // Update user data (useful for refreshing user data after subscription)
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        const oldUser = { ...state.user };
        state.user = { ...state.user, ...action.payload };
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
      } else {
        console.error('AuthSlice updateUser - no user in state');
      }
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
        state.error = action.error.message || 'Authentication check failed';
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
  updateUser
} = authSlice.actions;
export default authSlice.reducer; 