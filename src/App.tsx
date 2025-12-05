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
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect, lazy, Suspense } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { disableTranslation } from "./utils/translationUtils";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthStep = lazy(() => import("./pages/auth/AuthStep"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Signup = lazy(() => import("./pages/auth/CreatorSignUp"));
const StudentVerify = lazy(() => import("./pages/auth/StudentVerify"));
const PurchaseSubscription = lazy(() => import("./pages/PurchaseSubscription"));
const GoogleOAuthCallback = lazy(() => import("./components/GoogleOAuthCallback"));
const CreatorIndex = lazy(() => import("./pages/creator/Index"));
const BrandIndex = lazy(() => import("./pages/brand/Index"));
const AdminIndex = lazy(() => import("./pages/admin"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const BankRegistrationPage = lazy(() => import("./pages/creator/BankRegistrationPage"));
const StripeConnectPage = lazy(() => import("./pages/creator/StripeConnectPage"));
const Guide = lazy(() => import("./pages/Guide"));
const Documentation = lazy(() => import("./pages/Documentation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
 

const queryClient = new QueryClient();

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here");
 

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  
  useEffect(() => {
    disableTranslation();
  }, []);
  
  const authState = useAuthRehydration();
  
  useSocket();
  
  const sessionTimeout = useSessionTimeout({
    onTimeout: () => {},
    onWarning: () => {}
  });

  useBrowserCloseLogout({
    enabled: false,
    onLogout: () => {}
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authState.isRehydrating) {
        setIsAppReady(true);
      }
    }, 1000);

    const timeoutTimer = setTimeout(() => {
      if (!isAppReady) {
        console.warn('App - Initialization timeout, forcing ready state');
        setIsAppReady(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [authState.isRehydrating, isAppReady]);

  const RouteLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );

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
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="nexa-ui-theme">
            <PremiumProvider>
              <TooltipProvider>
                <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <SessionWarningModal
                    isOpen={sessionTimeout.isWarningShown}
                    remainingMinutes={sessionTimeout.remainingMinutes}
                    onExtendSession={sessionTimeout.onExtendSession}
                    onLogout={sessionTimeout.onLogout}
                  />
                  <Suspense fallback={<RouteLoading />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<AuthStep />} />
                      <Route path="/auth/login" element={<Signup />} />
                      <Route path="/auth/signup" element={<Signup />} />
                      <Route path="/signup/:role" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
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
                      <Route path="/creator/purchase-subscription" element={
                        <ProtectedRoute allowedRoles={['creator', 'student']}>
                          <Elements stripe={stripePromise}>
                            <PurchaseSubscription />
                          </Elements>
                        </ProtectedRoute>
                      } />
                      <Route path="/creator/bank-registration" element={
                        <ProtectedRoute allowedRoles={['creator', 'student']}>
                          <BankRegistrationPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/creator/stripe-connect" element={
                        <ProtectedRoute allowedRoles={['creator', 'student']}>
                          <StripeConnectPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/creator/payment-method" element={
                        <ProtectedRoute allowedRoles={['creator', 'student']}>
                          <PaymentMethods />
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
                      <Route path="/guides" element={<Guide />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
                      <Route path="/docs" element={<Documentation />} />
                      <Route path="/docs/:section" element={<Documentation />} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
              </BrowserRouter>
              </TooltipProvider>
            </PremiumProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
  );
};

export default App;
