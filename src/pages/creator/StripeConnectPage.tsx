import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CreditCard, Zap, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import StripeConnectOnboarding from '../../components/stripe/StripeConnectOnboarding';
import StripeConnectTest from '../../components/stripe/StripeConnectTest';
import { toast } from '../../components/ui/sonner';
import { apiClient } from '../../services/apiClient';

const StripeConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = () => {
    toast.success('Conta Stripe configurada com sucesso!');
    navigate('/creator');
  };

  const handleError = (error: string) => {
    toast.error(`Erro na configuração: ${error}`);
  };

  
  const handleConnectPaymentMethod = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/freelancer/stripe-payment-method-checkout');
      
      if (response.data.success && response.data.url) {
        
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data.message || 'Erro ao criar sessão de checkout');
      }
    } catch (error: any) {
      console.error('Error connecting payment method:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Erro ao conectar método de pagamento. Tente novamente.'
      );
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Segurança Máxima',
      description: 'Criptografia de nível bancário e conformidade PCI DSS'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Pagamentos Globais',
      description: 'Aceite pagamentos de qualquer lugar do mundo'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Processamento Rápido',
      description: 'Receba pagamentos em até 2 dias úteis'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Configuração Stripe Connect - Nexa</title>
        <meta name="description" content="Configure sua conta Stripe para receber pagamentos de forma segura" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Configuração de Pagamentos</h1>
                <p className="text-sm text-muted-foreground">
                  Configure sua conta Stripe para receber pagamentos
                </p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img 
                    src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-280x280.png" 
                    alt="Stripe" 
                    className="w-6 h-6"
                  />
                  Por que usar o Stripe?
                </CardTitle>
                <CardDescription>
                  O Stripe é a plataforma de pagamentos mais confiável do mundo, 
                  usada por milhões de empresas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {}
            <StripeConnectTest />

            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Método de Pagamento para Saques
                </CardTitle>
                <CardDescription>
                  Conecte um cartão de crédito ou débito para receber seus saques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleConnectPaymentMethod}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Conectar Método de Pagamento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {}
            <StripeConnectOnboarding
              onComplete={handleComplete}
              onError={handleError}
            />

            {}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Seus dados estão seguros:</strong> O Stripe é certificado PCI DSS Level 1, 
                o mais alto nível de segurança para processamento de pagamentos. 
                Suas informações bancárias nunca passam pelos nossos servidores.
              </AlertDescription>
            </Alert>

            {}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de ajuda?</CardTitle>
                <CardDescription>
                  Temos recursos para te ajudar com a configuração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Documentação Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      Guias completos sobre como configurar sua conta
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://stripe.com/docs/connect', '_blank')}
                    >
                      Ver Documentação
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Suporte Nexa</h4>
                    <p className="text-sm text-muted-foreground">
                      Nossa equipe está aqui para ajudar
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/creator')}
                    >
                      Entrar em Contato
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default StripeConnectPage;
