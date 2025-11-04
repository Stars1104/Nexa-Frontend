import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { usePremiumContext } from "../contexts/PremiumContext";
import { apiClient } from "../services/apiClient";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Crown, Lock, ArrowRight } from "lucide-react";
import { useAppSelector } from "../store/hooks"

interface PremiumAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  setComponent?: (component: string) => void;
}

export default function PremiumAccessGuard({
  children,
  fallback,
  setComponent
}: PremiumAccessGuardProps) {
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [optimisticPremium, setOptimisticPremium] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  
  // Use Redux state instead of local state
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const {
    premiumStatus,
    hasPremium,
    loading: premiumLoading,
    refreshPremiumStatus,
  } = usePremiumContext();

  // Fallback: considerar trial de estudante diretamente via endpoint de estudante
  const [hasStudentTrial, setHasStudentTrial] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/student/status');
        const st = res?.data;
        if (!cancelled) {
          setHasStudentTrial(Boolean(st?.is_on_trial || (st?.free_trial_expires_at && new Date(st.free_trial_expires_at) > new Date())));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    checkUserAndPremiumStatus();
  }, []);

  // Refresh premium status when user changes, ensuring it runs even when hasPremium changes
  useEffect(() => {
    if (user && (user.role === "creator" || user.role === "student") && !premiumLoading && !isRefreshing) {
      // Always refresh to ensure we have the latest status
      // This ensures refresh happens even when hasPremium changes from false to true
      refreshPremiumStatus();
    }
  }, [user?.id, user?.role, premiumLoading, refreshPremiumStatus, isRefreshing]);

  // Listen for premium status updates and refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = async () => {
      // Optimistically set premium to true when status update is triggered
      // This prevents blocking during the refresh period
      setOptimisticPremium(true);
      setIsRefreshing(true);
      
      // Force refresh bypasses cooldown for immediate updates after subscription
      await refreshPremiumStatus(true);
      
      // Clear refreshing flag after refresh completes
      setIsRefreshing(false);
      
      // Clear optimistic flag after refresh completes (with a small delay to ensure status is updated)
      setTimeout(() => {
        setOptimisticPremium(false);
      }, 1000);
    };

    window.addEventListener("premium-status-updated", handlePremiumUpdate);

    return () => {
      window.removeEventListener("premium-status-updated", handlePremiumUpdate);
    };
  }, [refreshPremiumStatus]);

  const checkUserAndPremiumStatus = async () => {
    try {
      // Prevent rapid successive calls
      const now = Date.now();
      if (now - lastCheck < 3000) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      setLastCheck(now);

      // Add a small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      // User data is now managed by Redux, no need to set local state
      const response = await apiClient.get("/user");
      const userData = response.data;

      // Check premium for creators and students
      if (userData.role === "creator" || userData.role === "student") {
        // Only decide after premium status is loaded to avoid false positives
        if (premiumStatus && !hasPremium && !premiumLoading) {
          showPremiumWarning();
        }
      }
    } catch (error: any) {
      console.error("Error checking user status:", error);

      // If it's a 401 error, clear token (user data is managed by Redux)
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }

      // If it's a premium required error, show the warning
      if (
        error.response?.status === 403 &&
        error.response?.data?.error === "premium_required"
      ) {
        showPremiumWarning();
      }
    } finally {
      setLoading(false);
    }
  };

  const showPremiumWarning = () => {
    toast({
      title: "Premium Access Required",
      description:
        "You need a premium subscription to access this feature. Subscribe now to unlock all features!",
      variant: "destructive",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSubscribeClick}
          className="ml-2"
        >
          Subscribe Now
        </Button>
      ),
    });
  };

  const handleSubscribeClick = () => {
    // Onconsolly set component if not currently refreshing to prevent unnecessary call
    if (!isRefreshing && setComponent) {
      setComponent("Assinatura");
    }
  };

  // Allow access to profile, portfolio, and subscription pages even during loading
  const allowedPaths = [
    "/creator/subscription",
    "/creator/profile",
    "/creator/portfolio",
  ];
  const currentPath = location.pathname;
  const isAllowedPath = allowedPaths.some((path) => currentPath.includes(path));

  // If we're on an allowed path, always allow access (even during loading)
  if (isAllowedPath) {
    return <>{children}</>;
  }

  // Consider loading while premiumStatus is not yet available to avoid flashing the guard
  // But only if we're not on an allowed path and not optimistically allowing access
  if ((loading || premiumLoading || !premiumStatus) && !optimisticPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not a creator or student, or has premium access, show children
  // For students, check if they have premium access (includes free trial)
  // For creators, check if they have premium access (premium only)
  // hasPremium from context already includes is_premium_active logic
  // Considera também período de teste (is_on_trial) vindo do backend
  // Include optimisticPremium to allow access immediately after subscription creation
  const userHasPremiumAccess = hasPremium || Boolean((premiumStatus as any)?.is_on_trial) || hasStudentTrial || optimisticPremium;

  if (!user || (user.role !== "creator" && user.role !== "student") || userHasPremiumAccess) {
    return <>{children}</>;
  }

  // Special handling for creator main page - check if we're on a restricted component
  const isCreatorMainPage =
    currentPath === "/creator" || currentPath === "/creator/";

  // For creator main page, we need to check the component being rendered
  // This will be handled by the parent component passing the correct fallback

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default premium required screen
  return (
    <div className="flex items-center justify-center min-h-[91vh] dark:bg-[#171717] p-4">
      <Card className="w-full max-w-md bg-background border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Acesso Premium necessário
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-slate-300">
            Desbloqueie todos os recursos com nossa assinatura premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Acesso a todas as campanhas
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Lance em campanhas premium
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Mensagens diretas com marcas
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Suporte prioritário</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSubscribeClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3"
            >
              <Crown className="mr-2 h-4 w-4" />
                Obtenha acesso premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
