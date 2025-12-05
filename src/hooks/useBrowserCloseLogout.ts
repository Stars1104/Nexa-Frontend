import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { clearUserSession } from '../utils/sessionCleanup';
import { SESSION_CONFIG } from '../config/sessionConfig';

interface UseBrowserCloseLogoutOptions {
  enabled?: boolean;
  onLogout?: () => void;
}

export const useBrowserCloseLogout = (options: UseBrowserCloseLogoutOptions = {}) => {
  const { 
    enabled = SESSION_CONFIG.BROWSER_CLOSE_LOGOUT.ENABLED, 
    onLogout 
  } = options;
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      
      if (!hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        
        clearUserSession();
        
        
        dispatch(logout());
        
        
        onLogout?.();
      }
    };

    const handleUnload = () => {
      
      if (!hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        
        clearUserSession();
      }
    };

    const handleVisibilityChange = () => {
      
      
      if (SESSION_CONFIG.BROWSER_CLOSE_LOGOUT.CLEAR_ON_TAB_HIDE && 
          document.hidden && 
          !hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        
        clearUserSession();
        
        
        dispatch(logout());
        
        
        onLogout?.();
      }
    };

    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isAuthenticated, dispatch, onLogout]);

  
  useEffect(() => {
    if (isAuthenticated) {
      hasLoggedOutRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
};

export default useBrowserCloseLogout;
