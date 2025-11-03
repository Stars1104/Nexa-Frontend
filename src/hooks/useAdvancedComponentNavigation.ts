import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ComponentObject {
  name: string;
  campaign?: any;
  creatorId?: string;
  [key: string]: any;
}

type ComponentType = string | ComponentObject;

interface UseAdvancedComponentNavigationOptions {
  defaultComponent: ComponentType;
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
  
  // Brand components - Fix the mapping to use the correct URL format
  'Minhas+campanhas': 'Minhas campanhas',
  'brand-profile': 'Meu perfil',
  'Nova+campanha': 'Nova campanha',
  'create-campaign': 'Nova campanha',
  'payments': 'Pagamentos',
  'brand-notifications': 'Notificações',
  'creator-profile': 'Perfil do Criador',
  'brand-guide': 'Guia da Plataforma',
  'Gerenciar+Campanhas': 'Gerenciar Campanhas',
  
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

export const useAdvancedComponentNavigation = (options: UseAdvancedComponentNavigationOptions) => {
  const { defaultComponent, urlParamName = 'component', additionalParams = {} } = options;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [component, setComponent] = useState<ComponentType>(defaultComponent);
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

  // Helper function to parse component from URL
  const parseComponentFromURL = (searchParams: URLSearchParams): ComponentType => {
    const componentParam = searchParams.get(urlParamName);
    
    if (!componentParam) return defaultComponent;
    
    // Check if this is a complex component that needs additional params
    const campaignId = searchParams.get('campaignId');
    const creatorId = searchParams.get('creatorId');
    
    try {
      if (componentParam === "Chat" && campaignId && creatorId) {
        return {
          name: "Chat",
          campaign: { id: parseInt(campaignId) },
          creatorId: creatorId
        };
      } else if (componentParam === "Ver aplicação" && campaignId) {
        return {
          name: "Ver aplicação",
          campaign: { id: parseInt(campaignId) }
        };
      } else if (componentParam === "Ver criadores" && campaignId) {
        return {
          name: "Ver criadores",
          campaign: { id: parseInt(campaignId) }
        };
      } else if (componentParam === "Perfil do Criador" && creatorId) {
        return {
          name: "Perfil do Criador",
          creatorId: creatorId
        };
      } else {
        // Convert URL name to display name for string components
        return toDisplayName(componentParam);
      }
    } catch (error) {
      console.warn('Error parsing component from URL:', error);
      return defaultComponent;
    }
  };

  // Sync component state with URL changes
  useEffect(() => {
    // Skip if we're currently navigating to avoid loops
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const parsedComponent = parseComponentFromURL(searchParams);
    
    // Only update if different to prevent loops
    setComponent((prev) => {
      const prevStr = typeof prev === 'string' ? prev : prev.name;
      const newStr = typeof parsedComponent === 'string' ? parsedComponent : parsedComponent.name;
      if (prevStr !== newStr || JSON.stringify(prev) !== JSON.stringify(parsedComponent)) {
        return parsedComponent;
      }
      return prev;
    });
    
    // Mark as initialized after first URL sync
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [location.search, urlParamName, defaultComponent]);

  // Enhanced setComponent that updates URL
  const handleComponentChange = (newComponent: ComponentType) => {
    // Update component state
    setComponent(newComponent);
    
    // Build new URL
    const searchParams = new URLSearchParams();
    
    if (typeof newComponent === "string") {
      // Convert display name to URL name
      const urlName = toUrlName(newComponent);
      searchParams.set(urlParamName, urlName);
    } else {
      searchParams.set(urlParamName, newComponent.name);
      if (newComponent.campaign?.id) {
        searchParams.set('campaignId', newComponent.campaign.id.toString());
      }
      if (newComponent.creatorId) {
        searchParams.set('creatorId', newComponent.creatorId);
      }
      
      // Add any other custom properties
      Object.entries(newComponent).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'campaign' && key !== 'creatorId' && value !== null && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });
    }
    
    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    const newUrl = `?${searchParams.toString()}`;
    
    // Check if URL is already correct to prevent unnecessary navigation
    const currentUrl = location.search || '';
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
      const parsedComponent = parseComponentFromURL(searchParams);
      
      // Only update if different to prevent loops
      setComponent((prev) => {
        const prevStr = typeof prev === 'string' ? prev : prev.name;
        const newStr = typeof parsedComponent === 'string' ? parsedComponent : parsedComponent.name;
        if (prevStr !== newStr || JSON.stringify(prev) !== JSON.stringify(parsedComponent)) {
          return parsedComponent;
        }
        return prev;
      });
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

export default useAdvancedComponentNavigation; 