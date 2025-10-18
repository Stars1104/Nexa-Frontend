import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import campaignReducer from './slices/campaignSlice';
import brandProfileReducer from './slices/brandProfileSlice';
import notificationReducer from './slices/notificationSlice';
import portfolioReducer from './slices/portfolioSlice';
import chatReducer from './slices/chatSlice';
import { rootPersistConfig } from './persistConfig';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  campaign: campaignReducer,
  brandProfile: brandProfileReducer,
  notification: notificationReducer,
  portfolio: portfolioReducer,
  chat: chatReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 