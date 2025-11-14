import { useState, useEffect, useRef } from 'react';
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
  'guide': 'Guia da Plataforma',
  
  // Brand components
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
  'admin-guide': 'Guia para'
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
  const isInitializedRef = useRef(false);
  const isNavigatingRef = useRef(false);

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
    // Skip if we're currently navigating to avoid loops
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const componentParam = searchParams.get(urlParamName);
    
    if (componentParam) {
      // Convert URL name to display name
      const displayName = toDisplayName(componentParam);
      // Only update if different to prevent loops
      setComponent((prev) => {
        if (prev !== displayName) {
          return displayName;
        }
        return prev;
      });
    } else if (!isInitializedRef.current) {
      // Only set default on initial load if no URL param
      setComponent(defaultComponent);
    }
    
    // Mark as initialized after first URL sync
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [location.search, urlParamName, defaultComponent]);

  // Enhanced setComponent that updates URL
  const handleComponentChange = (newComponent: string, additionalState?: Record<string, any>) => {
    // Update component state
    setComponent(newComponent);
    
    // Build new URL
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
    
    const newUrl = `?${searchParams.toString()}`;
    
    // Check if URL is already correct to prevent unnecessary navigation
    const currentUrl = location.search || '';
    const currentPath = location.pathname;
    
    // If we're on a pathname route like /creator/subscription, we need to navigate
    // to the base path with query params instead for proper component navigation
    // Check if we're NOT on a base path (creator, brand, or admin)
    const isBasePath = currentPath === '/creator' || currentPath === '/creator/' ||
                       currentPath === '/brand' || currentPath === '/brand/' ||
                       currentPath === '/admin' || currentPath === '/admin/';
    
    if (!isBasePath) {
      // Extract base path (e.g., /creator from /creator/subscription)
      let basePath = '/creator';
      if (currentPath.startsWith('/creator/')) {
        basePath = '/creator';
      } else if (currentPath.startsWith('/brand/')) {
        basePath = '/brand';
      } else if (currentPath.startsWith('/admin/')) {
        basePath = '/admin';
      } else if (currentPath === '/admin') {
        basePath = '/admin';
      }
      
      isNavigatingRef.current = true;
      // Navigate to base path with query params, replacing the pathname route
      navigate(`${basePath}${newUrl}`, { replace: true });
      return;
    }
    
    if (currentUrl === newUrl || currentUrl === `?${newUrl.substring(1)}`) {
      return; // Already at this URL, skip navigation
    }
    
    // Mark that we're navigating to prevent loop
    isNavigatingRef.current = true;
    
    // Navigate only if URL is different
    navigate(newUrl, { replace: false });
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Don't process if we're navigating programmatically
      if (isNavigatingRef.current) {
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const componentParam = searchParams.get(urlParamName);
      
      if (componentParam) {
        // Convert URL name to display name
        const displayName = toDisplayName(componentParam);
        setComponent((prev) => {
          if (prev !== displayName) {
            return displayName;
          }
          return prev;
        });
      } else {
        // Default to default component if no component in URL
        setComponent((prev) => {
          if (prev !== defaultComponent) {
            return defaultComponent;
          }
          return prev;
        });
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