import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Check,
  X,
  Clock,
  AlertCircle,
  Star,
  FileText,
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

export interface ChatOffer {
  id: number;
  title: string;
  description: string;
  budget: string;
  estimated_days: number;
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled";
  expires_at: string;
  days_until_expiry: number;
  is_expiring_soon: boolean;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  can_be_accepted?: boolean;
  can_be_rejected?: boolean;
  can_be_cancelled?: boolean;
  contract_id?: number;
  contract_status?: string;
  can_be_completed?: boolean;
}

interface ChatOfferMessageProps {
  offer: ChatOffer;
  isSender: boolean;
  onAccept?: (offerId: number) => void;
  onReject?: (offerId: number) => void;
  onCancel?: (offerId: number) => void;
  onEndContract?: (contractId: number) => void;
  isCreator?: boolean;
}

export default function ChatOfferMessage({
  offer,
  isSender,
  onAccept,
  onReject,
  onCancel,
  onEndContract,
  isCreator = false,
}: ChatOfferMessageProps) {
  
  // Debug logging
  console.log('ChatOfferMessage rendered with offer:', {
    id: offer.id,
    title: offer.title,
    status: offer.status,
    can_be_accepted: offer.can_be_accepted,
    has_onAccept: !!onAccept,
    id_type: typeof offer.id,
    id_valid: offer.id && offer.id > 0 && !isNaN(offer.id)
  });
  
  // Check if offer is expired
  const isExpired = offer.status === "expired" || offer.days_until_expiry < 0;

  // Determine the actual status to display
  let displayStatus =
    offer.status === "pending" && offer.days_until_expiry < 0
      ? "expired"
      : offer.status;

  // Safety check for incomplete offer data
  if (!offer || !offer.sender || !offer.id || offer.id <= 0 || isNaN(offer.id)) {
    console.error('Invalid offer data in ChatOfferMessage:', offer);
    return (
      <div className="flex gap-3 max-w-2xl">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs">U</AvatarFallback>
        </Avatar>
        <Card className="flex-1 border-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Oferta não disponível
            </p>
            {offer && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Offer ID: {offer.id}</p>
                <p>Has sender: {!!offer.sender}</p>
                <p>Valid ID: {offer.id && offer.id > 0 && !isNaN(offer.id) ? 'Yes' : 'No'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-700";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-700";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-700";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-700";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <X className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceita";
      case "rejected":
        return "Rejeitada";
      case "expired":
        return "Expirada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  // Format budget properly
  const formatBudget = (budget: string) => {
    if (!budget) return "R$ 0,00";

    // If it's already formatted, return as is
    if (budget.includes("R$")) return budget;

    // Try to parse as number and format
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget)) return budget;

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numBudget);
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-2xl",
        isSender ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={offer.sender?.avatar_url} />
        <AvatarFallback className="text-xs">
          {offer.sender?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <Card
        className={cn(
          "flex-1 border-2",
          isSender
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
            : isCreator && displayStatus === "pending"
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-600 shadow-lg"
            : "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-600"
        )}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {offer.title}
              </span>
              {isCreator && displayStatus === "pending" && (
                <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-1 rounded-full">
                  ⚡ Nova
                </span>
              )}
            </div>
            <Badge
              className={cn("text-xs border", getStatusColor(displayStatus))}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(displayStatus)}
                {getStatusText(displayStatus)}
              </div>
            </Badge>
          </div>

          {/* Description */}
          {offer.description && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              {offer.description}
            </p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-slate-900 dark:text-white">
                {formatBudget(offer.budget)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {offer.estimated_days}{" "}
                {offer.estimated_days === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>

          {/* Expiry Info */}
          {displayStatus === "pending" && (
            <div
              className={cn(
                "mb-4 p-2 rounded-lg border",
                isCreator
                  ? "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600"
                  : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-300">
                <Clock className="w-3 h-3" />
                {offer.days_until_expiry < 0 ? (
                  <span>Oferta expirada</span>
                ) : (
                  <span>
                    Expira em {offer.days_until_expiry}{" "}
                    {offer.days_until_expiry === 1 ? "dia" : "dias"}
                  </span>
                )}
              </div>
              {isCreator && (
                <div className="mt-2 text-xs font-medium text-yellow-900 dark:text-yellow-200">
                  ⚡ Ação necessária: Aceite ou rejeite esta oferta
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {displayStatus === "pending" && (
            <div
              className={cn(
                "flex gap-2",
                isCreator ? "justify-center" : "justify-start"
              )}
            >
              {isCreator && offer.can_be_accepted && onAccept && offer.id && offer.id > 0 && !isNaN(offer.id) && (
                <Button
                  size="sm"
                  onClick={() => {
                    console.log('Accept button clicked with offer ID:', offer.id);
                    console.log('Offer object at click time:', offer);
                    console.log('onAccept function:', onAccept);
                    
                    try {
                      onAccept(offer.id);
                    } catch (error) {
                      console.error('Error calling onAccept:', error);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[100px] shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aceitar
                </Button>
              )}

              {isCreator && offer.can_be_rejected && onReject && offer.id && offer.id > 0 && !isNaN(offer.id) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Additional validation before calling callback
                    if (offer.id && offer.id > 0 && !isNaN(offer.id)) {
                      onReject(offer.id);
                    } else {
                      console.error('Invalid offer ID in ChatOfferMessage:', offer.id);
                    }
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20 min-w-[100px] shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeitar
                </Button>
              )}

              {!isCreator && offer.can_be_cancelled && onCancel && offer.id && offer.id > 0 && !isNaN(offer.id) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Additional validation before calling callback
                    if (offer.id && offer.id > 0 && !isNaN(offer.id)) {
                      onCancel(offer.id);
                    } else {
                      console.error('Invalid offer ID in ChatOfferMessage:', offer.id);
                    }
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {/* Contract Actions */}
          {displayStatus === "accepted" &&
            offer.contract_id &&
            offer.contract_id > 0 &&
            !isNaN(offer.contract_id) &&
            offer.contract_status === "active" &&
            offer.can_be_completed &&
            onEndContract && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (offer.contract_id && offer.contract_id > 0 && !isNaN(offer.contract_id)) {
                      onEndContract(offer.contract_id);
                    } else {
                      console.error('Invalid contract ID in ChatOfferMessage:', offer.contract_id);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Completed
                </Button>
              </div>
            )}

          {/* Show message when offer is expired */}
          {displayStatus === "expired" && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
                <AlertCircle className="w-3 h-3" />
                <span>Oferta expirada</span>
              </div>
            </div>
          )}

          {/* Show warning when offer ID is invalid */}
          {(!offer.id || offer.id <= 0 || isNaN(offer.id)) && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-300">
                <AlertCircle className="w-3 h-3" />
                <span>Ação indisponível - ID da oferta inválido</span>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {format(new Date(offer.created_at), "dd/MM/yyyy HH:mm")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
