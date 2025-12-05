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

  
  if (!isAuthenticated || !token || !user?.id) {
    
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
    }
    
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  
  if (user && allowedRoles && allowedRoles.length > 0) {
    
    if (!allowedRoles.includes(user.role)) {
      
      const defaultDashboard = getDefaultDashboard(user.role);
      const target = redirectTo || defaultDashboard;
      
      if (location.pathname === target) {
        return <>{children}</>;
      }
      
      return <Navigate to={target} replace={false} />;
    }
  }

  
  return <>{children}</>;
};


const getDefaultDashboard = (userRole: string): string => {
  switch (userRole) {
    case "creator":
      return "/creator";
    case "brand":
      return "/brand";
    case "admin":
      return "/admin";
    case "student":
      return "/creator"; 
    default:
      return "/creator";
  }
};

export default ProtectedRoute; 