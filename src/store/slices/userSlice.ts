import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
  languages?: string[];
  gender?: string;
  categories?: string[];
  has_premium?: boolean;
  creator_type?: string;
  birth_date?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_channel?: string;
  facebook_page?: string;
  twitter_handle?: string;
  industry?: string;
  state?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

interface UserState {
  profile: UserProfile | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  preferences: {
    theme: 'system',
    notifications: true,
    emailUpdates: true,
  },
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.isLoading = false;
      state.profile = action.payload;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    updateProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.isLoading = false;
      state.profile = action.payload;
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateProfile,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  updatePreferences,
  clearUserError,
} = userSlice.actions;

export default userSlice.reducer; 