import { useState, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { paymentClient } from "../../services/apiClient";
import { useAppDispatch } from "../../store/hooks";
import { checkAuthStatus, updateUser } from "../../store/slices/authSlice";
import { fetchUserProfile } from "../../store/thunks/userThunks";
import { apiClient } from "../../services/apiClient";
import { useTheme } from "../ThemeProvider";

interface SubscriptionModalProps {
  open?: boolean;
  selectedPlan?: any;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: () => void;
}

// Checkout Form Component using Stripe Elements
const CheckoutForm = ({ selectedPlan, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [formData, setFormData] = useState({
    card_holder_name: "",
  });
  const { theme } = useTheme();
  
  // Determine the actual resolved theme
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  // Dynamic colors based on theme
  const cardElementColors = {
    textColor: isDarkMode ? "#ffffff" : "#000000",
    placeholderColor: isDarkMode ? "#9ca3af" : "#6b7280",
    invalidColor: isDarkMode ? "#ef4444" : "#dc2626",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);
    if (!stripe || !elements) {
      toast({
        title: "Erro",
        description: "Stripe não foi carregado corretamente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Elemento do cartão não encontrado");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: formData.card_holder_name.trim(),
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao criar método de pagamento");
      }

      if (!paymentMethod) {
        throw new Error("Falha ao criar método de pagamento");
      }

      console.log("paymentMethod------------->", paymentMethod);

      // Send payment method ID to your backend
      const paymentData = {
        paymentMethodId: paymentMethod.id,
        card_holder_name: formData.card_holder_name.trim(),
        subscription_plan_id: selectedPlan?.id,
      };

      const response = await paymentClient.post(
        "/payment/subscription",
        paymentData
      );

      if (response.data.success) {
        await handleSuccess();
      } else {
        throw new Error(response.data.message || "Falha no pagamento");
      }
    } catch (error: any) {
      console.error("Erro no pagamento:", error);

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        toast({
          title: "Tempo de Espera Excedido",
          description:
            "A solicitação demorou demais. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Autenticação Necessária",
          description: "Faça login para prosseguir com o pagamento",
          variant: "destructive",
        });
      } else if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors)
            .flat()
            .join(", ");
          toast({
            title: "Erro de Validação",
            description: errorMessages,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro de Validação",
            description:
              error.response?.data?.message ||
              "Verifique seus dados e tente novamente",
            variant: "destructive",
          });
        }
      } else if (error.response?.status === 403) {
        toast({
          title: "Acesso Negado",
          description:
            error.response?.data?.message ||
            "Você não tem permissão para executar esta ação",
          variant: "destructive",
        });
      } else if (error.response?.status === 429) {
        toast({
          title: "Muitas Solicitações",
          description: "Aguarde um momento antes de tentar novamente",
          variant: "destructive",
        });
      } else if (!error.response) {
        toast({
          title: "Erro de Rede",
          description:
            "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Falha no Pagamento",
          description:
            error.response?.data?.message ||
            error.message ||
            "Ocorreu um erro durante o pagamento",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async () => {
    // Dispatch premium status update event
    window.dispatchEvent(new CustomEvent("premium-status-updated"));

    // Immediately update user data with premium status
    dispatch(updateUser({ has_premium: true }));

    // Add a small delay to ensure backend has processed the subscription
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Refresh ALL user data from different sources
    try {
      // First, refresh the user data directly from the API
      const userResponse = await apiClient.get("/user");
      const userData = userResponse.data;

      // Check if the backend has actually updated the user's premium status
      if (!userData.has_premium) {
        // Wait a bit more and try again
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const retryResponse = await apiClient.get("/user");
        const retryUserData = retryResponse.data;

        if (retryUserData.has_premium) {
          userData.has_premium = retryUserData.has_premium;
          userData.premium_expires_at = retryUserData.premium_expires_at;
        }
      }

      // Update the user data in Redux with the fresh data from backend
      dispatch(
        updateUser({
          has_premium: userData.has_premium,
          premium_expires_at: userData.premium_expires_at,
          ...userData,
        })
      );

      // Refresh auth state (includes basic user data)
      await dispatch(checkAuthStatus());

      // Refresh user profile data
      await dispatch(fetchUserProfile());

      // Dispatch another premium status update event to ensure all listeners get it
      window.dispatchEvent(new CustomEvent("premium-status-updated"));

      // Show success message
      toast({
        title: "🎉 Assinatura Ativada!",
        description:
          "Sua assinatura premium foi ativada com sucesso! Você agora tem acesso a todos os recursos premium.",
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar dados do usuário após assinatura:",
        error
      );

      // Show error message but still close modal
      toast({
        title: "Aviso",
        description:
          "Sua assinatura foi processada, mas houve um problema ao atualizar os dados. Por favor, recarregue a página.",
        variant: "destructive",
      });
    }

    onSuccess?.();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plan Summary */}
      {selectedPlan && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-foreground">Resumo do Plano</div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                R${" "}
                {typeof selectedPlan.price === "number"
                  ? selectedPlan.price.toFixed(2).replace(".", ",")
                  : "0,00"}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedPlan.duration_months === 1
                  ? "1 mês"
                  : `${selectedPlan.duration_months || 1} meses`}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedPlan.description || "Descrição não disponível"}
          </div>
        </div>
      )}

      {/* Stripe Card Element */}
      <div className="space-y-2">
        <Label>Informações do Cartão</Label>
        <div className="p-3 border border-input rounded-md bg-background">
          <CardElement
            className="text-sm text-foreground dark:text-foreground"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: cardElementColors.textColor,
                  fontFamily: "system-ui, sans-serif",
                  "::placeholder": {
                    color: cardElementColors.placeholderColor,
                  },
                },
                invalid: {
                  color: cardElementColors.invalidColor,
                },
              },
            }}
            onChange={(event) => {
              if (event.error) {
                setCardError(event.error.message);
              } else {
                setCardError(null);
              }
            }}
          />
        </div>
        {cardError && <p className="text-sm text-destructive">{cardError}</p>}
      </div>

      {/* Card Holder Name */}
      <div className="space-y-2">
        <Label htmlFor="card_holder_name">Nome do Titular</Label>
        <Input
          id="card_holder_name"
          name="card_holder_name"
          placeholder="João da Silva"
          value={formData.card_holder_name}
          onChange={handleChange}
        />
      </div>


      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedPlan || !stripe}
          className="flex-1"
        >
          {isLoading
            ? "Processando..."
            : selectedPlan
            ? `Pagar R$ ${selectedPlan.price.toFixed(2).replace(".", ",")}`
            : "Selecione um plano"}
        </Button>
      </div>
    </form>
  );
};

