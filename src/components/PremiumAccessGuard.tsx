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
import { useAppSelector } from "../store/hooks";

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
  const { toast } = useToast();
  const location = useLocation();
  
  // Use Redux state instead of local state
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const {
    hasPremium,
    loading: premiumLoading,
    refreshPremiumStatus,
  } = usePremiumContext();

  useEffect(() => {
    checkUserAndPremiumStatus();
  }, []);

  // Only refresh premium status when user changes, not on every location change
  useEffect(() => {
    if (user && user.role === "creator" && !premiumLoading) {
      // Only refresh if we don't have premium status yet
      if (!hasPremium) {
        refreshPremiumStatus();
      }
    }
  }, [user?.id, user?.role, hasPremium, premiumLoading, refreshPremiumStatus]);

  // Listen for premium status updates and refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = async () => {
      await refreshPremiumStatus();
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

      // Only check premium for creators
      if (userData.role === "creator") {
        // Premium status is now handled by the hook
        if (!hasPremium && !premiumLoading) {
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
    // Update URL immediately for better UX
    // window.history.pushState({}, "", "/creator/subscription");
    setComponent("Assinatura");

    try {
      // Try React Router navigation
      // navigate("/creator/subscription", { replace: true });
      setComponent("Assinatura");
    } catch (error) {
      console.error("React Router navigation error:", error);
      // Fallback to direct navigation
      setComponent("Assinatura");
      // window.location.href = "/creator/subscription";
    }
  };

  if (loading || premiumLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not a creator, or has premium, show children
  // Check both hook premium status and user's has_premium field
  const userHasPremium = hasPremium || user?.has_premium;

  if (!user || user.role !== "creator" || userHasPremium) {
    return <>{children}</>;
  }

  // Allow access to profile, portfolio, and subscription pages even for non-premium creators
  // For creator pages, we need to check both the pathname and the component state
  const allowedPaths = [
    "/creator/subscription",
    "/creator/profile",
    "/creator/portfolio",
  ];

  const currentPath = location.pathname;
  const isAllowedPath = allowedPaths.some((path) => currentPath.includes(path));

  // Special handling for creator main page - check if we're on a restricted component
  const isCreatorMainPage =
    currentPath === "/creator" || currentPath === "/creator/";

  if (isAllowedPath) {
    return <>{children}</>;
  }

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
