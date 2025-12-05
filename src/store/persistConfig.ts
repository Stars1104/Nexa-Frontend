import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist';


export const authPersistConfig: PersistConfig<any> = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], 
};


export const userPersistConfig: PersistConfig<any> = {
  key: 'user',
  storage,
  whitelist: ['profile', 'preferences'], 
};


export const rootPersistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'campaign', 'chat'], 
}; 