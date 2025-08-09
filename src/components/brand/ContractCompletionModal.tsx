import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Percent,
  Star,
} from "lucide-react";

interface ContractCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: {
    id: number;
    title: string;
    budget: string;
    creator_amount: string;
    platform_fee: string;
    creator: {
      id: number;
      name: string;
      avatar_url?: string;
    };
  };
  onContractCompleted: () => void;
  onReviewSubmitted: () => void;
}

export default function ContractCompletionModal({
  isOpen,
  onClose,
  contract,
  onContractCompleted,
  onReviewSubmitted,
}: ContractCompletionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    rating_categories: {
      communication: 5,
      quality: 5,
      timeliness: 5,
      professionalism: 5,
    },
    is_public: true,
  });
  const { toast } = useToast();

  const handleCompleteContract = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.completeContract(contract.id);

      if (response.success) {
        toast({
          title: "Campanha Finalizada",
          description:
            "A campanha foi finalizada com sucesso! O pagamento será processado após a avaliação.",
        });

        onContractCompleted();
        setShowReview(true);
      } else {
        throw new Error(response.message || "Erro ao finalizar campanha");
      }
    } catch (error: any) {
      console.error("Error completing contract:", error);
              toast({
          title: "Erro",
          description:
            error.response?.data?.message || "Erro ao finalizar campanha",
          variant: "destructive",
        });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.createReview({
        contract_id: contract.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        rating_categories: reviewData.rating_categories,
        is_public: reviewData.is_public,
      });

      if (response.success) {
        toast({
          title: "Avaliação Enviada",
          description: "Sua avaliação foi enviada com sucesso!",
        });

        onReviewSubmitted();
        onClose();
      } else {
        throw new Error(response.message || "Erro ao enviar avaliação");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao enviar avaliação",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const formatCurrency = (amount: string) => {
    // If the amount is already formatted (contains "R$"), return it as is
    if (amount && amount.includes('R$')) {
      return amount;
    }
    
    // Otherwise, format it as currency
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numericAmount);
  };

  const renderStars = (
    value: number,
    onChange: (value: number) => void,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= value ? "text-yellow-500 fill-current" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (showReview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar Trabalho</DialogTitle>
            <DialogDescription>
              Avalie o trabalho realizado por {contract.creator.name} no projeto
              "{contract.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Rating */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Avaliação Geral</Label>
              <div className="flex items-center gap-3">
                {renderStars(
                  reviewData.rating,
                  (value) =>
                    setReviewData((prev) => ({ ...prev, rating: value })),
                  "lg"
                )}
                <span className="text-lg font-semibold">
                  {reviewData.rating}/5
                </span>
              </div>
            </div>

            {/* Category Ratings */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Avaliações por Categoria
              </Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Comunicação</Label>
                  {renderStars(
                    reviewData.rating_categories.communication,
                    (value) =>
                      setReviewData((prev) => ({
                        ...prev,
                        rating_categories: {
                          ...prev.rating_categories,
                          communication: value,
                        },
                      }))
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Qualidade do Trabalho</Label>
                  {renderStars(reviewData.rating_categories.quality, (value) =>
                    setReviewData((prev) => ({
                      ...prev,
                      rating_categories: {
                        ...prev.rating_categories,
                        quality: value,
                      },
                    }))
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Pontualidade</Label>
                  {renderStars(
                    reviewData.rating_categories.timeliness,
                    (value) =>
                      setReviewData((prev) => ({
                        ...prev,
                        rating_categories: {
                          ...prev.rating_categories,
                          timeliness: value,
                        },
                      }))
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Profissionalismo</Label>
                  {renderStars(
                    reviewData.rating_categories.professionalism,
                    (value) =>
                      setReviewData((prev) => ({
                        ...prev,
                        rating_categories: {
                          ...prev.rating_categories,
                          professionalism: value,
                        },
                      }))
                  )}
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <textarea
                id="comment"
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Compartilhe sua experiência com este criador..."
                rows={4}
                maxLength={1000}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 text-right">
                {reviewData.comment.length}/1000 caracteres
              </div>
            </div>

            {/* Public Review */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public-review"
                checked={reviewData.is_public}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    is_public: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="public-review" className="text-sm">
                Tornar esta avaliação pública no perfil do criador
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Pular
            </Button>
            <Button onClick={handleSubmitReview} disabled={isProcessing}>
              {isProcessing ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Finalizar Campanha
          </DialogTitle>
          <DialogDescription>
            Confirme a finalização da campanha com {contract.creator.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {contract.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Criador:{" "}
                  <span className="font-semibold">{contract.creator.name}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Detalhes do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Valor Total do Contrato:
                </span>
                <span className="font-semibold">
                  {formatCurrency(contract.budget)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Taxa da Plataforma (10%):
                </span>
                <span className="text-red-600">
                  {formatCurrency(contract.platform_fee)}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Valor para o Criador:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(contract.creator_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Info */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Pagamento Automático
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    O pagamento será processado automaticamente através da nossa
                    plataforma segura. O criador receberá 95% do valor total (R${" "}
                    {formatCurrency(contract.creator_amount)}).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Confirmação Final
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                Ao confirmar, você concorda que o trabalho foi concluído
                conforme especificado e autoriza o processamento automático do
                pagamento.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCompleteContract}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
