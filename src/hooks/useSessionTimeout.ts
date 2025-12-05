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

  
  const isExcludedRoute = useCallback(() => {
    const currentPath = window.location.pathname;
    return SESSION_CONFIG.EXCLUDED_ROUTES.some(route => 
      currentPath.startsWith(route)
    );
  }, []);

  
  const resetTimers = useCallback(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;

    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    
    lastActivityRef.current = Date.now();
    isWarningShownRef.current = false;
    setShowWarning(false);

    
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated && user && !isExcludedRoute()) {
        isWarningShownRef.current = true;
        setShowWarning(true);
        onWarning?.();
      }
    }, warningTime);

    
    const timeoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated && user && !isExcludedRoute()) {
        handleSessionTimeout();
      }
    }, timeoutTime);
    
  }, [isAuthenticated, user, timeoutMinutes, warningMinutes, onTimeout, onWarning, isExcludedRoute]);

  
  const handleSessionTimeout = useCallback(() => {
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    
    dispatch(logout());
    
    
    window.location.href = '/auth';
    
    
    onTimeout?.();
  }, [dispatch, onTimeout]);

  
  const handleActivity = useCallback(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    
    if (timeSinceLastActivity > SESSION_CONFIG.MIN_ACTIVITY_INTERVAL) {
      resetTimers();
    }
  }, [isAuthenticated, user, resetTimers, isExcludedRoute]);

  
  useEffect(() => {
    if (!isAuthenticated || !user || isExcludedRoute()) return;

    
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    
    resetTimers();

    
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

  
  useEffect(() => {
    if (isAuthenticated && user) {
      resetTimers();
    } else {
      
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

  
  const extendSession = useCallback(() => {
    if (isAuthenticated && user) {
      resetTimers();
    }
  }, [isAuthenticated, user, resetTimers]);

  
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

  
  const getRemainingTime = useCallback(() => {
    if (!isAuthenticated || !user) return 0;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const remainingTime = (timeoutMinutes * 60 * 1000) - timeSinceLastActivity;
    
    return Math.max(0, Math.floor(remainingTime / (60 * 1000)));
  }, [isAuthenticated, user, timeoutMinutes]);

  
  const handleExtendSession = useCallback(() => {
    setShowWarning(false);
    extendSession();
  }, [extendSession]);

  
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
