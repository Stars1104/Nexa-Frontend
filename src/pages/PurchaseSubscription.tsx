/**
 * PurchaseSubscription Page
 * 
 * This page handles subscription purchase with Stripe integration.
 * 
 * Backend API Routes:
 * - POST /api/payment/subscription - Create subscription with Stripe
 *   Required: { subscription_plan_id, payment_method_id }
 * 
 * Frontend API (imported from '../api/payment'):
 * - paymentApi.processSubscription({ subscription_plan_id, payment_method_id })
 * 
 * TODO for Full Stripe Integration:
 * 1. Add Stripe Elements Provider wrapper in App.tsx or main.tsx
 * 2. Import useStripe, useElements, CardElement from "@stripe/react-stripe-js"
 * 3. Add card input form using CardElement
 * 4. Create payment method before calling handlePurchase
 * 5. Implement actual payment flow (see handlePurchase TODOs)
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { paymentApi } from "../api/payment";
import { useAppDispatch } from "../store/hooks";
import { checkAuthStatus, updateUser } from "../store/slices/authSlice";
import { fetchUserProfile } from "../store/thunks/userThunks";
import { apiClient } from "../services/apiClient";
import { getAuthToken, dispatchPremiumStatusUpdate } from "../utils/browserUtils";
import { useAppSelector } from "../store/hooks";
import { Loader2, ArrowLeft, CreditCard, Shield, CheckCircle2 } from "lucide-react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export default function PurchaseSubscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  
  const planId = searchParams.get('planId');

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoadingPlan(true);
      const plans = await apiClient.get('/subscription/plans');
      
      if (plans.data?.data && Array.isArray(plans.data.data)) {
        const selected = plans.data.data.find((p: any) => p.id.toString() === planId);
        
        if (selected) {
          setPlan(selected);
        } else {
          toast({
            title: "Plano não encontrado",
            description: "O plano selecionado não existe",
            variant: "destructive"
          });
          navigate('/creator/subscription');
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o plano",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const handlePurchase = async () => {
    if (!plan) return;
    if (!stripe || !elements) {
      toast({
        title: "Erro de configuração",
        description: "Stripe não está carregado. Aguarde um momento e tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setCardError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Login necessário",
          description: "Faça login para prosseguir",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setCardError("Por favor, preencha os dados do cartão");
        setIsLoading(false);
        return;
      }

      // Create PaymentMethod with Stripe
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        setCardError(pmError.message || "Erro ao processar cartão");
        setIsLoading(false);
        return;
      }

      if (!paymentMethod) {
        setCardError("Não foi possível criar o método de pagamento");
        setIsLoading(false);
        return;
      }

      // Call backend API to create subscription
      const response = await paymentApi.processSubscription({
        subscription_plan_id: plan.id,
        payment_method_id: paymentMethod.id,
      });

      if (response.success) {
        await handleSuccess();
      } else {
        throw new Error(response.message || "Falha ao processar assinatura");
      }

    } catch (err: any) {
      console.error("Erro no pagamento:", err);
      toast({
        title: "Falha no pagamento",
        description: err.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async () => {
    dispatchPremiumStatusUpdate();
    dispatch(updateUser({ has_premium: true }));

    try {
      const userResponse = await apiClient.get("/user");
      dispatch(updateUser({ ...userResponse.data }));
      await dispatch(checkAuthStatus());
      await dispatch(fetchUserProfile());
      dispatchPremiumStatusUpdate();
      
      toast({
        title: "🎉 Assinatura Ativada!",
        description: "A assinatura premium está ativa!"
      });
      
      navigate('/creator/subscription');
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário:", err);
      toast({
        title: "Aviso",
        description: "Assinatura processada, mas houve problema ao atualizar dados.",
        variant: "destructive"
      });
    }
  };

  if (loadingPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6] dark:bg-[#18181b]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
          <p className="text-muted-foreground">Carregando plano...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6] dark:bg-[#18181b]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Plano não encontrado
            </p>
            <Button onClick={() => navigate('/creator/subscription')} className="w-full">
              Voltar para Assinaturas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] dark:bg-[#18181b] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/creator/subscription')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Finalizar Assinatura</h1>
          <p className="text-muted-foreground mt-2">
            Complete seu pagamento para ativar o plano {plan.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Details */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.description || 'Descrição não disponível'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        R$ {typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : '0,00'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.duration_months === 1 
                          ? 'por mês' 
                          : `por ${plan.duration_months || 1} meses${typeof plan.monthly_price === 'number' ? ` (R$ ${plan.monthly_price.toFixed(2).replace('.', ',')}/mês)` : ''}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Features */}
                  {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold mb-2 text-foreground">
                        Benefícios incluídos:
                      </p>
                      <ul className="space-y-2">
                        {plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg text-foreground">Total</p>
                      {plan.duration_months && plan.duration_months > 1 && typeof plan.monthly_price === 'number' && (
                        <p className="text-sm text-muted-foreground">
                          (R$ {plan.monthly_price.toFixed(2).replace('.', ',')}/mês)
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      R$ {typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : '0,00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Info */}
            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
                <CardDescription>
                  O pagamento será processado de forma segura através do Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                        Pagamento Seguro
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Suas informações de pagamento são criptografadas e processadas de forma segura.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Finalizar Pagamento</CardTitle>
                <CardDescription>
                  Complete o pagamento para ativar sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Card Input */}
                  <div className="space-y-2">
                    <Label htmlFor="card-element">Dados do Cartão</Label>
                    <div className="p-4 border rounded-lg bg-background">
                      <CardElement
                        id="card-element"
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                          hidePostalCode: true,
                        }}
                        onChange={(event) => {
                          setCardError(event.error ? event.error.message : null);
                        }}
                      />
                    </div>
                    {cardError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{cardError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={isLoading || !stripe}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Assinar Agora
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Ao clicar em "Assinar Agora", você concorda com nossos termos de serviço.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

