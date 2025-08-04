import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { brandPaymentApi, BrandPaymentMethod, ContractPaymentRequest } from '@/api/payment/brandPayment';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface ContractPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractTitle: string;
  contractBudget: number;
  onPaymentSuccess: () => void;
}

export default function ContractPaymentModal({
  isOpen,
  onClose,
  contractId,
  contractTitle,
  contractBudget,
  onPaymentSuccess,
}: ContractPaymentModalProps) {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<BrandPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await brandPaymentApi.getAvailablePaymentMethods();
      if (response.success && response.data) {
        setPaymentMethods(response.data);
        // Auto-select default payment method
        const defaultMethod = response.data.find(method => method.is_default);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.id);
        } else if (response.data.length > 0) {
          setSelectedPaymentMethod(response.data[0].id);
        }
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao carregar métodos de pagamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar métodos de pagamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Erro',
        description: 'Selecione um método de pagamento',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const paymentData: ContractPaymentRequest = {
        contract_id: contractId,
        payment_method_id: selectedPaymentMethod,
      };

      const response = await brandPaymentApi.processContractPayment(paymentData);

      if (response.success) {
        toast({
          title: 'Pagamento Processado!',
          description: `Pagamento de R$ ${contractBudget.toFixed(2)} processado com sucesso. O contrato foi iniciado!`,
        });
        onPaymentSuccess();
        onClose();
      } else {
        toast({
          title: 'Erro no Pagamento',
          description: response.error || 'Erro ao processar pagamento. Verifique seus dados e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar pagamento',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processando Pagamento</DialogTitle>
            <DialogDescription>
              Carregando métodos de pagamento...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Método de Pagamento Necessário</DialogTitle>
            <DialogDescription>
              Você precisa adicionar um método de pagamento antes de iniciar este contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum método de pagamento encontrado. Adicione um cartão para continuar.
            </p>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Processar Pagamento do Contrato</DialogTitle>
          <DialogDescription>
            Selecione um método de pagamento para processar o pagamento de R$ {formatCurrency(contractBudget)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h4 className="font-medium">Resumo do Contrato</h4>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Título:</strong> {contractTitle}</p>
                  <p><strong>Valor:</strong> {formatCurrency(contractBudget)}</p>
                  <p><strong>Taxa da Plataforma:</strong> {formatCurrency(contractBudget * 0.05)} (5%)</p>
                  <p><strong>Valor para o Criador:</strong> {formatCurrency(contractBudget * 0.95)} (95%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-medium">Método de Pagamento</h4>
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{method.card_info}</span>
                            {method.is_default && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.card_holder_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Informações Importantes
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• O pagamento será processado imediatamente</li>
                  <li>• O valor será reservado em sua conta</li>
                  <li>• O criador receberá 95% do valor após conclusão</li>
                  <li>• A plataforma retém 5% como taxa de serviço</li>
                  <li>• Nenhum valor será cobrado se o contrato for cancelado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProcessPayment} 
            disabled={!selectedPaymentMethod || processing}
          >
            {processing ? 'Processando...' : `Pagar ${formatCurrency(contractBudget)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 