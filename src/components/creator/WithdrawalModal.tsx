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
        setWithdrawalMethods(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedMethod(response.data.data[0].id);
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
        toast({
          title: "Saque Solicitado",
          description: "Sua solicitação de saque foi enviada com sucesso!",
        });

        onWithdrawalCreated();
        onClose();
        resetForm();
      } else {
        throw new Error(response.data.message || "Erro ao solicitar saque");
      }
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao solicitar saque",
        variant: "destructive",
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

            {/* Withdrawal Method */}
            <div className="space-y-3">
              <Label>Método de Saque</Label>
              {isLoadingMethods ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de saque" />
                  </SelectTrigger>
                  <SelectContent>
                    {withdrawalMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(method.id)}
                          <span>{method.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Method Details */}
            {selectedMethodData && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      {getMethodIcon(selectedMethodData.id)}
                      {selectedMethodData.name}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      {selectedMethodData.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-600 dark:text-blue-300">
                      <div>
                        Min: {formatCurrency(selectedMethodData.min_amount)}
                      </div>
                      <div>
                        Max: {formatCurrency(selectedMethodData.max_amount)}
                      </div>
                      <div>{getFeeDisplay()}</div>
                      <div>Tempo: {selectedMethodData.processing_time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
