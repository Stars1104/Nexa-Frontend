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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";
import { Star, User, RefreshCw } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: {
    id: number;
    title: string;
    creator?: {
      id: number;
      name: string;
      avatar_url?: string;
    };
    other_user?: {
      id: number;
      name: string;
      avatar_url?: string;
    };
  };
  onReviewSubmitted: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  contract,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [ratingCategories, setRatingCategories] = useState({
    communication: 3,
    quality: 3,
    timeliness: 3,
    professionalism: 3,
  });
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating < 1) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma avaliação",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await hiringApi.createReview({
        contract_id: contract.id,
        rating,
        comment: comment.trim() || undefined,
        rating_categories: ratingCategories,
        is_public: isPublic,
      });

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Avaliação enviada com sucesso!",
        });

        // Reset form
        setRating(3);
        setComment("");
        setRatingCategories({
          communication: 3,
          quality: 3,
          timeliness: 3,
          professionalism: 3,
        });
        setIsPublic(true);

        onReviewSubmitted();
        onClose();
      } else {
        throw new Error(response.message || "Erro ao enviar avaliação");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);

      // Handle specific error cases
      let errorMessage = "Erro ao enviar avaliação";

      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes("already reviewed")) {
          errorMessage = "Você já avaliou este contrato";
        } else if (error.response?.data?.message?.includes("Both parties")) {
          errorMessage = "Ambas as partes já avaliaram este contrato";
        } else {
          errorMessage = error.response?.data?.message || errorMessage;
        }
      } else if (error.response?.status === 422) {
        errorMessage =
          "Dados inválidos. Verifique as informações e tente novamente.";
      } else if (error.response?.status === 403) {
        errorMessage = "Apenas marcas podem criar avaliações";
      } else if (error.response?.status === 404) {
        errorMessage = "Contrato não encontrado ou não pode ser avaliado";
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

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Avaliar Trabalho
          </DialogTitle>
          <DialogDescription>
            Avalie o trabalho realizado por{" "}
            <span className="font-semibold">
              {contract.creator?.name || contract.other_user?.name || "Criador"}
            </span>{" "}
            no projeto "<span className="font-semibold">{contract.title}</span>"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Avaliação Geral</Label>
            <div className="flex items-center gap-3">
              {renderStars(rating, setRating, "lg")}
              <span className="text-lg font-semibold">{rating}/5</span>
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
                {renderStars(ratingCategories.communication, (value) =>
                  setRatingCategories((prev) => ({
                    ...prev,
                    communication: value,
                  }))
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Qualidade do Trabalho</Label>
                {renderStars(ratingCategories.quality, (value) =>
                  setRatingCategories((prev) => ({ ...prev, quality: value }))
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Pontualidade</Label>
                {renderStars(ratingCategories.timeliness, (value) =>
                  setRatingCategories((prev) => ({
                    ...prev,
                    timeliness: value,
                  }))
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Profissionalismo</Label>
                {renderStars(ratingCategories.professionalism, (value) =>
                  setRatingCategories((prev) => ({
                    ...prev,
                    professionalism: value,
                  }))
                )}
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Compartilhe sua experiência com este criador..."
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/1000 caracteres
            </div>
          </div>

          {/* Public Review */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public-review"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
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
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
