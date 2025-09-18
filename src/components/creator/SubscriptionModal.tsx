import { useState } from "react";
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
import { getAuthToken, dispatchPremiumStatusUpdate } from "../../utils/browserUtils";

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
  const [formData, setFormData] = useState({
    card_number: "",
    card_holder_name: "",
    card_expiration_date: "",
    card_cvv: "",
    cpf: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiration = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const formatExpirationForBackend = (value: string) => {
    // Convert MM/AA format to MMYY format for backend
    const numbers = value.replace(/\D/g, "");
    return numbers; // Return just the 4 digits
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case "cpf":
        formattedValue = formatCPF(value);
        break;
      case "card_number":
        formattedValue = formatCardNumber(value);
        break;
      case "card_expiration_date":
        formattedValue = formatExpiration(value);
        break;
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/[.-]/g, "");
    if (numbers.length !== 11) {
      return false;
    }
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false;
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(numbers[9]) !== digit1) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[10]) === digit2;
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.card_number.replace(/\s/g, "").match(/^\d{16}$/)) {
      errors.push("O número do cartão deve ter 16 dígitos");
    }

    if (!formData.card_holder_name.trim()) {
      errors.push("O nome do titular é obrigatório");
    }

    if (!formData.card_expiration_date.match(/^\d{2}\/\d{2}$/)) {
      errors.push("A data de validade deve estar no formato MM/AA");
    }

    if (!formData.card_cvv.match(/^\d{3,4}$/)) {
      errors.push("O CVV deve ter 3 ou 4 dígitos");
    }

    if (!formData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      errors.push("O CPF deve estar no formato XXX.XXX.XXX-XX");
    } else if (!validateCPF(formData.cpf)) {
      errors.push("CPF inválido. Verifique o número.");
    }

    return errors;
  };


  const handlePay = async () => {
    const token = getAuthToken();
    
    if (!token) {
      toast({
        title: "Autenticação Necessária",
        description: "Faça login para prosseguir com o pagamento",
        variant: "destructive",
      });
      return;
    }

    if (!open) {
      return;
    }

    if (!selectedPlan) {
      console.error('No selected plan found:', { selectedPlan, open });
      toast({
        title: "Plano não selecionado",
        description: "Por favor, selecione um plano de assinatura",
        variant: "destructive",
      });
      return;
    }

    const errors = validateForm();

    if (errors.length > 0) {
      toast({
        title: "Erro de Validação",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const paymentData = {
        card_number: formData.card_number.replace(/\s/g, ""),
        card_holder_name: formData.card_holder_name.trim(),
        card_expiration_date: formatExpirationForBackend(formData.card_expiration_date), // Convert MM/AA to MMYY format
        card_cvv: formData.card_cvv,
        cpf: formData.cpf,
        subscription_plan_id: selectedPlan?.id,
      };

      if (paymentData.card_number.length !== 16) {
        toast({
          title: "Erro de Validação",
          description: "O número do cartão deve ter exatamente 16 dígitos",
          variant: "destructive",
        });
        return;
      }

      if (paymentData.card_expiration_date.length !== 4 || !/^\d{4}$/.test(paymentData.card_expiration_date)) {
        toast({
          title: "Erro de Validação",
          description: "A data de validade deve estar no formato MMAA (4 dígitos)",
          variant: "destructive",
        });
        return;
      }

      // Additional validation for card expiration date format
      const month = parseInt(paymentData.card_expiration_date.substring(0, 2));
      const year = parseInt(paymentData.card_expiration_date.substring(2, 4));
      
      if (month < 1 || month > 12) {
        toast({
          title: "Erro de Validação",
          description: "O mês deve estar entre 01 e 12",
          variant: "destructive",
        });
        return;
      }

      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year
      if (year < currentYear) {
        toast({
          title: "Erro de Validação",
          description: `O ano deve ser ${currentYear} ou superior`,
          variant: "destructive",
        });
        return;
      }

      if (paymentData.card_cvv.length < 3 || paymentData.card_cvv.length > 4) {
        toast({
          title: "Erro de Validação",
          description: "O CVV deve ter 3 ou 4 dígitos",
          variant: "destructive",
        });
        return;
      }

      if (!paymentData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
        toast({
          title: "Erro de Validação",
          description: "O CPF deve estar no formato XXX.XXX.XXX-XX",
          variant: "destructive",
        });
        return;
      }

      // Debug: Log the payment data being sent
      console.log("🔵 Sending payment data:", {
        ...paymentData,
        card_number: paymentData.card_number.replace(/\d(?=\d{4})/g, "*"), // Mask card number for security
        card_cvv: "***" // Mask CVV for security
      });

      const response = await paymentClient.post(
        "/payment/subscription",
        paymentData
      );

      if (response.data.success) {
        handleSuccess();
      } else {
        throw new Error(response.data.message || "Falha no pagamento");
      }
    } catch (error: any) {
      console.error("Erro no pagamento:", error);
      
      // Enhanced error logging
      console.error("Detailed Error Info:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Log the actual error data separately so it's not collapsed
      console.error("🔴 BACKEND ERROR DATA:", error.response?.data);
      console.error("🔴 FULL ERROR RESPONSE:", error.response);
      console.error("🔴 REQUEST CONFIG:", error.config);

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

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onClose) {
      onClose();
    }
  };

  const handleSuccess = async () => {
    
    // Dispatch premium status update event
    dispatchPremiumStatusUpdate();
    
    // Immediately update user data with premium status
    dispatch(updateUser({ has_premium: true }));
    
    // Add a small delay to ensure backend has processed the subscription
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Refresh ALL user data from different sources
    try {
      // First, refresh the user data directly from the API
      const userResponse = await apiClient.get("/user");
      const userData = userResponse.data;
      
      // Check if the backend has actually updated the user's premium status
      if (!userData.has_premium) {
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResponse = await apiClient.get("/user");
        const retryUserData = retryResponse.data;
        
        if (retryUserData.has_premium) {
          userData.has_premium = retryUserData.has_premium;
          userData.premium_expires_at = retryUserData.premium_expires_at;
        }
      }
      
      // Update the user data in Redux with the fresh data from backend
      dispatch(updateUser({
        has_premium: userData.has_premium,
        premium_expires_at: userData.premium_expires_at,
        ...userData
      }));
      
      // Refresh auth state (includes basic user data)
      await dispatch(checkAuthStatus());
      
      // Refresh user profile data
      await dispatch(fetchUserProfile());
      
      // Dispatch another premium status update event to ensure all listeners get it
      dispatchPremiumStatusUpdate();
      
      // Show success message
      toast({
        title: "🎉 Assinatura Ativada!",
        description: "Sua assinatura premium foi ativada com sucesso! Você agora tem acesso a todos os recursos premium.",
      });
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário após assinatura:", error);
      
      // Show error message but still close modal
      toast({
        title: "Aviso",
        description: "Sua assinatura foi processada, mas houve um problema ao atualizar os dados. Por favor, recarregue a página.",
        variant: "destructive",
      });
      
      // Force reload even on error to ensure state consistency
    }
    
    onSuccess?.();
    handleClose();
  };

  if (open !== undefined && !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Assinatura Premium - {selectedPlan?.name || 'Plano Selecionado'}</CardTitle>
          <CardDescription>
            {selectedPlan ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-lg">
                    R$ {typeof selectedPlan.price === 'number' ? selectedPlan.price.toFixed(2).replace('.', ',') : '0,00'}
                  </span>
                  {selectedPlan.duration_months && selectedPlan.duration_months > 1 && (
                    <span className="text-muted-foreground ml-2">
                      por {selectedPlan.duration_months} meses
                    </span>
                  )}
                </div>
                {selectedPlan.duration_months && selectedPlan.duration_months > 1 && (
                  <div className="text-sm text-muted-foreground">
                    Equivale a R$ {typeof selectedPlan.monthly_price === 'number' ? selectedPlan.monthly_price.toFixed(2).replace('.', ',') : '0,00'} por mês
                  </div>
                )}
                {selectedPlan.savings_percentage && typeof selectedPlan.savings_percentage === 'number' && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    💰 Economia de {selectedPlan.savings_percentage}% comparado ao plano mensal
                  </div>
                )}
              </div>
            ) : (
              'Selecione um plano para continuar'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Summary */}
          {selectedPlan && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground">Resumo do Plano</div>
                <div className="text-right">
                                  <div className="text-lg font-bold text-foreground">
                  R$ {typeof selectedPlan.price === 'number' ? selectedPlan.price.toFixed(2).replace('.', ',') : '0,00'}
                </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPlan.duration_months === 1 
                      ? '1 mês' 
                      : `${selectedPlan.duration_months || 1} meses`
                    }
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedPlan.description || 'Descrição não disponível'}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="card_number">Número do Cartão</Label>
            <Input
              id="card_number"
              name="card_number"
              placeholder="1234 5678 9012 3456"
              value={formData.card_number}
              onChange={handleInputChange}
              maxLength={19}
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_expiration_date">Validade</Label>
              <Input
                id="card_expiration_date"
                name="card_expiration_date"
                placeholder="MM/AA"
                value={formData.card_expiration_date}
                onChange={handleInputChange}
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_cvv">CVV</Label>
              <Input
                id="card_cvv"
                name="card_cvv"
                placeholder="123"
                value={formData.card_cvv}
                onChange={handleChange}
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              placeholder="111.444.777-35"
              value={formData.cpf}
              onChange={handleInputChange}
              maxLength={14}
            />
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground">
                CPFs de teste válidos: 111.444.777-35, 123.456.789-09, 987.654.321-00
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handlePay} disabled={isLoading || !selectedPlan} className="flex-1">
              {isLoading ? "Processando..." : selectedPlan ? `Pagar R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}` : "Selecione um plano"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}