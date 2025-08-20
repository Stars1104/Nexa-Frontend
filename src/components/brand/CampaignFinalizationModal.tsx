import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";

interface CampaignFinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: {
    id: number;
    title: string;
    budget: string;
    creator?: {
      id: number;
      name: string;
    };
  };
  onCampaignFinalized: () => void;
}

export default function CampaignFinalizationModal({
  isOpen,
  onClose,
  contract,
  onCampaignFinalized,
}: CampaignFinalizationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFinalizeCampaign = async () => {
    setIsProcessing(true);

    try {
      const response = await hiringApi.completeContract(contract.id);

      if (response.success) {
        toast({
          title: "Campanha Finalizada",
          description: "A campanha foi finalizada com sucesso! O pagamento será processado após a avaliação.",
        });

        onCampaignFinalized();
        onClose();
      } else {
        throw new Error(response.message || "Erro ao finalizar campanha");
      }
    } catch (error: any) {
      console.error("Error finalizing campaign:", error);
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

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Finalização da Campanha
          </DialogTitle>
          
          <div className="space-y-4 mt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="text-red-800 dark:text-red-300 font-medium">
                ⚠️ Esta ação não pode ser desfeita!
              </div>
              <div className="text-red-700 dark:text-red-400 text-sm mt-1">
                Ao finalizar a campanha, você estará confirmando que o trabalho foi concluído e o pagamento será liberado para o criador após a avaliação.
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">Detalhes da Campanha:</div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Título:</span> {contract.title}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Valor:</span> {contract.budget}
                </div>
                {contract.creator && (
                  <div className="text-sm">
                    <span className="font-medium">Criador:</span> {contract.creator.name}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="text-blue-800 dark:text-blue-300 text-sm">
                <strong>Próximos passos:</strong>
              </div>
              <ul className="text-blue-700 dark:text-blue-400 text-sm mt-2 space-y-1">
                <li>• A campanha será marcada como concluída</li>
                <li>• Você deverá avaliar o trabalho do criador</li>
                <li>• O pagamento será liberado após a avaliação</li>
                <li>• Uma mensagem automática será enviada ao criador</li>
              </ul>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleFinalizeCampaign}
            disabled={isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Finalizando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 