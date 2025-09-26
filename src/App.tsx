import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { PremiumProvider } from "./contexts/PremiumContext";
import { useAuthRehydration } from "./hooks/useAuthRehydration";
import { useSocket } from "./hooks/useSocket";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import { useBrowserCloseLogout } from "./hooks/useBrowserCloseLogout";
import SessionWarningModal from "./components/SessionWarningModal";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthStep from "./pages/auth/AuthStep";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Signup from "./pages/auth/CreatorSignUp";
import StudentVerify from "./pages/auth/StudentVerify";
import GoogleOAuthCallback from "./components/GoogleOAuthCallback";
import CreatorIndex from "./pages/creator/Index";
import BrandIndex from "./pages/brand/Index";
import AdminIndex from "./pages/admin";
import NotificationsPage from "./pages/Notifications";
import BankRegistrationPage from "./pages/creator/BankRegistrationPage";
import Guide from "./pages/Guide";
import Documentation from "./pages/Documentation";
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  
  // Initialize auth rehydration
  const authState = useAuthRehydration();
  
  // Initialize global socket connection for real-time notifications
  useSocket();
  
  // Initialize session timeout
  const sessionTimeout = useSessionTimeout({
    onTimeout: () => {
      console.log('Session expired - user logged out');
    },
    onWarning: () => {
      console.log('Session warning shown');
    }
  });

  // Initialize browser close logout
  useBrowserCloseLogout({
    enabled: true,
    onLogout: () => {
      console.log('User session cleared due to browser/tab close');
    }
  });

  // Set app as ready after authentication is properly initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only set app as ready if authentication rehydration is complete
      // This prevents routes from rendering before auth state is restored
      if (!authState.isRehydrating) {
        setIsAppReady(true);
      }
    }, 1000);

    // Add a timeout to prevent infinite loading
    const timeoutTimer = setTimeout(() => {
      if (!isAppReady) {
        console.warn('App - Initialization timeout, forcing ready state');
        setIsAppReady(true);
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [authState.isRehydrating, isAppReady]);

  // Show loading state while app initializes
  if (!isAppReady) {
    const message = authState.isRehydrating 
      ? 'Verificando autenticação...' 
      : loadingMessage;
      
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-2">Se o carregamento demorar, tente atualizar a página</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="nexa-ui-theme">
            <PremiumProvider>
              <TooltipProvider>
                <Sonner />
                {/* <DebugUserState /> */}
                <BrowserRouter>
                  {/* Session Warning Modal */}
                  <SessionWarningModal
                    isOpen={sessionTimeout.isWarningShown}
                    remainingMinutes={sessionTimeout.remainingMinutes}
                    onExtendSession={sessionTimeout.onExtendSession}
                    onLogout={sessionTimeout.onLogout}
                  />
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthStep />} />
                  <Route path="/auth/login" element={<Signup />} />
                  <Route path="/auth/signup" element={<Signup />} />
                  <Route path="/signup/:role" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
                  <Route path="/student-verify" element={
                    <ProtectedRoute allowedRoles={['creator', 'student']}>
                      <StudentVerify />
                    </ProtectedRoute>
                  } />
                  <Route path="/creator" element={
                    <ProtectedRoute allowedRoles={['creator', 'student']}>
                      <CreatorIndex />
                    </ProtectedRoute>
                  } />
                  <Route path="/creator/subscription" element={
                    <ProtectedRoute allowedRoles={['creator', 'student']}>
                      <CreatorIndex />
                    </ProtectedRoute>
                  } />
                  <Route path="/creator/bank-registration" element={
                    <ProtectedRoute allowedRoles={['creator', 'student']}>
                      <BankRegistrationPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/brand/*" element={
                    <ProtectedRoute allowedRoles={['brand']}>
                      <BrandIndex />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminIndex />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  } />
                  
                          {/* Guide route - accessible to everyone */}
        <Route path="/guides" element={<Guide />} />
        
        {/* Documentation route - accessible to everyone */}
        <Route path="/docs" element={<Documentation />} />
        <Route path="/docs/:section" element={<Documentation />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
            </PremiumProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
