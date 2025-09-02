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
  FileText,
  Award,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { Contract } from "@/api/hiring";

interface ContractCardProps {
  contract: Contract;
  onContractUpdated: () => void;
  onComplete: (contract: Contract) => void;
  onReview: (contract: Contract) => void;
  onRenewalOffer: (contract: Contract) => void;
}

export default function ContractCard({
  contract,
  onContractUpdated,
  onComplete,
  onReview,
  onRenewalOffer,
}: ContractCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [terminateMessage, setTerminateMessage] = useState("");
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
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
      case "terminated":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200";
      case "payment_failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      default:
        return "text-gray-600";
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
      case "pending":
        return "Pendente";
      case "terminated":
        return "Terminado";
      case "payment_failed":
        return "Falha no Pagamento";
      default:
        return "Desconhecido";
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

  const handleTerminate = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.terminateContract(
        contract.id,
        terminateMessage.trim() || undefined
      );

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Contrato terminado com sucesso",
        });
        setShowTerminateDialog(false);
        setTerminateMessage("");
        onContractUpdated();
      } else {
        throw new Error(response.message || "Erro ao terminar contrato");
      }
    } catch (error: any) {
      console.error("Error terminating contract:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao terminar contrato",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          contract.is_overdue
            ? "border-red-200 bg-red-50"
            : contract.is_near_completion
            ? "border-orange-200 bg-orange-50"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={contract.other_user?.avatar_url} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{contract.title}</CardTitle>
                <p className="text-sm text-gray-600">
                  com {contract.other_user?.name || "Usuário"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>{getStatusText()}</Badge>
              {contract.is_overdue && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Orçamento</p>
                <p className="font-semibold">
                  {formatCurrency(contract.budget)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Prazo</p>
                <p className="font-semibold">{contract.estimated_days} dias</p>
              </div>
            </div>
          </div>

          {contract.status === "active" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{contract.progress_percentage}%</span>
              </div>
              <Progress value={contract.progress_percentage} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
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

          {contract.payment && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm">Pagamento</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge
                    variant={
                      contract.payment.status === "completed"
                        ? "default"
                        : contract.payment.status === "pending"
                        ? "outline"
                        : "secondary"
                    }
                    className="ml-1"
                  >
                    {contract.payment.status === "completed"
                      ? "Pago"
                      : contract.payment.status === "pending"
                      ? "Aguardando Review"
                      : "Pendente"}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold ml-1">
                    {formatCurrency(contract.payment.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {contract.review && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-sm">Avaliação Enviada</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < contract.review!.rating
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold">
                  {contract.review!.rating}/5
                </span>
              </div>
              {contract.review!.comment && (
                <p className="text-sm text-gray-600 italic">
                  "{contract.review!.comment}"
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {contract.status === "active" && contract.can_be_completed && (
              <Button
                onClick={() => onComplete(contract)}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluído
              </Button>
            )}

            {contract.status === "active" && contract.can_be_cancelled && (
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}

            {contract.status === "active" && contract.can_be_terminated && (
              <Button
                onClick={() => setShowTerminateDialog(true)}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Terminar
              </Button>
            )}

            {contract.status === "completed" && !contract.has_brand_review && (
              <Button
                onClick={() => onReview(contract)}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar
              </Button>
            )}

            {contract.status === "completed" && (
              <Button
                onClick={() => onRenewalOffer(contract)}
                disabled={isProcessing}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Oferta de Renovação
              </Button>
            )}

            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Terminate Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terminar Contrato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja terminar este contrato? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mensagem de Terminação (opcional)</Label>
              <Textarea
                value={terminateMessage}
                onChange={(e) => setTerminateMessage(e.target.value)}
                placeholder="Explique o motivo da terminação..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTerminateDialog(false)}
            >
              Voltar
            </Button>
                         <Button
               onClick={handleTerminate}
               disabled={isProcessing}
               variant="destructive"
             >
               {isProcessing ? "Terminando..." : "Confirmar Terminação"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
