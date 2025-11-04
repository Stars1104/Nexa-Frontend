import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StripeConnectOnboarding from '@/components/stripe/StripeConnectOnboarding';

const PaymentMethods = () => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuração de Pagamento</h1>
          <p className="text-muted-foreground">
            Conecte sua conta Stripe para receber pagamentos de contratos com marcas de forma segura
          </p>
        </div>

        {/* Stripe Connect Account Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary" />
              Receber Pagamentos de Contratos
            </CardTitle>
            <CardDescription className="text-base">
              Conecte sua conta Stripe para receber pagamentos de marcas de forma segura e rápida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Por que preciso conectar minha conta Stripe?</p>
                  <p>
                    Para receber pagamentos de contratos com marcas, você precisa ter uma conta Stripe Connect ativa. 
                    O processo é rápido, seguro e permite que você receba pagamentos diretamente na sua conta.
                  </p>
                </div>
              </div>
            </div>
            <StripeConnectOnboarding 
              onComplete={() => {
                toast({
                  title: 'Sucesso',
                  description: 'Conta Stripe conectada com sucesso! Agora você pode receber pagamentos de contratos.',
                });
              }}
              onError={(error) => {
                toast({
                  title: 'Erro',
                  description: error,
                  variant: 'destructive',
                });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethods;
