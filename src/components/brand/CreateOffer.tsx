import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/apiClient";
import { Loader2, AlertCircle } from "lucide-react";

interface CreateOfferProps {
  creatorId: number;
  creatorName: string;
  chatRoomId: string;
  onOfferCreated?: () => void;
  onCancel?: () => void;
  onExistingOffer?: (offerId: number) => void; 
  onReloadMessages?: () => void; 
}

interface OfferFormData {
  budget: string;
  estimated_days: string;
}

export default function CreateOffer({
  creatorId,
  creatorName,
  chatRoomId,
  onOfferCreated,
  onCancel,
  onExistingOffer,
  onReloadMessages,
}: CreateOfferProps) {
  const [formData, setFormData] = useState<OfferFormData>({
    budget: "",
    estimated_days: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [hasFunded, setHasFunded] = useState<boolean | null>(null);
  const [isCheckingFunding, setIsCheckingFunding] = useState(true);
  const { toast } = useToast();

  
  const checkFundingStatus = async () => {
    try {
      setIsCheckingFunding(true);
      const response = await apiClient.get('/brand-payment/check-funding-status');
      
      if (response.data.success) {
        setHasFunded(response.data.data.has_funded || false);
      } else {
        setHasFunded(false);
      }
    } catch (error) {
      console.error('Error checking funding status:', error);
      setHasFunded(false);
    } finally {
      setIsCheckingFunding(false);
    }
  };

  
  useEffect(() => {
    checkFundingStatus();

    
    const handleFocus = () => {
      checkFundingStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleInputChange = (field: keyof OfferFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.budget || parseBudgetToNumber(formData.budget) < 10) {
      toast({
        title: "Erro",
        description: "Orçamento deve ser pelo menos R$ 10,00",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.estimated_days || parseInt(formData.estimated_days) < 1) {
      toast({
        title: "Erro",
        description: "Prazo estimado deve ser pelo menos 1 dia",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("++++++++++++++++++++++++")
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        creator_id: creatorId,
        chat_room_id: chatRoomId, 
        budget: parseBudgetToNumber(formData.budget),
        estimated_days: parseInt(formData.estimated_days),
      };
      console .log(payload)

      const response = await apiClient.post("/offers", payload);

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Oferta enviada com sucesso!",
        });

        onOfferCreated?.();
        onReloadMessages?.(); 
      } else {
        throw new Error(response.data.message || "Erro ao enviar oferta");
      }
    } catch (error: any) {
      console.error("Error creating offer:", error);

      
      
      if (error.response?.status === 402 && error.response?.data?.requires_funding) {
        const redirectUrl = error.response?.data?.redirect_url;
        const message = error.response?.data?.message || "Você precisa configurar um método de pagamento antes de enviar ofertas.";
        
        
        sessionStorage.setItem('pending_offer', JSON.stringify({
          creator_id: creatorId,
          creator_name: creatorName,
          chat_room_id: chatRoomId,
          budget: parseBudgetToNumber(formData.budget),
          estimated_days: parseInt(formData.estimated_days),
        }));
        
        toast({
          title: "Método de Pagamento Necessário",
          description: message,
          variant: "default",
        });
        
        
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          
          window.location.href = '/brand?component=Pagamentos&requires_funding=true&action=send_offer';
        }
        setIsSubmitting(false);
        return;
      }

      const errorMessage =
        error.response?.data?.message || "Erro ao enviar oferta";

      
      if (
        error.response?.data?.message?.includes("already have a pending offer") ||
        error.response?.data?.message?.includes("pending offer for this creator")
      ) {
        const existingOfferId = error.response?.data?.existing_offer_id;
        if (existingOfferId && onExistingOffer) {
          onExistingOffer(existingOfferId);
          return; 
        } else {
          
          toast({
            title: "Oferta Pendente",
            description: "Você já tem uma oferta pendente para este criador. Aguarde a resposta ou cancele a oferta existente.",
            variant: "destructive",
          });
          return;
        }
      }

      
      if (error.response?.data?.error_code === 'NO_PAYMENT_METHOD') {
        toast({
          title: "Método de Pagamento Necessário",
          description: "Você precisa cadastrar um cartão de crédito antes de enviar ofertas. Acesse as configurações de pagamento.",
          variant: "destructive",
        });
        return;
      }

      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    
    const numericValue = value.replace(/\D/g, "");

    if (numericValue === "") return "";

    
    const number = parseFloat(numericValue) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleBudgetChange = (value: string) => {
    const formatted = formatCurrency(value);
    setFormData((prev) => ({
      ...prev,
      budget: formatted,
    }));
  };

  const parseBudgetToNumber = (budgetString: string): number => {
    
    const cleanValue = budgetString.replace(/[^\d,.-]/g, "");

    
    
    if (cleanValue.includes(",")) {
      
      const withoutThousands = cleanValue.replace(/\./g, "");
      
      const numericValue = withoutThousands.replace(",", ".");
      return parseFloat(numericValue) || 0;
    } else {
      
      return parseFloat(cleanValue) || 0;
    }
  };

  const handleFundPlatform = async () => {
    if (!validateForm()) {
      return;
    }

    setIsFunding(true);

    try {
      const budget = parseBudgetToNumber(formData.budget);
      
      
      const response = await apiClient.post("/brand-payment/create-funding-checkout", {
        amount: budget,
        creator_id: creatorId,
        chat_room_id: chatRoomId,
      });

      if (response.data.success && response.data.url) {
        
        sessionStorage.setItem('pending_offer', JSON.stringify({
          creator_id: creatorId,
          creator_name: creatorName,
          chat_room_id: chatRoomId,
          budget: budget,
          estimated_days: parseInt(formData.estimated_days),
        }));
        
        toast({
          title: "Redirecionando para Pagamento",
          description: "Você será redirecionado para finalizar o pagamento.",
          variant: "default",
        });
        
        
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data.error || "Erro ao criar sessão de checkout");
      }
    } catch (error: any) {
      console.error("Error creating funding checkout:", error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erro ao criar sessão de checkout. Tente novamente.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Enviar Oferta para</span>
          <Badge variant="secondary">{creatorName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento (R$) *</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="0,00"
                min="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_days">Prazo Estimado (dias) *</Label>
              <Input
                id="estimated_days"
                type="number"
                value={formData.estimated_days}
                onChange={(e) =>
                  handleInputChange("estimated_days", e.target.value)
                }
                placeholder="7"
                min="1"
                max="365"
              />
            </div>
          </div>

          {!hasFunded && !isCheckingFunding && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Financiamento Necessário
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Você precisa financiar a plataforma antes de enviar ofertas. Clique em "Financiar Plataforma" para adicionar fundos.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <Button
              type="button"
              variant="default"
              onClick={handleFundPlatform}
              disabled={isSubmitting || isFunding}
            >
              {isFunding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "💳 Financiar Plataforma"
              )}
            </Button>
            <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
                disabled={isSubmitting || isFunding}
            >
              Cancelar
            </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isFunding || !hasFunded || isCheckingFunding}
                title={!hasFunded && !isCheckingFunding ? "Você precisa financiar a plataforma antes de enviar ofertas" : undefined}
              >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Oferta"
              )}
            </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
