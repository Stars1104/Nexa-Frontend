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
  Timer,
  Check,
  X,
} from "lucide-react";

interface Offer {
  id: number;
  title: string;
  description: string;
  budget: string;
  estimated_days: number;
  requirements: string[];
  status: "pending" | "accepted" | "rejected" | "expired";
  expires_at: string;
  days_until_expiry: number;
  is_expiring_soon: boolean;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  can_be_accepted: boolean;
  can_be_rejected: boolean;
  can_be_cancelled: boolean;
  other_user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface Contract {
  id: number;
  title: string;
  description: string;
  budget: string;
  creator_amount: string;
  platform_fee: string;
  estimated_days: number;
  requirements: string[];
  status: "active" | "completed" | "cancelled" | "disputed";
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
}

interface ChatOfferCardProps {
  offer?: Offer;
  contract?: Contract;
  userRole: "brand" | "creator";
  onOfferUpdated: () => void;
  onContractUpdated: () => void;
  onCompleteContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
}

export default function ChatOfferCard({
  offer,
  contract,
  userRole,
  onOfferUpdated,
  onContractUpdated,
  onCompleteContract,
  onReviewContract,
}: ChatOfferCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
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

  // If we have a contract, display contract card
  if (contract) {
    return (
      <ContractCard
        contract={contract}
        userRole={userRole}
        onContractUpdated={onContractUpdated}
        onCompleteContract={onCompleteContract}
        onReviewContract={onReviewContract}
      />
    );
  }

  // If we have an offer, display offer card
  if (offer) {
    return (
      <OfferCard
        offer={offer}
        userRole={userRole}
        onOfferUpdated={onOfferUpdated}
      />
    );
  }

  return null;
}

// Offer Card Component
function OfferCard({
  offer,
  userRole,
  onOfferUpdated,
}: {
  offer: Offer;
  userRole: "brand" | "creator";
  onOfferUpdated: () => void;
}) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  // Safety check for incomplete offer data
  if (!offer || !offer.other_user) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <p>Dados da oferta incompletos</p>
        </div>
      </Card>
    );
  }

  const getStatusColor = () => {
    switch (offer.status) {
      case "pending":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "accepted":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      case "expired":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (offer.status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceita";
      case "rejected":
        return "Rejeitada";
      case "expired":
        return "Expirada";
      default:
        return "Desconhecido";
    }
  };

  const handleAccept = async () => {
    if (!offer.can_be_accepted) {
      toast({
        title: "Erro",
        description: "Esta oferta não pode ser aceita",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await hiringApi.acceptOffer(offer.id);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta aceita com sucesso! Contrato criado.",
        });
        onOfferUpdated();
      } else {
        throw new Error(response.message || "Erro ao aceitar oferta");
      }
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aceitar oferta",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!offer.can_be_rejected) {
      toast({
        title: "Erro",
        description: "Esta oferta não pode ser rejeitada",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await hiringApi.rejectOffer(
        offer.id,
        rejectionReason.trim() || undefined
      );

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta rejeitada com sucesso",
        });
        setShowRejectDialog(false);
        setRejectionReason("");
        onOfferUpdated();
      } else {
        throw new Error(response.message || "Erro ao rejeitar oferta");
      }
    } catch (error: any) {
      console.error("Error rejecting offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao rejeitar oferta",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!offer.can_be_cancelled) {
      toast({
        title: "Erro",
        description: "Esta oferta não pode ser cancelada",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await hiringApi.cancelOffer(offer.id);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Oferta cancelada com sucesso",
        });
        onOfferUpdated();
      } else {
        throw new Error(response.message || "Erro ao cancelar oferta");
      }
    } catch (error: any) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao cancelar oferta",
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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(amount));
  };

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          offer.is_expiring_soon && offer.status === "pending"
            ? "border-orange-200 bg-orange-50"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={offer.other_user?.avatar_url} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{offer.title}</CardTitle>
                <p className="text-sm text-gray-600">
                  de {offer.other_user?.name || "Usuário"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>{getStatusText()}</Badge>
              {offer.is_expiring_soon && offer.status === "pending" && (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
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
                <p className="font-semibold">{formatCurrency(offer.budget)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Prazo</p>
                <p className="font-semibold">{offer.estimated_days} dias</p>
              </div>
            </div>
          </div>

          {offer.requirements && offer.requirements.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h5 className="text-sm font-semibold mb-2">Requisitos:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {offer.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {offer.status === "pending" && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="h-4 w-4" />
              <span>
                {offer.days_until_expiry > 0
                  ? `Expira em ${offer.days_until_expiry} dias`
                  : "Expira hoje"}
              </span>
            </div>
          )}

          {offer.status === "rejected" && offer.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-sm">
                  Motivo da Rejeição
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                {offer.rejection_reason}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {offer.status === "pending" &&
              userRole === "creator" &&
              offer.can_be_accepted && (
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processando..." : "Aceitar Oferta"}
                </Button>
              )}

            {offer.status === "pending" &&
              userRole === "creator" &&
              offer.can_be_rejected && (
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              )}

            {offer.status === "pending" &&
              userRole === "brand" &&
              offer.can_be_cancelled && (
                <Button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Oferta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar esta oferta? Você pode adicionar
              um motivo (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição (opcional)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Contract Card Component
function ContractCard({
  contract,
  userRole,
  onContractUpdated,
  onCompleteContract,
  onReviewContract,
}: {
  contract: Contract;
  userRole: "brand" | "creator";
  onContractUpdated: () => void;
  onCompleteContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  // Safety check for incomplete contract data
  if (!contract || !contract.other_user) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <p>Dados do contrato incompletos</p>
        </div>
      </Card>
    );
  }

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
      default:
        return "Desconhecido";
    }
  };

  const handleComplete = async () => {
    if (!contract.can_be_completed) {
      toast({
        title: "Erro",
        description: "Este contrato não pode ser concluído",
        variant: "destructive",
      });
      return;
    }

    if (onCompleteContract) {
      onCompleteContract(contract);
    }
  };

  const handleCancel = async () => {
    if (!contract.can_be_cancelled) {
      toast({
        title: "Erro",
        description: "Este contrato não pode ser cancelado",
        variant: "destructive",
      });
      return;
    }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(amount));
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
                        : "secondary"
                    }
                    className="ml-1"
                  >
                    {contract.payment.status === "completed"
                      ? "Pago"
                      : "Pendente"}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold ml-1">
                    {formatCurrency(contract.payment.creator_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {contract.review && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-sm">
                  Avaliação Recebida
                </span>
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
            {contract.status === "active" &&
              userRole === "brand" &&
              contract.can_be_completed && (
                <Button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Contrato
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

            {contract.status === "completed" && !contract.review && (
              <Button
                onClick={() => onReviewContract?.(contract)}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar
              </Button>
            )}
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
    </>
  );
}
