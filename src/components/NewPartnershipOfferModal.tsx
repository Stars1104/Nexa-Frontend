import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "../hooks/use-toast";
import { hiringApi } from "../api/hiring";

interface NewPartnershipOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  onOfferSent: () => void;
}

export default function NewPartnershipOfferModal({
  isOpen,
  onClose,
  chatRoomId,
  onOfferSent,
}: NewPartnershipOfferModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    estimated_days: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.budget || !formData.estimated_days) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const budget = parseFloat(formData.budget);
    const estimatedDays = parseInt(formData.estimated_days);

    if (isNaN(budget) || budget < 10) {
      toast({
        title: "Erro",
        description: "O orçamento deve ser pelo menos R$ 10,00.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(estimatedDays) || estimatedDays < 1 || estimatedDays > 365) {
      toast({
        title: "Erro",
        description: "Os dias estimados devem estar entre 1 e 365.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await hiringApi.sendNewPartnershipOffer({
        chat_room_id: chatRoomId,
        title: formData.title,
        description: formData.description,
        budget: budget,
        estimated_days: estimatedDays,
      });

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Nova oferta de parceria enviada com sucesso!",
        });
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          budget: "",
          estimated_days: "",
        });
        
        onOfferSent();
        onClose();
      } else {
        throw new Error(response.message || "Erro ao enviar oferta");
      }
    } catch (error: any) {
      console.error("Error sending new partnership offer:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar nova oferta de parceria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Nova Oferta de Parceria
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-400 font-medium">
                Informação
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Esta opção 'Nova Oferta' foi criada para propor uma nova parceria ao criador.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Oferta *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Nova campanha para Instagram"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva os detalhes da nova parceria..."
              maxLength={1000}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento (R$) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
                placeholder="0.00"
                min="10"
                max="100000"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_days">Dias Estimados *</Label>
              <Input
                id="estimated_days"
                type="number"
                value={formData.estimated_days}
                onChange={(e) => handleInputChange("estimated_days", e.target.value)}
                placeholder="30"
                min="1"
                max="365"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Enviando..." : "Enviar Oferta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 