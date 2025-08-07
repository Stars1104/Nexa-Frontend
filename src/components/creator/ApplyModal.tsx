import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { applyToCampaign } from "../../store/thunks/campaignThunks";
import { toast } from "../ui/sonner";
import { Plus, X, Link } from "lucide-react";

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  brandName: string;
  campaignId: number;
  onConfirm?: () => void;
  loading?: boolean;
}

const ApplyModal: React.FC<ApplyModalProps> = ({
  open,
  onOpenChange,
  campaignName,
  brandName,
  campaignId,
  onConfirm,
  loading: externalLoading,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.campaign);
  const { user } = useAppSelector((state) => state.auth);
  
  const loading = externalLoading || isLoading;

  // Form state
  const [proposal, setProposal] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add portfolio link field
  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, ""]);
  };

  // Remove portfolio link field
  const removePortfolioLink = (index: number) => {
    if (portfolioLinks.length > 1) {
      const newLinks = portfolioLinks.filter((_, i) => i !== index);
      setPortfolioLinks(newLinks);
    }
  };

  // Update portfolio link
  const updatePortfolioLink = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!proposal.trim()) {
      newErrors.proposal = "A proposta é obrigatória";
    } else if (proposal.trim().length < 10) {
      newErrors.proposal = "A proposta deve ter pelo menos 10 caracteres";
    } else if (proposal.trim().length > 2000) {
      newErrors.proposal = "A proposta deve ter no máximo 2000 caracteres";
    }

    // Validate portfolio links (if any are filled)
    const filledLinks = portfolioLinks.filter(link => link.trim() !== "");
    filledLinks.forEach((link, index) => {
      try {
        new URL(link);
      } catch {
        newErrors[`portfolio_${index}`] = "URL inválida";
      }
    });

    if (estimatedDeliveryDays !== undefined) {
      if (estimatedDeliveryDays < 1) {
        newErrors.estimatedDeliveryDays = "O prazo deve ser pelo menos 1 dia";
      } else if (estimatedDeliveryDays > 365) {
        newErrors.estimatedDeliveryDays = "O prazo não pode ser maior que 365 dias";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      // Filter out empty portfolio links
      const filteredPortfolioLinks = portfolioLinks.filter(link => link.trim() !== "");
      
      await dispatch(applyToCampaign({
        campaignId,
        proposal: proposal.trim(),
        portfolio_links: filteredPortfolioLinks.length > 0 ? filteredPortfolioLinks : undefined,
        estimated_delivery_days: estimatedDeliveryDays,
      })).unwrap();
      
      // Show success message
      toast.success("Aplicação enviada com sucesso! A marca será notificada.");
      
      // Reset form
      setProposal("");
      setPortfolioLinks([""]);
      setEstimatedDeliveryDays(undefined);
      setErrors({});
      
      // Call the optional onConfirm callback
      if (onConfirm) {
        onConfirm();
      }
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply to campaign:", error);
      toast.error("Erro ao enviar aplicação. Tente novamente.");
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setProposal("");
    setPortfolioLinks([""]);
    setEstimatedDeliveryDays(undefined);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Aplicar para Campanha
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-200">
            Preencha os detalhes da sua aplicação para a campanha <span className="font-semibold">{campaignName}</span> da marca <span className="font-semibold">{brandName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Proposal */}
          <div className="space-y-2">
            <Label htmlFor="proposal" className="text-sm font-medium">
              Proposta * <span className="text-gray-500">(10-2000 caracteres)</span>
            </Label>
            <Textarea
              id="proposal"
              placeholder="Descreva por que você seria perfeito para esta campanha, sua experiência relevante, e como você pode ajudar a marca a alcançar seus objetivos..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className={`min-h-[120px] ${errors.proposal ? 'border-red-500' : ''}`}
              maxLength={2000}
            />
            {errors.proposal && (
              <p className="text-sm text-red-500">{errors.proposal}</p>
            )}
            <p className="text-xs text-gray-500">
              {proposal.length}/2000 caracteres
            </p>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Link className="w-4 h-4" />
              Links do Portfólio
            </Label>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
              Criadores que adicionam um link de portfólio têm 70% mais chance de fechar uma parceria.
            </p>
            <div className="space-y-3">
              {portfolioLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/portfolio"
                    value={link}
                    onChange={(e) => updatePortfolioLink(index, e.target.value)}
                    className={errors[`portfolio_${index}`] ? 'border-red-500' : ''}
                  />
                  {portfolioLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePortfolioLink(index)}
                      className="px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPortfolioLink}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
            {Object.keys(errors).some(key => key.startsWith('portfolio_')) && (
              <p className="text-sm text-red-500">Verifique os URLs dos links do portfólio</p>
            )}
          </div>

          {/* Estimated Delivery Days */}
          <div className="space-y-2">
            <Label htmlFor="delivery-days" className="text-sm font-medium">
              Prazo Estimado de Entrega <span className="text-gray-500">(opcional)</span>
            </Label>
            <Input
              id="delivery-days"
              type="number"
              placeholder="Ex: 14"
              value={estimatedDeliveryDays || ""}
              onChange={(e) => setEstimatedDeliveryDays(e.target.value ? parseInt(e.target.value) : undefined)}
              className={errors.estimatedDeliveryDays ? 'border-red-500' : ''}
              min="1"
              max="365"
            />
            {errors.estimatedDeliveryDays && (
              <p className="text-sm text-red-500">{errors.estimatedDeliveryDays}</p>
            )}
            <p className="text-xs text-gray-500">
              Quantos dias você estima para entregar o conteúdo? (1-365 dias)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6 flex-col-reverse sm:flex-row">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Aplicação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;
