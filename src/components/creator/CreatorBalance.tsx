import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { hiringApi, CreatorBalance as CreatorBalanceType, Withdrawal, WithdrawalMethod } from '@/api/hiring';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Plus,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function CreatorBalance() {
  const [balance, setBalance] = useState<CreatorBalanceType | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceRes, withdrawalsRes, methodsRes] = await Promise.all([
        hiringApi.getCreatorBalance(),
        hiringApi.getWithdrawals(),
        hiringApi.getWithdrawalMethods(),
      ]);

      setBalance(balanceRes.data);
      setWithdrawals(withdrawalsRes.data.data);
      setWithdrawalMethods(methodsRes.data);
    } catch (error) {
      console.error('Error loading balance data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do saldo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Nenhum dado de saldo disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {balance.balance.formatted_available_balance}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para saque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {balance.balance.formatted_pending_balance}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balance.balance.formatted_total_earned}
            </div>
            <p className="text-xs text-muted-foreground">
              Desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sacado</CardTitle>
            <Download className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {balance.balance.formatted_total_withdrawn}
            </div>
            <p className="text-xs text-muted-foreground">
              Saques realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings This Month/Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ganhos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {balance.earnings.formatted_this_month}
            </div>
            <p className="text-sm text-gray-600">
              Janeiro 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ganhos do Ano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {balance.earnings.formatted_this_year}
            </div>
            <p className="text-sm text-gray-600">
              2024
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
          <DialogTrigger asChild>
            <Button 
              className="flex-1" 
              disabled={balance.balance.available_balance <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Saque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Saque</DialogTitle>
            </DialogHeader>
            <WithdrawalForm 
              availableBalance={Number(balance.balance.available_balance) || 0}
              withdrawalMethods={withdrawalMethods}
              onSuccess={() => {
                setShowWithdrawalDialog(false);
                loadData();
              }}
            />
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          Ver Histórico
        </Button>
      </div>

      {/* Pending Withdrawals Alert */}
      {balance.withdrawals.pending_count > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {balance.withdrawals.pending_count} saque(s) pendente(s)
                </p>
                <p className="text-sm text-yellow-700">
                  Total: {balance.withdrawals.formatted_pending_amount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Details */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transações Recentes</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
          <TabsTrigger value="methods">Métodos de Saque</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {balance.recent_transactions.length > 0 ? (
                <div className="space-y-3">
                  {balance.recent_transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.contract_title}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.processed_at && formatDate(transaction.processed_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{transaction.amount}</p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma transação recente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{withdrawal.amount}</p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.method} • {formatDate(withdrawal.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={withdrawal.status_badge_color}>
                          {withdrawal.status}
                        </Badge>
                        {withdrawal.can_be_cancelled && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleCancelWithdrawal(withdrawal.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum saque realizado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Saque Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">ℹ</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Saque via Pagar.me
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Atualmente, apenas transferências bancárias via Pagar.me estão disponíveis. 
                      Você precisa ter uma conta bancária registrada para solicitar saques.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4">
                {withdrawalMethods.map((method) => (
                  <div key={method.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{method.name}</h4>
                      <Badge variant="outline">
                        Taxa: R$ {method.fee.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mínimo:</span>
                        <span className="ml-1 font-medium">R$ {method.min_amount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Máximo:</span>
                        <span className="ml-1 font-medium">R$ {method.max_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Processamento: {method.processing_time}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Withdrawal Form Component
interface WithdrawalFormProps {
  availableBalance: number;
  withdrawalMethods: WithdrawalMethod[];
  onSuccess: () => void;
}

function WithdrawalForm({ availableBalance, withdrawalMethods, onSuccess }: WithdrawalFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Ensure availableBalance is always a number
  const safeAvailableBalance = Number(availableBalance) || 0;
  const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > safeAvailableBalance) {
      toast({
        title: "Erro",
        description: "Valor excede o saldo disponível",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethodData) {
      if (parseFloat(amount) < selectedMethodData.min_amount) {
        toast({
          title: "Erro",
          description: `Valor mínimo para ${selectedMethodData.name} é R$ ${selectedMethodData.min_amount.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }

      if (parseFloat(amount) > selectedMethodData.max_amount) {
        toast({
          title: "Erro",
          description: `Valor máximo para ${selectedMethodData.name} é R$ ${selectedMethodData.max_amount.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await hiringApi.createWithdrawal({
        amount: parseFloat(amount),
        withdrawal_method: selectedMethod,
        withdrawal_details: formData,
      });

      toast({
        title: "Sucesso",
        description: "Solicitação de saque enviada com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || 'Erro ao solicitar saque',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormFields = () => {
    if (!selectedMethodData) return [];

    // Use dynamic field configuration if available
    if (selectedMethodData.field_config) {
      return Object.entries(selectedMethodData.field_config).map(([fieldName, config]) => ({
        name: fieldName,
        label: config.label,
        required: config.required,
        type: config.type || 'text',
        options: config.options,
      }));
    }

    // Fallback to hardcoded fields for backward compatibility
    switch (selectedMethod) {
      case 'pagarme_bank_transfer':
        return []; // No additional fields needed for Pagar.me bank transfer
      case 'bank_transfer':
        return [
          { name: 'bank', label: 'Banco', required: true },
          { name: 'agency', label: 'Agência', required: true },
          { name: 'account', label: 'Conta', required: true },
          { name: 'account_type', label: 'Tipo de Conta', required: true, type: 'select', options: [
            { value: 'checking', label: 'Conta Corrente' },
            { value: 'savings', label: 'Conta Poupança' },
          ]},
          { name: 'holder_name', label: 'Nome do Titular', required: true },
        ];
      case 'pix':
        return [
          { name: 'pix_key', label: 'Chave PIX', required: true },
          { name: 'pix_key_type', label: 'Tipo de Chave', required: true, type: 'select', options: [
            { value: 'cpf', label: 'CPF' },
            { value: 'cnpj', label: 'CNPJ' },
            { value: 'email', label: 'E-mail' },
            { value: 'phone', label: 'Telefone' },
            { value: 'random', label: 'Chave Aleatória' },
          ]},
          { name: 'holder_name', label: 'Nome do Titular', required: true },
        ];
      case 'pagarme_account':
        return [
          { name: 'holder_name', label: 'Nome do Titular', required: true },
        ];
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Método de Saque</label>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="w-full p-2 border rounded-md text-black outline-none"
          required
        >
          <option value="">Selecione um método</option>
          {withdrawalMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name} - Taxa: R$ {method.fee.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Valor (R$)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={selectedMethodData?.min_amount || 0}
          max={Math.min(safeAvailableBalance, selectedMethodData?.max_amount || safeAvailableBalance)}
          step="0.01"
          className="w-full p-2 border rounded-md text-black outline-none"
          placeholder="0,00"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Saldo disponível: R$ {safeAvailableBalance.toFixed(2)}
        </p>
      </div>

      {selectedMethod && (
        <div className="space-y-3">
          <h4 className="font-medium">Dados para Saque</h4>
          {selectedMethod === 'pagarme_bank_transfer' ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
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
          ) : (
            getFormFields().map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required={field.required}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required={field.required}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Processando...' : 'Solicitar Saque'}
        </Button>
      </div>
    </form>
  );
}

async function handleCancelWithdrawal(withdrawalId: number) {
  // Implementation for canceling withdrawal
  console.log('Cancel withdrawal:', withdrawalId);
} 