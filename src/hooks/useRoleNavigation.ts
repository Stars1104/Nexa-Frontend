import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export const useRoleNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

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

  const navigateToRoleDashboard = (role?: string) => {
    const userRole = role || user?.role;
    if (userRole) {
      const dashboard = getDefaultDashboard(userRole);
      navigate(dashboard, { replace: true });
    }
  };

  const navigateToStudentVerification = () => {
    navigate("/student-verify", { replace: true });
  };

  const navigateToLogin = (from?: string) => {
    navigate("/auth/login", { 
      state: from ? { from: { pathname: from } } : undefined,
      replace: true 
    });
  };

  return {
    getDefaultDashboard,
    navigateToRoleDashboard,
    navigateToStudentVerification,
    navigateToLogin,
  };
}; 