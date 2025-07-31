import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "@/services/apiClient";

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

export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremiumContext must be used within a PremiumProvider");
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
      // Prevent rapid successive calls
      const now = Date.now();
      if (now - lastCheck < 2000) {
        return null;
      }

      setLoading(true);
      setLastCheck(now);

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        setPremiumStatus(null);
        return null;
      }

      const response = await apiClient.get("/payment/subscription-status");
      const status = response.data;
      setPremiumStatus(status);
      return status;
    } catch (error) {
      console.error("PremiumContext: Error checking premium status:", error);

      // If it's a 401 error, clear the status
      if (error.response?.status === 401) {
        setPremiumStatus(null);
      }

      // If it's a 429 error, don't retry immediately
      if (error.response?.status === 429) {
        console.log("PremiumContext: Rate limited, will retry later");
        // Don't clear status on rate limit, just log it
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [lastCheck]);

  const refreshPremiumStatus = useCallback(async () => {
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  // Listen for custom events to refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = () => {
      console.log("PremiumContext: Received premium-status-updated event");
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
