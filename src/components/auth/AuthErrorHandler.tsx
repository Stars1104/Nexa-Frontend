import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { isRateLimitError, getRetryAfterTime } from '../../lib/api-error-handler';

interface AuthErrorHandlerProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

export default function AuthErrorHandler({ error, onRetry, className = '' }: AuthErrorHandlerProps) {
  if (!error) return null;

  const isRateLimited = isRateLimitError(error);
  const retryAfter = getRetryAfterTime(error);
  const minutes = Math.ceil(retryAfter / 60);

  if (isRateLimited) {
    return (
      <Alert variant="destructive" className={className}>
        <Clock className="h-4 w-4" />
        <AlertTitle>Muitas tentativas</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>
            {error.config?.url?.includes('/register') 
              ? `Muitas tentativas de registro. Tente novamente em ${minutes} minuto(s).`
              : `Muitas tentativas de login. Tente novamente em ${minutes} minuto(s).`
            }
          </span>
          {onRetry && retryAfter <= 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="w-fit"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Handle other types of errors
  let title = 'Erro';
  let description = 'Ocorreu um erro inesperado. Tente novamente.';

  if (error.response?.status === 400) {
    title = 'Dados inválidos';
    description = error.response?.data?.message || 'Verifique as informações fornecidas.';
  } else if (error.response?.status === 401) {
    title = 'Falha na autenticação';
    description = 'Credenciais inválidas. Verifique seu email e senha.';
  } else if (error.response?.status === 422) {
    title = 'Erro de validação';
    if (error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat() as string[];
      description = errorMessages[0] || 'Verifique as informações fornecidas.';
    } else {
      description = error.response?.data?.message || 'Verifique as informações fornecidas.';
    }
  } else if (error.response?.status >= 500) {
    title = 'Erro do servidor';
    description = 'Ocorreu um erro interno. Tente novamente mais tarde.';
  } else if (error.code === 'NETWORK_ERROR') {
    title = 'Erro de conexão';
    description = 'Verifique sua conexão com a internet e tente novamente.';
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="w-fit mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
} 