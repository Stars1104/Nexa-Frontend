import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { apiClient } from "../services/apiClient";

interface PremiumStatus {
  has_premium: boolean;
  premium_expires_at?: string;
  is_premium_active: boolean;
  days_remaining: number;
}

interface PremiumContextType {
  premiumStatus: PremiumStatus | null;
  loading: boolean;
  refreshPremiumStatus: () => Promise<void>;
  hasPremium: boolean;
  isPremiumActive: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Simplified export for testing
export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremiumContext deve ser usado dentro de um PremiumProvider");
  }
  return context;
};

interface PremiumProviderProps {
  children: React.ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({
  children,
}) => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false); // Start as false, not loading
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const lastCallTime = useRef<number>(0);
  const isCalling = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  const initializationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkPremiumStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isCalling.current) {
      return;
    }

    // Add cooldown period (5 seconds) to prevent excessive calls
    const now = Date.now();
    if (now - lastCallTime.current < 5000) {
      return;
    }

    // Check if user is authenticated before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsInitialized(true);
      setIsEnabled(false);
      return;
    }

    // Check if we've exceeded max retries
    if (retryCount.current >= maxRetries) {
      setLoading(false);
      setIsInitialized(true);
      setIsEnabled(false);
      return;
    }

    try {
      isCalling.current = true;
      lastCallTime.current = now;
      setLoading(true);
      setIsEnabled(true);
      
      const response = await apiClient.get('/payment/subscription-status');
      setPremiumStatus(response.data);
      retryCount.current = 0; // Reset retry count on success
    } catch (error: any) {        
      // Handle 401 errors specifically - user is not authenticated
      if (error.response?.status === 401) {
        setPremiumStatus(null);
        setIsEnabled(false);
        // Don't retry on 401 errors
        setIsInitialized(true);
      }
      // Handle 429 rate limiting errors
      else if (error.response?.status === 429) {
        retryCount.current++;
        // Don't mark as initialized on rate limiting, allow retry
      }
      // Handle other errors
      else {
        retryCount.current++;
        // Don't clear existing status on other errors to prevent UI flicker
      }
    } finally {
      setLoading(false);
      if (!isInitialized) {
        setIsInitialized(true);
      }
      isCalling.current = false;
    }
  }, [isInitialized]);

  const refreshPremiumStatus = useCallback(async () => {
    if (isEnabled) {
      await checkPremiumStatus();
    }
  }, [checkPremiumStatus, isEnabled]);

  // Initialize with a delay to ensure app is fully loaded
  useEffect(() => {
    if (!isInitialized) {
      // Wait 2 seconds before making the first API call to ensure app is initialized
      initializationTimeout.current = setTimeout(() => {
        // Check if user is authenticated before making API call
        const token = localStorage.getItem('token');
        if (token) {
          checkPremiumStatus();
        } else {
          setIsInitialized(true);
          setIsEnabled(false);
        }
      }, 2000);
    }

    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [isInitialized, checkPremiumStatus]);

  // Listen for custom events to refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = () => {
      refreshPremiumStatus();
    };

    window.addEventListener("premium-status-updated", handlePremiumUpdate);

    return () => {
      window.removeEventListener("premium-status-updated", handlePremiumUpdate);
    };
  }, [refreshPremiumStatus]);

  // Listen for authentication changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // User logged in, check premium status
          setIsEnabled(true);
          checkPremiumStatus();
        } else {
          // User logged out, clear premium status
          setPremiumStatus(null);
          setIsEnabled(false);
        }
      }
    };

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', handleStorageChange);

    // Also check for token changes in current tab
    const checkTokenChange = () => {
      const token = localStorage.getItem('token');
      if (token && !isEnabled) {
        setIsEnabled(true);
        checkPremiumStatus();
      } else if (!token && isEnabled) {
        setPremiumStatus(null);
        setIsEnabled(false);
      }
    };

    // Check for token changes periodically
    const tokenCheckInterval = setInterval(checkTokenChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, [isEnabled, checkPremiumStatus]);

  const value: PremiumContextType = {
    premiumStatus,
    loading,
    refreshPremiumStatus,
    hasPremium: premiumStatus?.has_premium || premiumStatus?.is_premium_active || false,
    isPremiumActive: premiumStatus?.is_premium_active || false,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};
