import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkPremiumStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payment/subscription-status');
      setPremiumStatus(response.data);
    } catch (error) {
      // Handle error silently or let components handle it
      setPremiumStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

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

  const value: PremiumContextType = {
    premiumStatus,
    loading,
    refreshPremiumStatus,
    hasPremium: premiumStatus?.has_premium || false,
    isPremiumActive: premiumStatus?.is_premium_active || false,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};
