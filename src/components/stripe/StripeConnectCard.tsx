import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useStripeConnect } from '../../hooks/useStripeConnect';
import { toast } from '../ui/sonner';

interface StripeConnectCardProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
  compact?: boolean;
}

export const StripeConnectCard: React.FC<StripeConnectCardProps> = ({
  onComplete,
  onError,
  className = '',
  compact = false
}) => {
  const {
    accountStatus,
    isLoading,
    error,
    loadAccountStatus,
    createAccountLink,
    isAccountReady,
    needsOnboarding,
    getStatusMessage
  } = useStripeConnect();

  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const handleCreateAccountLink = async () => {
    try {
      setIsCreatingLink(true);
      
      const accountLink = await createAccountLink();
      
      
      const newWindow = window.open(
        accountLink.url,
        'stripe-onboarding',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!newWindow) {
        throw new Error('Não foi possível abrir a janela de onboarding. Verifique se o bloqueador de pop-ups está desabilitado.');
      }

      
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          
          setTimeout(() => {
            loadAccountStatus();
            onComplete?.();
          }, 1000);
        }
      }, 1000);

      
      setTimeout(() => {
        if (!newWindow.closed) {
          newWindow.close();
          clearInterval(checkClosed);
        }
      }, 600000);

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar link de onboarding';
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingLink(false);
    }
  };

  const getStatusBadge = () => {
    if (isAccountReady()) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    if (accountStatus?.verification_status === 'pending') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <RefreshCw className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      );
    }
    if (accountStatus?.verification_status === 'restricted') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Restrito
        </Badge>
      );
    }
    return <Badge variant="outline">Não configurado</Badge>;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
                alt="Stripe" 
                className="w-5 h-5"
              />
              <div>
                <p className="text-sm font-medium">Stripe Connect</p>
                <p className="text-xs text-muted-foreground">{getStatusMessage()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {needsOnboarding() && (
                <Button
                  size="sm"
                  onClick={handleCreateAccountLink}
                  disabled={isCreatingLink}
                >
                  {isCreatingLink ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
            alt="Stripe" 
            className="w-5 h-5"
          />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          {getStatusMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {accountStatus?.has_account && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Pagamentos:</span>
              <Badge variant={accountStatus.charges_enabled ? "default" : "secondary"}>
                {accountStatus.charges_enabled ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Saques:</span>
              <Badge variant={accountStatus.payouts_enabled ? "default" : "secondary"}>
                {accountStatus.payouts_enabled ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {needsOnboarding() ? (
            <Button 
              onClick={handleCreateAccountLink}
              disabled={isCreatingLink}
              className="flex-1"
            >
              {isCreatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Abrindo...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {accountStatus?.has_account ? 'Completar Configuração' : 'Conectar Conta'}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateAccountLink}
              disabled={isCreatingLink}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Gerenciar Conta
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={loadAccountStatus}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectCard;
