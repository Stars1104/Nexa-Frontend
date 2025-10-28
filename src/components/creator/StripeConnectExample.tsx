import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useStripeConnect } from '../../hooks/useStripeConnect'
import { useNavigate } from 'react-router-dom';

/**
 * Example component showing how to integrate Stripe Connect status
 * into existing creator dashboard components
 */
export const StripeConnectExample: React.FC = () => {
  const navigate = useNavigate();
  const { 
    accountStatus, 
    isLoading, 
    isAccountReady, 
    needsOnboarding, 
    getStatusMessage 
  } = useStripeConnect();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando status do Stripe...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <img 
              src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
              alt="Stripe" 
              className="w-5 h-5"
            />
            Status de Pagamentos
          </span>
          <Badge 
            variant={isAccountReady() ? "default" : "secondary"}
            className={isAccountReady() ? "bg-green-100 text-green-800" : ""}
          >
            {isAccountReady() ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Configuração Necessária
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          {getStatusMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
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
          
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/creator/stripe-connect')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {needsOnboarding() ? 'Configurar Stripe' : 'Gerenciar Conta'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectExample;
