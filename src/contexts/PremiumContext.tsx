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
  refreshPremiumStatus: (forceRefresh?: boolean) => Promise<void>;
  hasPremium: boolean;
  isPremiumActive: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);


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
  const [loading, setLoading] = useState(false); 
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const lastCallTime = useRef<number>(0);
  const isCalling = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  const initializationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkPremiumStatus = useCallback(async (forceRefresh: boolean = false) => {
    
    if (isCalling.current) {
      return;
    }

    
    
    const now = Date.now();
    if (!forceRefresh && now - lastCallTime.current < 5000) {
      return;
    }

    
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsInitialized(true);
      setIsEnabled(false);
      return;
    }

    
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
      console.log("premiumStatus", response.data);
      retryCount.current = 0; 
    } catch (error: any) {        
      
      if (error.response?.status === 401) {
        setPremiumStatus(null);
        setIsEnabled(false);
        
        setIsInitialized(true);
      }
      
      else if (error.response?.status === 429) {
        retryCount.current++;
        
      }
      
      else {
        retryCount.current++;
        
      }
    } finally {
      setLoading(false);
      if (!isInitialized) {
        setIsInitialized(true);
      }
      isCalling.current = false;
    }
  }, [isInitialized]);

  const refreshPremiumStatus = useCallback(async (forceRefresh: boolean = false) => {
    if (isEnabled || forceRefresh) {
      
      await checkPremiumStatus(forceRefresh);
    }
  }, [checkPremiumStatus, isEnabled]);

  
  useEffect(() => {
    if (!isInitialized) {
      
      const token = localStorage.getItem('token');
      if (token) {
        
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            checkPremiumStatus();
          }, { timeout: 500 });
        } else {
          
          initializationTimeout.current = setTimeout(() => {
            checkPremiumStatus();
          }, 100);
        }
      } else {
        setIsInitialized(true);
        setIsEnabled(false);
      }
    }

    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [isInitialized, checkPremiumStatus]);

  
  useEffect(() => {
    const handlePremiumUpdate = () => {
      refreshPremiumStatus();
    };

    window.addEventListener("premium-status-updated", handlePremiumUpdate);

    return () => {
      window.removeEventListener("premium-status-updated", handlePremiumUpdate);
    };
  }, [refreshPremiumStatus]);

  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log("handleStorageChange", e.key);
      if (e.key === 'token') {
        if (e.newValue) {
          
          setIsEnabled(true);
          checkPremiumStatus();
        } else {
          
          setPremiumStatus(null);
          setIsEnabled(false);
        }
      }
    };

    
    window.addEventListener('storage', handleStorageChange);

    
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
  console.log("uuuuuuuuuuuuuuuuuuuuuuuu", value)
  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};
