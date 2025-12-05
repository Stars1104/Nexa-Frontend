import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseComponentNavigationOptions {
  defaultComponent: string;
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
  'guide': 'Guia da Plataforma',
  
  
  'Minhas+campanhas': 'Minhas campanhas',
  'brand-profile': 'Meu perfil',
  'create-campaign': 'Nova campanha',
  'payments': 'Pagamentos',
  'brand-notifications': 'Notificações',
  'creator-profile': 'Perfil do Criador',
  'brand-guide': 'Guia da Plataforma',
  
  
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

export const useComponentNavigation = (options: UseComponentNavigationOptions) => {
  const { defaultComponent, urlParamName = 'component', additionalParams = {} } = options;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [component, setComponent] = useState<string>(defaultComponent);
  const isInitializedRef = useRef(false);
  const isNavigatingRef = useRef(false);

  
  const toUrlName = (displayName: string): string => {
    return REVERSE_COMPONENT_MAPPING[displayName] || displayName;
  };

  
  const toDisplayName = (urlName: string): string => {
    return COMPONENT_MAPPING[urlName] || urlName;
  };

  
  useEffect(() => {
    
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const componentParam = searchParams.get(urlParamName);
    
    if (componentParam) {
      
      const displayName = toDisplayName(componentParam);
      
      setComponent((prev) => {
        if (prev !== displayName) {
          return displayName;
        }
        return prev;
      });
    } else if (!isInitializedRef.current) {
      
      setComponent(defaultComponent);
    }
    
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [location.search, urlParamName, defaultComponent]);

  
  const handleComponentChange = (newComponent: string, additionalState?: Record<string, any>) => {
    
    setComponent(newComponent);
    
    
    const searchParams = new URLSearchParams();
    
    
    const urlName = toUrlName(newComponent);
    searchParams.set(urlParamName, urlName);
    
    
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    
    
    if (additionalState) {
      Object.entries(additionalState).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });
    }
    
    const newUrl = `?${searchParams.toString()}`;
    
    
    const currentUrl = location.search || '';
    const currentPath = location.pathname;
    
    
    
    
    const isBasePath = currentPath === '/creator' || currentPath === '/creator/' ||
                       currentPath === '/brand' || currentPath === '/brand/' ||
                       currentPath === '/admin' || currentPath === '/admin/';
    
    if (!isBasePath) {
      
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
      
      navigate(`${basePath}${newUrl}`, { replace: true });
      return;
    }
    
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
      const componentParam = searchParams.get(urlParamName);
      
      if (componentParam) {
        
        const displayName = toDisplayName(componentParam);
        setComponent((prev) => {
          if (prev !== displayName) {
            return displayName;
          }
          return prev;
        });
      } else {
        
        setComponent((prev) => {
          if (prev !== defaultComponent) {
            return defaultComponent;
          }
          return prev;
        });
      }
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

export default useComponentNavigation; 