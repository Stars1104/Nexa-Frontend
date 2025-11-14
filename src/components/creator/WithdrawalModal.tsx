import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/apiClient";
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  BanknoteIcon,
  Smartphone,
  User,
  Percent,
  Info,
} from "lucide-react";

interface WithdrawalMethod {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number;
  processing_time: string;
  fee: number;
  required_fields?: string[];
  field_config?: Record<string, any>;
  // Stripe payment method fields (optional)
  stripe_payment_method_id?: string;
  stripe_customer_id?: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
}

interface CreatorBalance {
  balance: {
    available_balance: number;
    pending_balance: number;
    total_balance: number;
    total_earned: number;
    total_withdrawn: number;
    formatted_available_balance: string;
    formatted_pending_balance: string;
    formatted_total_balance: string;
    formatted_total_earned: string;
    formatted_total_withdrawn: string;
  };
  earnings: {
    this_month: number;
    this_year: number;
    formatted_this_month: string;
    formatted_this_year: string;
  };
  withdrawals: {
    pending_count: number;
    pending_amount: number;
    formatted_pending_amount: string;
  };
  recent_transactions: Array<{
    id: number;
    contract_title: string;
    amount: string;
    status: string;
    processed_at?: string;
  }>;
  recent_withdrawals: Array<{
    id: number;
    amount: string;
    method: string;
    status: string;
    created_at: string;
  }>;
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: CreatorBalance;
  onWithdrawalCreated: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  balance,
  onWithdrawalCreated,
}: WithdrawalModalProps) {
  const [withdrawalMethods, setWithdrawalMethods] = useState<
    WithdrawalMethod[]
  >([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [withdrawalDetails, setWithdrawalDetails] = useState<
    Record<string, string>
  >({});
  const { toast } = useToast();

  const selectedMethodData = withdrawalMethods.find(
    (method) => method.id === selectedMethod
  );

  useEffect(() => {
    if (isOpen) {
      loadWithdrawalMethods();
    }
  }, [isOpen]);

  const loadWithdrawalMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const response = await apiClient.get(
        "/freelancer/withdrawal-methods"
      );
      if (response.data.success) {
        console.log("Withdrawal methods received:", response.data.data);
        console.log("Methods count:", response.data.data.length);
        
        // Deduplicate methods by ID to prevent duplicate keys
        const uniqueMethods = response.data.data.reduce((acc: WithdrawalMethod[], method: WithdrawalMethod) => {
          const existingIndex = acc.findIndex((m) => m.id === method.id);
          if (existingIndex === -1) {
            acc.push(method);
          } else {
            // If duplicate found, prefer the one with stripe_payment_method_id (user-specific)
            if (method.stripe_payment_method_id && !acc[existingIndex].stripe_payment_method_id) {
              acc[existingIndex] = method;
            }
          }
          return acc;
        }, []);
        
        console.log("Unique methods count:", uniqueMethods.length);
        // Log each method to see what's included
        uniqueMethods.forEach((method: WithdrawalMethod, index: number) => {
          console.log(`Method ${index}:`, {
            id: method.id,
            name: method.name,
            isStripeCard: method.id === 'stripe_card',
          });
        });
        
        setWithdrawalMethods(uniqueMethods);
        if (uniqueMethods.length > 0) {
          setSelectedMethod(uniqueMethods[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading withdrawal methods:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar métodos de saque",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos corretamente",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > balance.balance.available_balance) {
      toast({
        title: "Erro",
        description: "Valor solicitado excede o saldo disponível",
        variant: "destructive",
      });
      return;
    }

    if (
      selectedMethodData &&
      parseFloat(amount) < selectedMethodData.min_amount
    ) {
      toast({
        title: "Erro",
        description: `Valor mínimo para ${
          selectedMethodData.name
        } é ${formatCurrency(selectedMethodData.min_amount)}`,
        variant: "destructive",
      });
      return;
    }

    if (
      selectedMethodData &&
      parseFloat(amount) > selectedMethodData.max_amount
    ) {
      toast({
        title: "Erro",
        description: `Valor máximo para ${
          selectedMethodData.name
        } é ${formatCurrency(selectedMethodData.max_amount)}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        amount: parseFloat(amount),
        withdrawal_method: selectedMethod,
        withdrawal_details: withdrawalDetails,
      };
      
      const response = await apiClient.post("/freelancer/withdrawals", requestData);

      if (response.data.success) {
        const withdrawalData = response.data.data;
        const netAmount = calculateNetAmount();
        const totalFees = calculateTotalFees();
        const processingTime = selectedMethodData?.processing_time || "1-3 dias úteis";
        
        // Show success toast with detailed information
        toast({
          title: "✅ Saque Solicitado com Sucesso!",
          description: `${formatCurrency(amount)} via ${selectedMethodData?.name || withdrawalData.method}\n\n` +
            `💰 Valor líquido: ${formatCurrency(netAmount)}\n` +
            `💳 Taxas: ${formatCurrency(totalFees)} • ⏱️ Processamento: ${processingTime}\n\n` +
            `📊 Você pode acompanhar o status do saque na aba "Histórico de Saques"`,
          duration: 7000,
        });

        onWithdrawalCreated();
        onClose();
        resetForm();
      } else {
        throw new Error(response.data.message || "Erro ao solicitar saque");
      }
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      
      // Enhanced error toast with helpful guidance
      const errorMessage = error.response?.data?.message || "Erro ao solicitar saque";
      let helpfulMessage = errorMessage;
      
      if (errorMessage.includes("Saldo insuficiente")) {
        helpfulMessage = "Seu saldo disponível não é suficiente para este saque. Verifique seu saldo e tente novamente.";
      } else if (errorMessage.includes("muitos saques pendentes")) {
        helpfulMessage = "Você tem muitos saques pendentes. Aguarde o processamento dos saques atuais antes de solicitar um novo.";
      } else if (errorMessage.includes("Valor deve estar entre")) {
        helpfulMessage = errorMessage;
      }
      
      toast({
        title: "❌ Erro ao Solicitar Saque",
        description: `${helpfulMessage}\n\n` +
          `💡 Se o problema persistir, entre em contato com o suporte.`,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setSelectedMethod("");
    setWithdrawalDetails({});
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case "pix":
        return <Smartphone className="h-4 w-4" />;
      case "bank_transfer":
      case "pagarme_bank_transfer":
        return <BanknoteIcon className="h-4 w-4" />;
      case "pagarme_account":
      case "stripe_card":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const renderMethodFields = () => {
    if (!selectedMethodData) return null;

    // For Pagar.me bank transfer, no additional fields are needed
    if (selectedMethodData.id === 'pagarme_bank_transfer') {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <BanknoteIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Conta Bancária Registrada
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  O saque será processado para sua conta bancária registrada via Pagar.me. 
                  Não são necessárias informações adicionais.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Use dynamic field configuration if available
    if (selectedMethodData.field_config) {
      return (
        <div className="space-y-3">
          {Object.entries(selectedMethodData.field_config).map(([fieldName, config]) => (
            <div key={fieldName}>
              <Label htmlFor={fieldName}>{config.label}</Label>
              {config.type === 'select' ? (
                <Select
                  value={withdrawalDetails[fieldName] || ""}
                  onValueChange={(value) =>
                    setWithdrawalDetails((prev) => ({
                      ...prev,
                      [fieldName]: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${config.label?.toLowerCase() || 'opção'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={fieldName}
                  type={config.type || 'text'}
                  value={withdrawalDetails[fieldName] || ""}
                  onChange={(e) =>
                    setWithdrawalDetails((prev) => ({
                      ...prev,
                      [fieldName]: e.target.value,
                    }))
                  }
                  placeholder={`Digite ${config.label?.toLowerCase() || 'informação'}`}
                  required={config.required}
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    // Fallback to hardcoded fields for backward compatibility
    switch (selectedMethodData.id) {
      case "pix":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={withdrawalDetails.pix_key || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    pix_key: e.target.value,
                  }))
                }
                placeholder="Digite sua chave PIX"
                required
              />
            </div>
            <div>
              <Label htmlFor="pix_key_type">Tipo de Chave</Label>
              <Select
                value={withdrawalDetails.pix_key_type || ""}
                onValueChange={(value) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    pix_key_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="holder_name">Nome do Titular</Label>
              <Input
                id="holder_name"
                value={withdrawalDetails.holder_name || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    holder_name: e.target.value,
                  }))
                }
                placeholder="Nome completo do titular"
                required
              />
            </div>
          </div>
        );

      case "bank_transfer":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                value={withdrawalDetails.bank || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    bank: e.target.value,
                  }))
                }
                placeholder="Nome do banco"
                required
              />
            </div>
            <div>
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={withdrawalDetails.agency || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    agency: e.target.value,
                  }))
                }
                placeholder="Número da agência"
                required
              />
            </div>
            <div>
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={withdrawalDetails.account || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    account: e.target.value,
                  }))
                }
                placeholder="Número da conta"
                required
              />
            </div>
            <div>
              <Label htmlFor="account_type">Tipo de Conta</Label>
              <Select
                value={withdrawalDetails.account_type || ""}
                onValueChange={(value) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    account_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="holder_name">Nome do Titular</Label>
              <Input
                id="holder_name"
                value={withdrawalDetails.holder_name || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    holder_name: e.target.value,
                  }))
                }
                placeholder="Nome completo do titular"
                required
              />
            </div>
          </div>
        );

      case "pagarme_account":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="holder_name">Nome do Titular</Label>
              <Input
                id="holder_name"
                value={withdrawalDetails.holder_name || ""}
                onChange={(e) =>
                  setWithdrawalDetails((prev) => ({
                    ...prev,
                    holder_name: e.target.value,
                  }))
                }
                placeholder="Nome completo do titular"
                required
              />
            </div>
          </div>
        );

      case "stripe_card":
        return (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Cartão Cadastrado
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    O saque será processado para o cartão cadastrado no Stripe:{" "}
                    <strong>{selectedMethodData.name}</strong>
                    {selectedMethodData.card_brand && selectedMethodData.card_last4 && (
                      <span className="block mt-1">
                        {selectedMethodData.card_brand.toUpperCase()} •••• {selectedMethodData.card_last4}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Não são necessárias informações adicionais. O valor será creditado diretamente no cartão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const calculateFee = () => {
    if (!selectedMethodData || !amount) return 0;
    
    // Check if the method has a fixed fee or percentage fee
    if (selectedMethodData.id === 'pix') {
      // PIX has a fixed fee
      return selectedMethodData.fee;
    } else {
      // Other methods have percentage fees
      return (parseFloat(amount) * selectedMethodData.fee) / 100;
    }
  };

  const calculateFixedFee = () => {
    return 5.00; // R$5 fixed platform fee
  };

  const calculateTotalFees = () => {
    return calculateFee() + calculateFixedFee();
  };

  const calculateNetAmount = () => {
    if (!amount) return 0;
    return parseFloat(amount) - calculateTotalFees();
  };

  const getFeeDisplay = () => {
    if (!selectedMethodData) return '';
    
    if (selectedMethodData.id === 'pix') {
      return `Taxa: R$ ${selectedMethodData.fee.toFixed(2)}`;
    } else {
      return `Taxa: ${selectedMethodData.fee}%`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
        </DialogHeader>

        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mx-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">ℹ</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                Conta Bancária Necessária
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Para solicitar um saque, você precisa ter uma conta bancária registrada via Pagar.me. 
                Se ainda não registrou sua conta, acesse seu perfil para fazer o cadastro.
              </p>
            </div>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto pr-2 relative"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(156 163 175) rgb(243 244 246)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* Balance Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Saldo Disponível
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saldo Disponível:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {balance.balance.formatted_available_balance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saldo Pendente:</span>
                  <span className="text-orange-600">
                    {balance.balance.formatted_pending_balance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Ganho:</span>
                  <span className="font-semibold">
                    {balance.balance.formatted_total_earned}
                  </span>
                </div>
              </CardContent>
            </Card>


            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount">Valor do Saque</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={balance.balance.available_balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Digite o valor"
                required
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Valor mínimo:{" "}
                  {selectedMethodData
                    ? formatCurrency(selectedMethodData.min_amount)
                    : "R$ 0,00"}
                </span>
                <span>
                  Disponível: {balance.balance.formatted_available_balance}
                </span>
              </div>
            </div>

            {/* Method Specific Fields */}
            {selectedMethod && renderMethodFields()}

            {/* Fee Calculation */}
            {selectedMethodData && amount && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Resumo do Saque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Valor Solicitado:
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedMethodData.id === 'pix' ? 'Taxa PIX:' : `Taxa (${selectedMethodData.fee}%):`}
                    </span>
                    <span className="text-red-600">
                      -{formatCurrency(calculateFee())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Taxa da Plataforma:
                    </span>
                    <span className="text-red-600">
                      -{formatCurrency(calculateFixedFee())}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Valor Líquido:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {formatCurrency(calculateNetAmount())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Informações Importantes
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  • O processamento pode levar até{" "}
                  {selectedMethodData?.processing_time || "2-3 dias úteis"}
                  <br />
                  • Verifique se os dados estão corretos antes de confirmar
                  <br />• Taxa da plataforma: 5% + R$5,00 fixo
                </p>
              </div>
            </div>
          </form>
          
          {/* Scroll indicator gradient */}
          <div className="absolute bottom-0 left-0 right-2 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || !selectedMethod || !amount || parseFloat(amount) <= 0
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Solicitar Saque
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
