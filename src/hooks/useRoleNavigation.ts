import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { cleanupTranslationArtifacts, isTranslationActive } from '../utils/translationUtils';

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
      // Clean up translation artifacts before navigation to prevent errors
      if (isTranslationActive()) {
        cleanupTranslationArtifacts();
      }
      const dashboard = getDefaultDashboard(userRole);
      navigate(dashboard, { replace: options?.replace ?? false });
    }
  };

  const navigateToStudentVerification = () => {
    // Clean up translation artifacts before navigation
    if (isTranslationActive()) {
      cleanupTranslationArtifacts();
    }
    navigate("/student-verify", { replace: true });
  };

  const navigateToSubscription = () => {
    // Don't replace for subscription navigation to allow back button to work
    // Navigate to creator page with subscription component active
    navigate("/creator?component=subscription", { replace: false });
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