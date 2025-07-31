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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Percent,
} from "lucide-react";

interface PaymentModalProps {
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
  onPaymentProcessed: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  contract,
  onPaymentProcessed,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.completeContract(contract.id);

      if (response.success) {
        toast({
          title: "Pagamento Processado",
          description:
            "O pagamento foi processado com sucesso! O criador receberá o valor em breve.",
        });

        onPaymentProcessed();
        onClose();
      } else {
        throw new Error(response.message || "Erro ao processar pagamento");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message || "Erro ao processar pagamento",
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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(amount));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Processar Pagamento
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes do pagamento para {contract.creator.name}
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
                    Pagamento Seguro
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    O pagamento será processado através da nossa plataforma
                    segura. O criador receberá o valor em até 2 dias úteis.
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
                conforme especificado e autoriza o processamento do pagamento.
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
            onClick={handleProcessPayment}
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
                Confirmar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
