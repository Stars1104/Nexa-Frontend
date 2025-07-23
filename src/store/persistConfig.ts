import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist';

// Auth slice persistence config
export const authPersistConfig: PersistConfig<any> = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist these fields
};

// User slice persistence config
export const userPersistConfig: PersistConfig<any> = {
  key: 'user',
  storage,
  whitelist: ['profile', 'preferences'], // Only persist these fields
};

// Root persistence config
export const rootPersistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'campaign'], // Persist auth, user, and campaign states
}; 