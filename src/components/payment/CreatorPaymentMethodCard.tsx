import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { hiringApi } from '@/api/hiring';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodCard {
  id: string;
  name: string;
  description?: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  stripe_payment_method_id?: string;
}

const CreatorPaymentMethodCard: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethod();
    
    
    const paymentMethodParam = searchParams.get('payment_method');
    const sessionId = searchParams.get('session_id');
    
    
    
    if (paymentMethodParam === 'connected' && sessionId) {
      
      handleCheckoutSuccess(sessionId);
    } else if (sessionId && !paymentMethodParam) {
      
      
      handleCheckoutSuccess(sessionId);
    }
    
  }, [searchParams]);

  const handleCheckoutSuccess = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/freelancer/stripe-payment-method-checkout-success', {
        session_id: sessionId,
      });
      
      if (response.data.success) {
        
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('payment_method');
        newSearchParams.delete('session_id');
        setSearchParams(newSearchParams, { replace: true });
        
        
        await loadPaymentMethod();
        
        toast({
          title: 'Sucesso',
          description: 'Método de pagamento conectado com sucesso!',
        });
      } else {
        throw new Error(response.data.message || 'Falha ao conectar método de pagamento');
      }
    } catch (error: any) {
      console.error('Error handling checkout success:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 
                     error.message || 
                     'Erro ao processar método de pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethod = async () => {
    try {
      setLoading(true);
      const response = await hiringApi.getWithdrawalMethods();
      
      if (response.data && Array.isArray(response.data)) {
        
        const stripeCardMethod = response.data.find(
          (method: any) => method.id === 'stripe_card' || method.stripe_payment_method_id
        );
        
        if (stripeCardMethod) {
          setPaymentMethod(stripeCardMethod);
        }
      }
    } catch (error: any) {
      console.error('Error loading payment method:', error);
      
    } finally {
      setLoading(false);
    }
  };

  const formatCardBrand = (brand?: string): string => {
    if (!brand) return 'Cartão';
    const brandMap: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      jcb: 'JCB',
      diners: 'Diners Club',
    };
    return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatExpirationDate = (month?: number, year?: number): string => {
    if (!month || !year) return '';
    const formattedMonth = String(month).padStart(2, '0');
    const formattedYear = String(year).slice(-2);
    return `${formattedMonth}/${formattedYear}`;
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentMethod) {
    return null; 
  }

  return (
    <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          Método de Pagamento Cadastrado
        </CardTitle>
        <CardDescription className="text-base">
          Seu cartão está configurado e pronto para receber saques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-lg text-foreground">
                  {formatCardBrand(paymentMethod.card_brand)} •••• {paymentMethod.card_last4}
                </div>
                {paymentMethod.card_exp_month && paymentMethod.card_exp_year && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Expira em {formatExpirationDate(paymentMethod.card_exp_month, paymentMethod.card_exp_year)}
                  </div>
                )}
                {paymentMethod.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentMethod.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Ativo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorPaymentMethodCard;

