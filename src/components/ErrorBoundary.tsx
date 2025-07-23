import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

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
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({ error, errorInfo });
    
    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  componentDidMount() {
    // Add global error handlers for uncaught promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    // Clean up global error handlers
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Check if it's a 403 error
    if (event.reason?.code === 403 || event.reason?.status === 403) {
      this.setState({
        hasError: true,
        error: new Error('Acesso negado. Você não tem permissão para realizar esta ação.')
      });
      event.preventDefault(); // Prevent the default browser behavior
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const is403Error = this.state.error?.message?.includes('403') || 
                        this.state.error?.message?.includes('Acesso negado');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertTitle className="text-red-800 dark:text-red-200">
                {is403Error ? 'Acesso Negado' : 'Algo deu errado'}
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {is403Error 
                  ? 'Você não tem permissão para acessar este recurso. Verifique suas credenciais ou entre em contato com o administrador.'
                  : 'Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte.'
                }
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Voltar ao Início
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-sm text-muted-foreground">
                <summary>Detalhes do erro (desenvolvimento)</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 