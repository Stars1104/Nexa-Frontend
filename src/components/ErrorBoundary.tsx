import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { isTranslationError, reloadWithoutTranslation, isTranslationActive } from '../utils/translationUtils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    
    this.setState({ error, errorInfo });
    
    
    
  }

  componentDidMount() {
    
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Rejeição de promessa não tratada:', event.reason);
    
    
    if (event.reason?.code === 403 || event.reason?.status === 403) {
      this.setState({
        hasError: true,
        error: new Error('Acesso negado. Você não tem permissão para realizar esta ação.')
      });
      event.preventDefault(); 
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const is403Error = this.state.error?.message?.includes('403') || 
                        this.state.error?.message?.includes('Acesso negado');
      
      const isTranslationErr = this.state.error && isTranslationError(this.state.error);
      const translationActive = isTranslationActive();

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertTitle className="text-red-800 dark:text-red-200">
                {is403Error ? 'Acesso Negado' : isTranslationErr ? 'Erro de Tradução' : 'Algo deu errado'}
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {is403Error 
                  ? 'Você não tem permissão para acessar este recurso. Verifique suas credenciais ou entre em contato com o administrador.'
                  : isTranslationErr || translationActive
                  ? 'O erro pode estar relacionado à tradução automática do navegador. Por favor, desative a tradução e recarregue a página.'
                  : 'Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte.'
                }
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex flex-col gap-2">
              {isTranslationErr || translationActive ? (
                <>
                  <Button onClick={reloadWithoutTranslation} variant="default" className="w-full">
                    Recarregar sem Tradução
                  </Button>
                  <Button onClick={this.handleReset} variant="outline" className="w-full">
                    Tentar Novamente
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={this.handleReset} variant="outline" className="w-full">
                    Tentar Novamente
                  </Button>
                  <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
                    Voltar ao Início
                  </Button>
                </>
              )}
            </div>
            
            {}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;