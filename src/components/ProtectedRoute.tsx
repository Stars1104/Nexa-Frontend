import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('creator' | 'brand' | 'admin' | 'student')[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}) => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If not authenticated, no token, or no user, redirect to auth page
  if (!isAuthenticated || !token || !user?.id) {
    // Check if there's a token in localStorage that might be expired
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Clear expired token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
    }
    // Store the current location so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user exists and role-based access is specified
  if (user && allowedRoles && allowedRoles.length > 0) {
    // Check if user's role is allowed
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user's role
      const defaultDashboard = getDefaultDashboard(user.role);
      return <Navigate to={redirectTo || defaultDashboard} replace />;
    }
  }

  // If authenticated and role check passes (or no role check required), render the protected component
  return <>{children}</>;
};

// Helper function to get default dashboard based on user role
const getDefaultDashboard = (userRole: string): string => {
  switch (userRole) {
    case "creator":
      return "/creator";
    case "brand":
      return "/brand";
    case "admin":
      return "/admin";
    case "student":
      return "/creator"; // Students are redirected to creator dashboard after verification
    default:
      return "/creator";
  }
};

export default ProtectedRoute; 