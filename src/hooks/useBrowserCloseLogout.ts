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
      // Clear session data when browser/tab is about to close
      if (!hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        // Clear all session data
        clearUserSession();
        
        // Dispatch logout to clear Redux state
        dispatch(logout());
        
        // Call custom logout handler
        onLogout?.();
      }
    };

    const handleUnload = () => {
      // Fallback for browsers that don't support beforeunload properly
      if (!hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        // Clear all session data
        clearUserSession();
      }
    };

    const handleVisibilityChange = () => {
      // Only clear session when tab becomes hidden if explicitly enabled
      // This prevents users from being logged out when switching tabs
      if (SESSION_CONFIG.BROWSER_CLOSE_LOGOUT.CLEAR_ON_TAB_HIDE && 
          document.hidden && 
          !hasLoggedOutRef.current) {
        hasLoggedOutRef.current = true;
        
        // Clear all session data
        clearUserSession();
        
        // Dispatch logout to clear Redux state
        dispatch(logout());
        
        // Call custom logout handler
        onLogout?.();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isAuthenticated, dispatch, onLogout]);

  // Reset the logout flag when user logs in again
  useEffect(() => {
    if (isAuthenticated) {
      hasLoggedOutRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
};

export default useBrowserCloseLogout;
