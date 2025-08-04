import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/apiClient";
import { Loader2 } from "lucide-react";

interface CreateOfferProps {
  creatorId: number;
  creatorName: string;
  chatRoomId: string;
  onOfferCreated?: () => void;
  onCancel?: () => void;
  onExistingOffer?: (offerId: number) => void; // Callback for existing offer
  onReloadMessages?: () => void; // Callback to reload messages
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
  const { toast } = useToast();

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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        creator_id: creatorId,
        chat_room_id: chatRoomId, // Send the room_id string as expected by backend
        budget: parseBudgetToNumber(formData.budget),
        estimated_days: parseInt(formData.estimated_days),
      };

      const response = await apiClient.post("/offers", payload);

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Oferta enviada com sucesso!",
        });

        onOfferCreated?.();
        onReloadMessages?.(); // Reload messages to show the offer in chat
      } else {
        throw new Error(response.data.message || "Erro ao enviar oferta");
      }
    } catch (error: any) {
      console.error("Error creating offer:", error);

      const errorMessage =
        error.response?.data?.message || "Erro ao enviar oferta";

      // Check if it's an existing offer error
      if (
        error.response?.data?.message?.includes("already have a pending offer") ||
        error.response?.data?.message?.includes("pending offer for this creator")
      ) {
        const existingOfferId = error.response?.data?.existing_offer_id;
        if (existingOfferId && onExistingOffer) {
          onExistingOffer(existingOfferId);
          return; // Don't show toast, let the parent handle it
        } else {
          // Fallback: show toast if callback is not provided
          toast({
            title: "Oferta Pendente",
            description: "Você já tem uma oferta pendente para este criador. Aguarde a resposta ou cancele a oferta existente.",
            variant: "destructive",
          });
          return;
        }
      }

      // Check if it's a payment method error
      if (error.response?.data?.error_code === 'NO_PAYMENT_METHOD') {
        toast({
          title: "Método de Pagamento Necessário",
          description: "Você precisa cadastrar um cartão de crédito antes de enviar ofertas. Acesse as configurações de pagamento.",
          variant: "destructive",
        });
        return;
      }

      // Show generic error for other cases
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
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    if (numericValue === "") return "";

    // Convert to number and format as currency
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
    // Remove all non-numeric characters except comma and dot
    const cleanValue = budgetString.replace(/[^\d,.-]/g, "");

    // Handle Brazilian currency format (1.500,50 -> 1500.50)
    // If there's a comma, treat it as Brazilian format
    if (cleanValue.includes(",")) {
      // Remove all dots (thousands separators)
      const withoutThousands = cleanValue.replace(/\./g, "");
      // Then replace comma with dot (decimal separator)
      const numericValue = withoutThousands.replace(",", ".");
      return parseFloat(numericValue) || 0;
    } else {
      // No comma, treat as standard decimal format
      return parseFloat(cleanValue) || 0;
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

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
        </form>
      </CardContent>
    </Card>
  );
}
