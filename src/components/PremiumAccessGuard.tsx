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
  
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const {
    premiumStatus,
    hasPremium,
    loading: premiumLoading,
    refreshPremiumStatus,
  } = usePremiumContext();

  
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

  
  useEffect(() => {
    if (user && (user.role === "creator" || user.role === "student") && !premiumLoading && !isRefreshing) {
      
      
      refreshPremiumStatus();
    }
  }, [user?.id, user?.role, premiumLoading, refreshPremiumStatus, isRefreshing]);

  
  useEffect(() => {
    const handlePremiumUpdate = async () => {
      
      
      setOptimisticPremium(true);
      setIsRefreshing(true);
      
      
      await refreshPremiumStatus(true);
      
      
      setIsRefreshing(false);
      
      
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

      
      await new Promise((resolve) => setTimeout(resolve, 100));

      
      const response = await apiClient.get("/user");
      const userData = response.data;

      
      if (userData.role === "creator" || userData.role === "student") {
        
        if (premiumStatus && !hasPremium && !premiumLoading) {
          showPremiumWarning();
        }
      }
    } catch (error: any) {
      console.error("Error checking user status:", error);

      
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }

      
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
    
    if (!isRefreshing && setComponent) {
      setComponent("Assinatura");
    }
  };

  
  const allowedPaths = [
    "/creator/subscription",
    "/creator/profile",
    "/creator/portfolio",
  ];
  const currentPath = location.pathname;
  const isAllowedPath = allowedPaths.some((path) => currentPath.includes(path));

  
  if (isAllowedPath) {
    return <>{children}</>;
  }

  
  
  if ((loading || premiumLoading || !premiumStatus) && !optimisticPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  
  
  
  
  
  
  const userHasPremiumAccess = hasPremium || Boolean((premiumStatus as any)?.is_on_trial) || hasStudentTrial || optimisticPremium;

  if (!user || (user.role !== "creator" && user.role !== "student") || userHasPremiumAccess) {
    return <>{children}</>;
  }

  
  const isCreatorMainPage =
    currentPath === "/creator" || currentPath === "/creator/";

  
  

  
  if (fallback) {
    return <>{fallback}</>;
  }

  
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
