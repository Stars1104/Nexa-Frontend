import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import * as portfolioAPI from '../../api/portfolio';
import { Portfolio, PortfolioItem, PortfolioStats } from '../../api/portfolio';

// Types
export interface PortfolioState {
  portfolio: Portfolio | null;
  stats: PortfolioStats | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  isUploading: boolean;
}

// Initial state
const initialState: PortfolioState = {
  portfolio: null,
  stats: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,
};

// Async thunks
export const fetchPortfolio = createAsyncThunk<
  any,
  string,
  { state: RootState; rejectValue: string }
>('portfolio/fetchPortfolio', async (token, { rejectWithValue }) => {
  try {
    const response = await portfolioAPI.getPortfolio(token);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao buscar portfólio');
  }
});

export const updatePortfolioProfile = createAsyncThunk<
  Portfolio,
  { token: string; data: FormData },
  { state: RootState; rejectValue: string }
>('portfolio/updateProfile', async ({ token, data }, { rejectWithValue }) => {
  try {
    const response = await portfolioAPI.updatePortfolioProfile(token, data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao atualizar perfil do portfólio');
  }
});

export const uploadPortfolioMedia = createAsyncThunk<
  { items: PortfolioItem[]; total_items: number },
  { token: string; files: File[] },
  { state: RootState; rejectValue: string }
>('portfolio/uploadMedia', async ({ token, files }, { rejectWithValue }) => {
  try {
    const response = await portfolioAPI.uploadPortfolioMedia(token, files);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao fazer upload de mídia');
  }
});

export const updatePortfolioItem = createAsyncThunk<
  PortfolioItem,
  { token: string; itemId: number; data: any },
  { state: RootState; rejectValue: string }
>('portfolio/updateItem', async ({ token, itemId, data }, { rejectWithValue }) => {
  try {
    const response = await portfolioAPI.updatePortfolioItem(token, itemId, data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao atualizar item do portfólio');
  }
});

export const deletePortfolioItem = createAsyncThunk<
  number,
  { token: string; itemId: number },
  { state: RootState; rejectValue: string }
>('portfolio/deleteItem', async ({ token, itemId }, { rejectWithValue }) => {
  try {
    await portfolioAPI.deletePortfolioItem(token, itemId);
    return itemId;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao excluir item do portfólio');
  }
});

export const reorderPortfolioItems = createAsyncThunk<
  void,
  { token: string; data: any },
  { state: RootState; rejectValue: string }
>('portfolio/reorderItems', async ({ token, data }, { rejectWithValue }) => {
  try {
    await portfolioAPI.reorderPortfolioItems(token, data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao reordenar itens do portfólio');
  }
});

export const fetchPortfolioStats = createAsyncThunk<
  PortfolioStats,
  string,
  { state: RootState; rejectValue: string }
>('portfolio/fetchStats', async (token, { rejectWithValue }) => {
  try {
    const response = await portfolioAPI.getPortfolioStats(token);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Falha ao buscar estatísticas do portfólio');
  }
});

// Slice
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },
    addPortfolioItem: (state, action: PayloadAction<PortfolioItem>) => {
      if (state.portfolio) {
        state.portfolio.items = state.portfolio.items || [];
        state.portfolio.items.push(action.payload);
      }
    },
    updatePortfolioItemInState: (state, action: PayloadAction<PortfolioItem>) => {
      if (state.portfolio?.items) {
        const index = state.portfolio.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.portfolio.items[index] = action.payload;
        }
      }
    },
    removePortfolioItem: (state, action: PayloadAction<number>) => {
      if (state.portfolio?.items) {
        state.portfolio.items = state.portfolio.items.filter(item => item.id !== action.payload);
      }
    },
    reorderPortfolioItemsInState: (state, action: PayloadAction<PortfolioItem[]>) => {
      if (state.portfolio) {
        state.portfolio.items = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch portfolio
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload.portfolio;
        state.stats = {
          total_items: action.payload.items_count,
          images_count: action.payload.images_count,
          videos_count: action.payload.videos_count,
          is_complete: action.payload.is_complete,
          has_minimum_items: action.payload.items_count >= 3,
          profile_complete: !!(action.payload.portfolio.title && action.payload.portfolio.bio),
        };
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Falha ao buscar portfólio';
      });

    // Update profile
    builder
      .addCase(updatePortfolioProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePortfolioProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.portfolio) {
          state.portfolio = { ...state.portfolio, ...action.payload };
        }
      })
      .addCase(updatePortfolioProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Falha ao atualizar perfil do portfólio';
      });

    // Upload media
    builder
      .addCase(uploadPortfolioMedia.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadPortfolioMedia.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        if (state.portfolio) {
          state.portfolio.items = state.portfolio.items || [];
          state.portfolio.items.push(...action.payload.items);
        }
        if (state.stats) {
          state.stats.total_items = action.payload.total_items;
        }
      })
      .addCase(uploadPortfolioMedia.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload || 'Falha ao fazer upload de mídia';
      });

    // Update item
    builder
      .addCase(updatePortfolioItem.fulfilled, (state, action) => {
        if (state.portfolio?.items) {
          const index = state.portfolio.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.portfolio.items[index] = action.payload;
          }
        }
      })
      .addCase(updatePortfolioItem.rejected, (state, action) => {
        state.error = action.payload || 'Falha ao atualizar item do portfólio';
      });

    // Delete item
    builder
      .addCase(deletePortfolioItem.fulfilled, (state, action) => {
        if (state.portfolio?.items) {
          state.portfolio.items = state.portfolio.items.filter(item => item.id !== action.payload);
        }
        if (state.stats) {
          state.stats.total_items = Math.max(0, state.stats.total_items - 1);
        }
      })
      .addCase(deletePortfolioItem.rejected, (state, action) => {
        state.error = action.payload || 'Falha ao excluir item do portfólio';
      });

    // Fetch stats
    builder
      .addCase(fetchPortfolioStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchPortfolioStats.rejected, (state, action) => {
        state.error = action.payload || 'Falha ao buscar estatísticas do portfólio';
      });
  },
});

// Actions
export const {
  clearError,
  setUploadProgress,
  setIsUploading,
  addPortfolioItem,
  updatePortfolioItemInState,
  removePortfolioItem,
  reorderPortfolioItemsInState,
} = portfolioSlice.actions;

// Selectors
export const selectPortfolio = (state: RootState) => state.portfolio.portfolio;
export const selectPortfolioStats = (state: RootState) => state.portfolio.stats;
export const selectPortfolioLoading = (state: RootState) => state.portfolio.isLoading;
export const selectPortfolioError = (state: RootState) => state.portfolio.error;
export const selectUploadProgress = (state: RootState) => state.portfolio.uploadProgress;
export const selectIsUploading = (state: RootState) => state.portfolio.isUploading;
export const selectPortfolioItems = (state: RootState) => state.portfolio.portfolio?.items || [];

export default portfolioSlice.reducer; 