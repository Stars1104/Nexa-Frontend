import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseComponentNavigationOptions {
  defaultComponent: string;
  urlParamName?: string;
  additionalParams?: Record<string, string>;
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
  
  // Brand components
  'campaigns': 'Minhas campanhas',
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

export const useComponentNavigation = (options: UseComponentNavigationOptions) => {
  const { defaultComponent, urlParamName = 'component', additionalParams = {} } = options;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [component, setComponent] = useState<string>(defaultComponent);
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert Portuguese display name to English URL name
  const toUrlName = (displayName: string): string => {
    return REVERSE_COMPONENT_MAPPING[displayName] || displayName;
  };

  // Convert English URL name to Portuguese display name
  const toDisplayName = (urlName: string): string => {
    return COMPONENT_MAPPING[urlName] || urlName;
  };

  // Sync component state with URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const componentParam = searchParams.get(urlParamName);
    
    if (componentParam) {
      // Convert URL name to display name
      const displayName = toDisplayName(componentParam);
      setComponent(displayName);
    }
    
    // Mark as initialized after first URL sync
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [location.search, urlParamName, isInitialized]);

  // Enhanced setComponent that updates URL
  const handleComponentChange = (newComponent: string, additionalState?: Record<string, any>) => {
    setComponent(newComponent);
    
    // Update URL to reflect component change
    const searchParams = new URLSearchParams();
    
    // Convert display name to URL name
    const urlName = toUrlName(newComponent);
    searchParams.set(urlParamName, urlName);
    
    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    // Add additional state parameters if provided
    if (additionalState) {
      Object.entries(additionalState).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });
    }
    
    // Never use replace: true for component changes
    // This ensures each component change adds to browser history
    // so the back button can navigate between components
    navigate(`?${searchParams.toString()}`, { replace: false });
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(location.search);
      const componentParam = searchParams.get(urlParamName);
      
      if (componentParam) {
        // Convert URL name to display name
        const displayName = toDisplayName(componentParam);
        setComponent(displayName);
      } else {
        // Default to default component if no component in URL
        setComponent(defaultComponent);
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.search, urlParamName, defaultComponent]);

  return {
    component,
    setComponent: handleComponentChange,
    // Also provide the original setComponent for cases where you don't want URL updates
    setComponentSilent: setComponent
  };
};

export default useComponentNavigation; 