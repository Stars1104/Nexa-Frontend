import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";
import {
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  User,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";

interface Contract {
  id: number;
  title: string;
  description: string;
  budget: string;
  creator_amount: string;
  platform_fee: string;
  estimated_days: number;
  requirements: string[];
  status: "active" | "completed" | "cancelled" | "disputed" | "terminated";
  started_at: string;
  expected_completion_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  days_until_completion: number;
  progress_percentage: number;
  is_overdue: boolean;
  is_near_completion: boolean;
  can_be_completed: boolean;
  can_be_cancelled: boolean;
  other_user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  payment?: {
    id: number;
    status: string;
    total_amount: string;
    creator_amount: string;
    platform_fee: string;
    processed_at?: string;
  };
  review?: {
    id: number;
    rating: number;
    comment?: string;
    created_at: string;
  };
  created_at: string;
  has_creator_review: boolean;
}

interface ContractCardProps {
  contract: Contract;
  onContractUpdated: () => void;
}

export default function ContractCard({
  contract,
  onContractUpdated,
}: ContractCardProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  const getStatusColor = () => {
    switch (contract.status) {
      case "active":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      case "disputed":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
      case "terminated":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusText = () => {
    switch (contract.status) {
      case "active":
        return "Ativo";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "disputed":
        return "Em Disputa";
      case "terminated":
        return "Terminado";
      default:
        return "Desconhecido";
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.completeContract(contract.id);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Contrato concluído com sucesso! Pagamento processado.",
        });
        onContractUpdated();
      } else {
        throw new Error(response.message || "Erro ao concluir contrato");
      }
    } catch (error: any) {
      console.error("Error completing contract:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao concluir contrato",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.cancelContract(
        contract.id,
        cancelReason.trim() || undefined
      );

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Contrato cancelado com sucesso",
        });
        setShowCancelDialog(false);
        setCancelReason("");
        onContractUpdated();
      } else {
        throw new Error(response.message || "Erro ao cancelar contrato");
      }
    } catch (error: any) {
      console.error("Error cancelling contract:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao cancelar contrato",
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
          title: "Sucesso",
          description: "Avaliação enviada com sucesso",
        });
        setShowReviewDialog(false);
        setReviewData({
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
        onContractUpdated();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-md dark:hover:shadow-lg${
          contract.is_overdue
            ? "border-red-200 dark:bg-[#171717] dark:border-[#333]"
            : contract.is_near_completion
            ? "border-orange-200 dark:bg-[#171717] dark:border-[#333]"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getAvatarUrl(contract.other_user?.avatar_url)} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg dark:text-gray-100">{contract.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  com {contract.other_user?.name || "Usuário"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>{getStatusText()}</Badge>
              {contract.is_overdue && (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Orçamento</p>
                <p className="font-semibold dark:text-gray-100">
                  {formatCurrency(contract.budget)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prazo</p>
                <p className="font-semibold dark:text-gray-100">{contract.estimated_days} dias</p>
              </div>
            </div>
          </div>

          {contract.status === "active" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="dark:text-gray-300">Progresso</span>
                <span className="dark:text-gray-300">{contract.progress_percentage}%</span>
              </div>
              <Progress value={contract.progress_percentage} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {contract.days_until_completion > 0
                    ? `${contract.days_until_completion} dias restantes`
                    : `${Math.abs(
                        contract.days_until_completion
                      )} dias de atraso`}
                </span>
              </div>
            </div>
          )}

          {contract.review && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-semibold text-sm dark:text-gray-200">
                  Avaliação Recebida
                </span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < contract.review!.rating
                        ? "text-yellow-500 dark:text-yellow-400 fill-current"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold dark:text-gray-200">
                  {contract.review!.rating}/5
                </span>
              </div>
              {contract.review!.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{contract.review!.comment}"
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">

            {contract.status === "completed" && !contract.has_creator_review && (
              <Button
                onClick={() => setShowReviewDialog(true)}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar Trabalho</DialogTitle>
            <DialogDescription>
              Avalie o trabalho realizado por{" "}
              {contract.other_user?.name || "Usuário"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Avaliação Geral</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setReviewData((prev) => ({ ...prev, rating }))
                    }
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= reviewData.rating
                          ? "text-yellow-500 dark:text-yellow-400 fill-current"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Comentário (opcional)</Label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Compartilhe sua experiência..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitReview} disabled={isProcessing}>
              {isProcessing ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Contrato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este contrato? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo do Cancelamento (opcional)</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explique o motivo do cancelamento..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Voltar
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
