import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';
import { hasSessionData, clearUserSession } from '../utils/sessionCleanup';
import { SESSION_CONFIG } from '../config/sessionConfig';

export const useAuthRehydration = () => {
  const dispatch = useAppDispatch();
  const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
  const hasInitialized = useRef(false);
  const [isRehydrating, setIsRehydrating] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Only initialize once
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      
      console.log('Auth rehydration starting...', { token, user, isAuthenticated });
      
      // Don't auto-login if user is on auth/signup pages
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/auth') || 
                        currentPath.includes('/signup') || 
                        currentPath.includes('/forgot-password');
      
      if (isAuthPage) {
        console.log('On auth page, skipping auto-login');
        setIsRehydrating(false);
        return;
      }
      
      // If already authenticated from Redux state, no need to revalidate
      if (isAuthenticated && token && user) {
        console.log('Already authenticated from Redux state - no validation needed');
        setIsRehydrating(false);
        return;
      }
      
      // Check localStorage for existing auth data
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          console.log('Found stored auth data, validating token...');
          // Validate token with backend
          await dispatch(checkAuthStatus()).unwrap();
          console.log('Token validation successful');
        } catch (error) {
          console.log('Token validation failed, clearing stored data:', error);
          // Token validation failed, clear stored data
          clearUserSession();
        }
      } else {
        console.log('No stored auth data found');
      }
      
      // Mark rehydration as complete
      setIsRehydrating(false);
    };
    
    // Add a small delay to ensure Redux Persist has time to rehydrate
    const timer = setTimeout(() => {
      initializeAuth();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Reset initialization flag when user logs out
  useEffect(() => {
    if (!isAuthenticated && !token && !user) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated, token, user]);

  return {
    token,
    user,
    isAuthenticated,
    isRehydrating,
  };
}; 