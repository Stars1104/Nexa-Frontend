import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { SESSION_CONFIG } from '../config/sessionConfig';
import { sessionManager } from '../utils/sessionManager';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const {
    timeoutMinutes = SESSION_CONFIG.TIMEOUT_MINUTES,
    warningMinutes = SESSION_CONFIG.WARNING_MINUTES,
    onTimeout,
    onWarning
  } = options;

  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [showWarning, setShowWarning] = useState(false);
  
  const timeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  // Check if current route should be excluded from session timeout
  const isExcludedRoute = useCallback(() => {
    const currentPath = window.location.pathname;
    return SESSION_CONFIG.EXCLUDED_ROUTES.some(route => 
      currentPath.startsWith(route)
    );
  }, []);

  // Reset timers when user is active
  const resetTimers = useCallback(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Reset activity time and warning state
    lastActivityRef.current = Date.now();
    isWarningShownRef.current = false;
    setShowWarning(false);

    // Set warning timeout
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated && user && !isExcludedRoute()) {
        isWarningShownRef.current = true;
        setShowWarning(true);
        onWarning?.();
      }
    }, warningTime);

    // Set main timeout
    const timeoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated && user && !isExcludedRoute()) {
        handleSessionTimeout();
      }
    }, timeoutTime);
    
  }, [isAuthenticated, user, timeoutMinutes, warningMinutes, onTimeout, onWarning, isExcludedRoute]);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    // Clear all timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Logout user
    dispatch(logout());
    
    // Navigate to login page using window.location
    window.location.href = '/auth';
    
    // Call custom timeout handler
    onTimeout?.();
  }, [dispatch, onTimeout]);

  // Activity detection
  const handleActivity = useCallback(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if there's been significant activity (more than minimum interval)
    if (timeSinceLastActivity > SESSION_CONFIG.MIN_ACTIVITY_INTERVAL) {
      resetTimers();
    }
  }, [isAuthenticated, user, resetTimers, isExcludedRoute]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;

    // Add event listeners for activity detection
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimers();

    // Cleanup function
    return () => {
      SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, handleActivity, resetTimers, isExcludedRoute]);

  // Reset timers when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      resetTimers();
    } else {
      // Clear timers when user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    }
  }, [isAuthenticated, user, resetTimers]);

  // Manual session extension (useful for API calls)
  const extendSession = useCallback(() => {
    if (isAuthenticated && user) {
      resetTimers();
    }
  }, [isAuthenticated, user, resetTimers]);

  // Register with session manager for API calls
  useEffect(() => {
    if (isAuthenticated && user) {
      sessionManager.registerExtendSessionCallback(extendSession);
    } else {
      sessionManager.clearCallback();
    }

    return () => {
      sessionManager.clearCallback();
    };
  }, [isAuthenticated, user, extendSession]);

  // Get remaining time in minutes
  const getRemainingTime = useCallback(() => {
    if (!isAuthenticated || !user) return 0;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const remainingTime = (timeoutMinutes * 60 * 1000) - timeSinceLastActivity;
    
    return Math.max(0, Math.floor(remainingTime / (60 * 1000)));
  }, [isAuthenticated, user, timeoutMinutes]);

  // Handle extending session from warning modal
  const handleExtendSession = useCallback(() => {
    setShowWarning(false);
    extendSession();
  }, [extendSession]);

  // Handle logout from warning modal
  const handleLogout = useCallback(() => {
    setShowWarning(false);
    handleSessionTimeout();
  }, [handleSessionTimeout]);

  return {
    extendSession,
    getRemainingTime,
    isWarningShown: showWarning,
    remainingMinutes: getRemainingTime(),
    onExtendSession: handleExtendSession,
    onLogout: handleLogout
  };
};

export default useSessionTimeout;
