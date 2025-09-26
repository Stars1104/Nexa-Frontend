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
      // Only initialize once and only if not already authenticated
      if (!hasInitialized.current && !isAuthenticated && !token && !user) {
        hasInitialized.current = true;
        
        // Don't auto-login if user is on auth/signup pages
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/auth') || 
                          currentPath.includes('/signup') || 
                          currentPath.includes('/forgot-password');
        
        if (isAuthPage) {
          // On auth pages, clear any existing session data to prevent auto-login
          if (SESSION_CONFIG.BROWSER_CLOSE_LOGOUT.CLEAR_ON_AUTH_PAGES && hasSessionData()) {
            console.log('Clearing session data on auth page');
            clearUserSession();
          }
          setIsRehydrating(false);
          return;
        }
        
        // Check localStorage for existing auth data
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            // Only validate token if we have stored data
            await dispatch(checkAuthStatus()).unwrap();
          } catch (error) {
            // Token validation failed, clear stored data
            clearUserSession();
          }
        } else {
        }
        
        // Mark rehydration as complete
        setIsRehydrating(false);
      } else if (isAuthenticated || token || user) {
        // Already authenticated, mark rehydration as complete
        setIsRehydrating(false);
      }
    };
    
    initializeAuth();
  }, [dispatch, isAuthenticated, token, user]);


  return {
    token,
    user,
    isAuthenticated,
    isRehydrating,
  };
}; 