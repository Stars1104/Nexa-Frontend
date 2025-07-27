import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  RefreshCw,
  Eye,
  Copy
} from 'lucide-react';

interface Transaction {
  id: number;
  pagarme_transaction_id: string;
  status: string;
  amount: string;
  payment_method: string;
  card_brand?: string;
  card_last4?: string;
  card_holder_name: string;
  payment_data: any;
  paid_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<TransactionHistoryResponse>('/payment/transactions');
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount) / 100; // Convert from cents to reais
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const getPaymentMethodIcon = (method: string, brand?: string) => {
    if (method === 'credit_card') {
      return <CreditCard className="w-4 h-4" />;
    }
    return <DollarSign className="w-4 h-4" />;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const downloadReceipt = (transaction: Transaction) => {
    // Create a simple receipt text
    const receipt = `
NEXA UGC - Recibo de Pagamento
==============================

ID da Transação: ${transaction.pagarme_transaction_id}
Data: ${formatDate(transaction.created_at)}
Valor: ${formatCurrency(transaction.amount)}
Status: ${transaction.status.toUpperCase()}
Método de Pagamento: ${transaction.payment_method.toUpperCase()}
Cartão: ${transaction.card_brand?.toUpperCase()} ****${transaction.card_last4}
Titular: ${transaction.card_holder_name}

Assinatura Premium: 30 dias
Válido até: ${formatDate(transaction.expires_at)}

Obrigado pela sua assinatura!
    `.trim();

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa-recibo-${transaction.pagarme_transaction_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Recibo Baixado",
      description: "O recibo de pagamento foi baixado",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 dark:bg-[#171717]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Transações</h1>
          <p className="text-muted-foreground">
            Visualize todas as suas transações de pagamento e histórico de assinatura
          </p>
        </div>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumo de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {transactions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Transações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter(t => t.status === 'paid').length}
              </div>
              <div className="text-sm text-muted-foreground">Pagamentos Realizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + parseFloat(t.amount), 0).toString())}
              </div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Transações Recentes</h2>
        
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma transação encontrada. Seu histórico de pagamentos aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(transaction.payment_method, transaction.card_brand)}
                    <div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.card_brand?.toUpperCase()} ****{transaction.card_last4}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(transaction.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <span className="ml-2 text-foreground">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Titular:</span>
                    <span className="ml-2 text-foreground">
                      {transaction.card_holder_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID da Transação:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-foreground font-mono text-xs">
                        {transaction.pagarme_transaction_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.pagarme_transaction_id, 'ID da Transação')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Válido até:</span>
                    <span className="ml-2 text-foreground">
                      {formatDate(transaction.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReceipt(transaction)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Recibo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalhes da Transação</CardTitle>
              <CardDescription>
                Informações detalhadas sobre este pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <div className="text-lg font-semibold text-foreground">
                    {formatCurrency(selectedTransaction.amount)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID da Transação</label>
                  <div className="text-sm font-mono text-foreground">
                    {selectedTransaction.pagarme_transaction_id}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                  <div className="text-foreground">
                    {selectedTransaction.payment_method.toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bandeira do Cartão</label>
                  <div className="text-foreground">
                    {selectedTransaction.card_brand?.toUpperCase() || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Últimos 4 Dígitos</label>
                  <div className="text-foreground">
                    ****{selectedTransaction.card_last4}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Titular do Cartão</label>
                  <div className="text-foreground">
                    {selectedTransaction.card_holder_name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pago em</label>
                  <div className="text-foreground">
                    {formatDate(selectedTransaction.paid_at)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                  <div className="text-foreground">
                    {formatDate(selectedTransaction.created_at)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expira em</label>
                  <div className="text-foreground">
                    {formatDate(selectedTransaction.expires_at)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => downloadReceipt(selectedTransaction)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Recibo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 