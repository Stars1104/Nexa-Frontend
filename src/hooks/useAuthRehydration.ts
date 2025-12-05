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
      
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      
      
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/auth') || 
                        currentPath.includes('/signup') || 
                        currentPath.includes('/forgot-password');
      
      if (isAuthPage) {
        setIsRehydrating(false);
        return;
      }
      
      
      if (isAuthenticated && token && user) {
        setIsRehydrating(false);
        return;
      }
      
      
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          
          await dispatch(checkAuthStatus()).unwrap();
        } catch (error) {
          clearUserSession();
        }
      }
      
      
      setIsRehydrating(false);
    };
    
    
    const timer = setTimeout(() => {
      initializeAuth();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [dispatch]);

  
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