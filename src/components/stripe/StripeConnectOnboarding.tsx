import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw, CreditCard, Building2 } from 'lucide-react';
import { stripeApi, StripeAccountStatus } from '../../api/stripe';
import { toast } from '../ui/sonner';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  onComplete,
  onError,
  className = ''
}) => {
  const navigate = useNavigate()
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load account status on component mount
  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await stripeApi.getAccountStatus();
      setAccountStatus(status);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar status da conta Stripe';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccountLink = async () => {
    try {
      setIsCreatingLink(true);
      setError(null);
      
      const accountLink = await stripeApi.createAccountLink();
      console.log(accountLink)
      
      // Open Stripe onboarding in a new window
      const newWindow = window.open(
        accountLink.url,
        'stripe-onboarding',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!newWindow) {
        throw new Error('Não foi possível abrir a janela de onboarding. Verifique se o bloqueador de pop-ups está desabilitado.');
      }

      // Monitor the popup window
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          // Reload account status after popup closes
          setTimeout(() => {
            loadAccountStatus();
            onComplete?.();
          }, 1000);
        }
      }, 1000);

      // Auto-close after 10 minutes if still open
      setTimeout(() => {
        if (!newWindow.closed) {
          newWindow.close();
          clearInterval(checkClosed);
        }
      }, 600000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar link de onboarding';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingLink(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'enabled':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'restricted':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Restrito
          </Badge>
        );
      case 'disabled':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desabilitado
          </Badge>
        );
      default:
        return <Badge variant="outline">Não configurado</Badge>;
    }
  };

  const getRequirementsText = () => {
    if (!accountStatus?.requirements) return null;
    
    const { currently_due, eventually_due, past_due, pending_verification } = accountStatus.requirements;
    
    if (past_due.length > 0) {
      return `Ação necessária: ${past_due.join(', ')}`;
    }
    if (currently_due.length > 0) {
      return `Pendente: ${currently_due.join(', ')}`;
    }
    if (pending_verification.length > 0) {
      return `Aguardando verificação: ${pending_verification.join(', ')}`;
    }
    if (eventually_due.length > 0) {
      return `Futuro: ${eventually_due.join(', ')}`;
    }
    
    return 'Conta configurada com sucesso!';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando status da conta Stripe...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {imageError ? (
            <div className="w-6 h-6 rounded bg-[#635bff] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          ) : (
            <img 
              src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
              alt="Stripe" 
              className="w-6 h-6"
              onError={() => setImageError(true)}
            />
          )}
          Configuração Stripe Connect
        </CardTitle>
        <CardDescription>
          Configure sua conta Stripe para receber pagamentos de forma segura
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {accountStatus?.has_account ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Conta:</span>
              {getStatusBadge(accountStatus.verification_status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

            {accountStatus.requirements && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getRequirementsText()}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
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
                    {accountStatus.verification_status === 'enabled' ? 'Gerenciar Conta' : 'Completar Configuração'}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={loadAccountStatus}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#635bff] to-[#7c3aed] rounded-full flex items-center justify-center shadow-lg">
              {imageError ? (
                <Building2 className="w-10 h-10 text-white" />
              ) : (
                <img 
                  src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
                  alt="Stripe" 
                  className="w-10 h-10"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Conecte sua conta Stripe</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Para receber pagamentos, você precisa conectar sua conta Stripe. 
                O processo é rápido e seguro.
              </p>
            </div>

            <Button 
              onClick={handleCreateAccountLink}
              disabled={isCreatingLink}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isCreatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Conectar Conta Stripe
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Seus dados são protegidos com criptografia de nível bancário</p>
          <p>• Você pode desconectar sua conta a qualquer momento</p>
          <p>• Suporte 24/7 disponível através do Stripe</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectOnboarding;
