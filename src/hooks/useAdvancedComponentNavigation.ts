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


const COMPONENT_MAPPING: Record<string, string> = {
  
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
  
  
  'Minhas+campanhas': 'Minhas campanhas',
  'brand-profile': 'Meu perfil',
  'Nova+campanha': 'Nova campanha',
  'create-campaign': 'Nova campanha',
  'payments': 'Pagamentos',
  'brand-notifications': 'Notificações',
  'creator-profile': 'Perfil do Criador',
  'brand-guide': 'Guia da Plataforma',
  'Gerenciar+Campanhas': 'Gerenciar Campanhas',
  
  
  'admin-dashboard': 'Painel',
  'pending-campaigns': 'Campanhas Pendentes',
  'all-campaigns': 'Todas as Campanhas',
  'users': 'Usuários',
  'brand-rankings': 'Rankings das Marcas',
  'withdrawal-verification': 'Verificação de Saques',
  'admin-guide': 'Guia para'
};


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

  
  const toUrlName = (displayName: string): string => {
    return REVERSE_COMPONENT_MAPPING[displayName] || displayName;
  };

  
  const toDisplayName = (urlName: string): string => {
    return COMPONENT_MAPPING[urlName] || urlName;
  };

  
  const parseComponentFromURL = (searchParams: URLSearchParams): ComponentType => {
    const componentParam = searchParams.get(urlParamName);
    
    if (!componentParam) return defaultComponent;
    
    
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
        
        return toDisplayName(componentParam);
      }
    } catch (error) {
      console.warn('Error parsing component from URL:', error);
      return defaultComponent;
    }
  };

  
  useEffect(() => {
    
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const parsedComponent = parseComponentFromURL(searchParams);
    
    
    setComponent((prev) => {
      const prevStr = typeof prev === 'string' ? prev : prev.name;
      const newStr = typeof parsedComponent === 'string' ? parsedComponent : parsedComponent.name;
      if (prevStr !== newStr || JSON.stringify(prev) !== JSON.stringify(parsedComponent)) {
        return parsedComponent;
      }
      return prev;
    });
    
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [location.search, urlParamName, defaultComponent]);

  
  const handleComponentChange = (newComponent: ComponentType) => {
    
    setComponent(newComponent);
    
    
    const searchParams = new URLSearchParams();
    
    if (typeof newComponent === "string") {
      
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
      
      
      Object.entries(newComponent).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'campaign' && key !== 'creatorId' && value !== null && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });
    }
    
    
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    const newUrl = `?${searchParams.toString()}`;
    
    
    const currentUrl = location.search || '';
    if (currentUrl === newUrl || currentUrl === `?${newUrl.substring(1)}`) {
      return; 
    }
    
    
    isNavigatingRef.current = true;
    
    
    navigate(newUrl, { replace: false });
  };

  
  useEffect(() => {
    const handlePopState = () => {
      
      if (isNavigatingRef.current) {
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const parsedComponent = parseComponentFromURL(searchParams);
      
      
      setComponent((prev) => {
        const prevStr = typeof prev === 'string' ? prev : prev.name;
        const newStr = typeof parsedComponent === 'string' ? parsedComponent : parsedComponent.name;
        if (prevStr !== newStr || JSON.stringify(prev) !== JSON.stringify(parsedComponent)) {
          return parsedComponent;
        }
        return prev;
      });
    };

    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.search, urlParamName, defaultComponent]);

  return {
    component,
    setComponent: handleComponentChange,
    
    setComponentSilent: setComponent
  };
};

export default useAdvancedComponentNavigation; 