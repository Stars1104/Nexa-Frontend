import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Star, CheckCircle, DollarSign } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

interface ContractCompletionMessageProps {
  message: {
    id: number;
    message: string;
    created_at: string;
    offer_data?: {
      contract_id?: number;
      requires_review?: boolean;
      review_type?: string;
      brand_name?: string;
      creator_name?: string;
      contract_title?: string;
      creator_amount?: string;
      completed_at?: string;
      show_review_button_for_creator_only?: boolean;
    };
  };
  onReview: () => void;
  isCreator: boolean;
  contractData?: any;
}

export default function ContractCompletionMessage({
  message,
  onReview,
  isCreator,
  contractData,
}: ContractCompletionMessageProps) {
  const data = message.offer_data || contractData || {};

  return (
    <div className="flex gap-3 max-w-2xl">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="text-xs bg-green-100 text-green-700">
          🎉
        </AvatarFallback>
      </Avatar>

      <Card className="flex-1 border-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-lg">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-sm text-green-900 dark:text-green-100">
              Contrato Finalizado
            </span>
          </div>

          {/* Main Message */}
          <div className="text-sm text-green-800 dark:text-green-200 mb-4 leading-relaxed">
            {message.message}
          </div>

          {/* Contract Details */}
          {data.contract_title && (
            <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg p-3 mb-4 border border-green-200 dark:border-green-700">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-green-900 dark:text-green-100">
                    Projeto:
                  </span>{" "}
                  <span className="text-green-800 dark:text-green-200">
                    {data.contract_title}
                  </span>
                </div>
                {data.brand_name && (
                  <div className="text-sm">
                    <span className="font-medium text-green-900 dark:text-green-100">
                      Marca:
                    </span>{" "}
                    <span className="text-green-800 dark:text-green-200">
                      {data.brand_name}
                    </span>
                  </div>
                )}
                {data.creator_amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-900 dark:text-green-100">
                      Valor a receber:
                    </span>{" "}
                    <span className="text-green-800 dark:text-green-200 font-semibold">
                      {data.creator_amount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Button - Show only to creators */}
          {(data.show_review_button_for_creator_only && isCreator) && (
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  onReview();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Star className="w-5 h-5 mr-2" />
                ⭐ Avaliar Marca
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 