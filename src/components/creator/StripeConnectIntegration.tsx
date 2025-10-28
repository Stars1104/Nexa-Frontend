import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ExternalLink, CreditCard } from 'lucide-react';
import { useStripeConnect } from '../../hooks/useStripeConnect';
import { useNavigate } from 'react-router-dom';

interface StripeConnectIntegrationProps {
  className?: string;
}

export const StripeConnectIntegration: React.FC<StripeConnectIntegrationProps> = ({
  className = ''
}) => {
  const navigate = useNavigate();
  const { accountStatus, isAccountReady, needsOnboarding, getStatusMessage } = useStripeConnect();

  const handleConfigureStripe = () => {
    navigate('/creator/stripe-connect');
  };

  if (isAccountReady()) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
            Pagamentos Configurados
          </CardTitle>
          <CardDescription>
            Sua conta Stripe está ativa e pronta para receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfigureStripe}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Gerenciar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-orange-200 bg-orange-50/50`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-orange-600" />
          Configure Pagamentos
        </CardTitle>
        <CardDescription>
          {needsOnboarding() 
            ? 'Configure sua conta Stripe para receber pagamentos dos seus trabalhos'
            : 'Sua conta Stripe precisa de configuração adicional'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {getStatusMessage()}
          </div>
          <Button
            onClick={handleConfigureStripe}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {needsOnboarding() ? 'Configurar Agora' : 'Completar Configuração'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectIntegration;
