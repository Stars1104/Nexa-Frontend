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

  const navigateToRoleDashboard = (role?: string, options?: { replace?: boolean }) => {
    const userRole = role || user?.role;
    if (userRole) {
      const dashboard = getDefaultDashboard(userRole);
      navigate(dashboard, { replace: options?.replace ?? false });
    }
  };

  const navigateToStudentVerification = () => {
    navigate("/student-verify", { replace: true });
  };

  const navigateToSubscription = () => {
    // Don't replace for subscription navigation to allow back button to work
    navigate("/creator", { replace: false });
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
    navigateToSubscription,
    navigateToLogin,
  };
}; 