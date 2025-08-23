import { useState, useEffect } from 'react';
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

export const useAdvancedComponentNavigation = (options: UseAdvancedComponentNavigationOptions) => {
  const { defaultComponent, urlParamName = 'component', additionalParams = {} } = options;
  const navigate = useNavigate();
  const location = useLocation();
  
  const [component, setComponent] = useState<ComponentType>(defaultComponent);
  const [isInitialized, setIsInitialized] = useState(false);

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
        return componentParam;
      }
    } catch (error) {
      console.warn('Error parsing component from URL:', error);
      return defaultComponent;
    }
  };

  // Sync component state with URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const parsedComponent = parseComponentFromURL(searchParams);
    setComponent(parsedComponent);
    
    // Mark as initialized after first URL sync
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [location.search, urlParamName, defaultComponent, isInitialized]);

  // Enhanced setComponent that updates URL
  const handleComponentChange = (newComponent: ComponentType) => {
    setComponent(newComponent);
    
    // Update URL to reflect component change
    const searchParams = new URLSearchParams();
    
    if (typeof newComponent === "string") {
      searchParams.set(urlParamName, newComponent);
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
    
    // Never use replace: true for component changes
    // This ensures each component change adds to browser history
    // so the back button can navigate between components
    navigate(`?${searchParams.toString()}`, { replace: false });
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(location.search);
      const parsedComponent = parseComponentFromURL(searchParams);
      setComponent(parsedComponent);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.search, urlParamName, defaultComponent, isInitialized]);

  return {
    component,
    setComponent: handleComponentChange,
    // Also provide the original setComponent for cases where you don't want URL updates
    setComponentSilent: setComponent
  };
};

export default useAdvancedComponentNavigation; 