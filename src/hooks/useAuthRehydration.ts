import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';

export const useAuthRehydration = () => {
  const dispatch = useAppDispatch();
  const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = () => {
      // Check if user is already authenticated
      if (!isAuthenticated) {
        dispatch(checkAuthStatus());
      }
    };
    
    initializeAuth();
  }, [dispatch, isAuthenticated]);

  return {
    token,
    user,
    isAuthenticated,
  };
}; 