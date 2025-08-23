import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface UsePostLoginNavigationOptions {
  dashboardPath: string;
  defaultComponent?: string;
}

// Component mapping: English URL names -> Portuguese display names
const COMPONENT_MAPPING: Record<string, string> = {
  // Creator components
  'dashboard': 'Painel',
  'profile': 'Minha Conta',
  'project-detail': 'Detalhes do Projeto',
  'application': 'Minha Aplicação',
  'chat': 'Chat',
  'portfolio': 'Portfólio',
  'balance': 'Saldo e Saques',
  'notifications': 'Notificações',
  'subscription': 'Assinatura',
  'payment-history': 'Histórico de Pagamentos',
  'bank-registration': 'Cadastro Bancário',
  'guide': 'Guia da Plataforma',
  
  // Brand components - Fix the mapping to use the correct URL format
  'Minhas+campanhas': 'Minhas campanhas',
  'brand-profile': 'Meu perfil',
  'create-campaign': 'Nova campanha',
  'payments': 'Pagamentos',
  'brand-notifications': 'Notificações',
  'creator-profile': 'Perfil do Criador',
  'brand-guide': 'Guia da Plataforma',
  
  // Admin components
  'admin-dashboard': 'Painel',
  'pending-campaigns': 'Campanhas Pendentes',
  'all-campaigns': 'Todas as Campanhas',
  'users': 'Usuários',
  'brand-rankings': 'Rankings das Marcas',
  'withdrawal-verification': 'Verificação de Saques',
  'admin-guide': 'Guia para',
  'admin-notifications': 'Notificações'
};

// Reverse mapping: Portuguese display names -> English URL names
const REVERSE_COMPONENT_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(COMPONENT_MAPPING).map(([key, value]) => [value, key])
);

export const usePostLoginNavigation = (options: UsePostLoginNavigationOptions) => {
  const { dashboardPath, defaultComponent } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const hasNavigatedRef = useRef(false);

  // Convert Portuguese display name to English URL name
  const toUrlName = (displayName: string): string => {
    return REVERSE_COMPONENT_MAPPING[displayName] || displayName;
  };

  useEffect(() => {
    // Only run this effect when user is authenticated and we're on the dashboard path
    if (isAuthenticated && user && location.pathname === dashboardPath && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      
      console.log('usePostLoginNavigation - Setting up dashboard:', {
        dashboardPath,
        defaultComponent,
        currentPath: location.pathname,
        currentSearch: location.search,
        isAuthenticated,
        userRole: user?.role
      });
      
      // If there's no component in the URL, set the default component
      if (defaultComponent && !location.search.includes('component=')) {
        const searchParams = new URLSearchParams();
        
        // Convert display name to URL name
        const urlName = toUrlName(defaultComponent);
        searchParams.set('component', urlName);
        
        console.log('usePostLoginNavigation - Setting default component:', {
          displayName: defaultComponent,
          urlName: urlName
        });
        
        // Use replace: true to replace the current URL
        // This ensures the dashboard is added to browser history
        navigate(`?${searchParams.toString()}`, { replace: true });
      } else {
        console.log('usePostLoginNavigation - Component already in URL or no default component');
      }
    }
  }, [isAuthenticated, user, location.pathname, location.search, dashboardPath, defaultComponent, navigate]);

  // Reset the flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasNavigatedRef.current = false;
      console.log('usePostLoginNavigation - User logged out, reset navigation flag');
    }
  }, [isAuthenticated]);

  return null;
};

export default usePostLoginNavigation; 