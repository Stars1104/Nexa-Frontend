import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { cleanupTranslationArtifacts, isTranslationActive } from '../utils/translationUtils';

interface UsePostLoginNavigationOptions {
  dashboardPath: string;
  defaultComponent?: string;
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
  'admin-guide': 'Guia para',
  'admin-notifications': 'Notificações'
};


const REVERSE_COMPONENT_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(COMPONENT_MAPPING).map(([key, value]) => [value, key])
);

export const usePostLoginNavigation = (options: UsePostLoginNavigationOptions) => {
  const { dashboardPath, defaultComponent } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const hasNavigatedRef = useRef(false);

  
  const toUrlName = (displayName: string): string => {
    return REVERSE_COMPONENT_MAPPING[displayName] || displayName;
  };

  useEffect(() => {
    
    if (isAuthenticated && user && location.pathname === dashboardPath && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      
      
      if (isTranslationActive()) {
        cleanupTranslationArtifacts();
      }
      
      
      if (defaultComponent && !location.search.includes('component=')) {
        const searchParams = new URLSearchParams();
        
        
        const urlName = toUrlName(defaultComponent);
        searchParams.set('component', urlName);

        
        navigate(`?${searchParams.toString()}`, { replace: true });
      } 
    }
  }, [isAuthenticated, user, location.pathname, location.search, dashboardPath, defaultComponent, navigate]);

  
  useEffect(() => {
    if (!isAuthenticated) {
      hasNavigatedRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
};

export default usePostLoginNavigation; 