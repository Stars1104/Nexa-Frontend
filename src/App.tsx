import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { useAuthRehydration } from "./hooks/useAuthRehydration";
import { useSocket } from "./hooks/useSocket";
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

const queryClient = new QueryClient();

const App = () => {
  // Initialize auth rehydration
  useAuthRehydration();
  
  // Initialize global socket connection for real-time notifications
  useSocket();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="nexa-ui-theme">
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
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
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