// Main Modal Component
export default function SubscriptionModal({
  open,
  selectedPlan,
  onOpenChange,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  // Memoize the stripePromise to prevent recreation on every render
  const stripePromise = useMemo(
    () =>
      loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
        locale: "pt-BR",
      }),
    []
  );

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onClose) {
      onClose();
    }
  };

  if (open !== undefined && !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            Assinatura Premium - {selectedPlan?.name || "Plano Selecionado"}
          </CardTitle>
          <CardDescription>
            {selectedPlan ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-lg">
                    R${" "}
                    {typeof selectedPlan.price === "number"
                      ? selectedPlan.price.toFixed(2).replace(".", ",")
                      : "0,00"}
                  </span>
                  {selectedPlan.duration_months &&
                    selectedPlan.duration_months > 1 && (
                      <span className="text-muted-foreground ml-2">
                        por {selectedPlan.duration_months} meses
                      </span>
                    )}
                </div>
                {selectedPlan.duration_months &&
                  selectedPlan.duration_months > 1 && (
                    <div className="text-sm text-muted-foreground">
                      Equivale a R${" "}
                      {typeof selectedPlan.monthly_price === "number"
                        ? selectedPlan.monthly_price
                            .toFixed(2)
                            .replace(".", ",")
                        : "0,00"}{" "}
                      por mês
                    </div>
                  )}
                {selectedPlan.savings_percentage &&
                  typeof selectedPlan.savings_percentage === "number" && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      💰 Economia de {selectedPlan.savings_percentage}%
                      comparado ao plano mensal
                    </div>
                  )}
              </div>
            ) : (
              "Selecione um plano para continuar"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ locale: "pt-BR" }}>
            <CheckoutForm
              selectedPlan={selectedPlan}
              onSuccess={onSuccess}
              onClose={handleClose}
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
