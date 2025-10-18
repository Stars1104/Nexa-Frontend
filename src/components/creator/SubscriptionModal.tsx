import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { paymentClient } from "../../services/apiClient";
import { useAppDispatch } from "../../store/hooks";
import { checkAuthStatus, updateUser } from "../../store/slices/authSlice";
import { fetchUserProfile } from "../../store/thunks/userThunks";
import { apiClient } from "../../services/apiClient";
import { getAuthToken, dispatchPremiumStatusUpdate } from "../../utils/browserUtils";

// Stripe
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

interface SubscriptionModalProps {
  open?: boolean;
  selectedPlan?: any;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionModal({
  open,
  selectedPlan,
  onOpenChange,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;
    if (!selectedPlan) {
      toast({ title: "Plano não selecionado", description: "Selecione um plano", variant: "destructive" });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({ title: "Cartão inválido", description:"O campo do cartão não está pronto", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Create PaymentMethod with Stripe
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (error) {
        toast({ title: "Erro Stripe", description: error.message, variant: "destructive" });
        return;
      }

      // 2️⃣ Send PaymentMethod ID to backend
      const token = getAuthToken();
      if (!token) {
        toast({ title: "Login necessário", description: "Faça login para prosseguir", variant: "destructive" });
        return;
      }

      const response = await paymentClient.post("/payment/subscription", {
        subscription_plan_id: selectedPlan.id,
        payment_method_id: paymentMethod.id,
      });

      if (response.data.success) {
        await handleSuccess();
      } else {
        throw new Error(response.data.message || "Falha no pagamento");
      }
    } catch (err: any) {
      console.error("Erro no pagamento:", err);
      toast({ title: "Falha no pagamento", description: err.message || "Tente novamente", variant: "destructive" });
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
      toast({ title: "🎉 Assinatura Ativada!", description: "A assinatura premium está ativa!" });
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário:", err);
      toast({ title: "Aviso", description: "Assinatura processada, mas houve problema ao atualizar dados.", variant: "destructive" });
    }

    onSuccess?.();
    handleClose();
  };

  if (open !== undefined && !open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Assinatura Premium - {selectedPlan?.name || 'Plano Selecionado'}</CardTitle>
          <CardDescription>{selectedPlan?.description || 'Descrição não disponível'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stripe Card Input */}
          <div className="space-y-2">
            <Label>Cartão de Crédito</Label>
            <div className="p-2 border rounded">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">Cancelar</Button>
            <Button onClick={handlePay} disabled={isLoading || !selectedPlan} className="flex-1">
              {isLoading ? "Processando..." : `Pagar R$ ${selectedPlan?.price?.toFixed(2).replace(".", ",")}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
