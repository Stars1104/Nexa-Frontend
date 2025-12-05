import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { brandPaymentApi } from '@/api/payment/brandPayment';
import { translateTransactionStatus } from '@/utils/translationUtils';
import {
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BrandTransaction {
  id: number;
  contract_id: number;
  contract_title: string;
  contract_budget: number;
  creator: {
    id: number;
    name: string;
    email: string;
  } | null;
  pagarme_transaction_id: string;
  stripe_payment_intent_id: string;
  stripe_charge_id: string;
  status: string;
  amount: string;
  payment_method: string;
  card_brand: string;
  card_last4: string;
  card_holder_name: string;
  paid_at: string;
  created_at: string;
}

export default function BrandTransactions() {
  const [transactions, setTransactions] = useState<BrandTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const { toast } = useToast();

  const loadTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await brandPaymentApi.getBrandTransactionHistory(page, 10);
      
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao carregar transações',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar transações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage]);

  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const translatedStatus = translateTransactionStatus(status);
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translatedStatus}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {translatedStatus}
          </Badge>
        );
      case 'pending':
      case 'processing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {translatedStatus}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {translatedStatus}
          </Badge>
        );
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === 'credit_card' || method?.toLowerCase().includes('card')) {
      return <DollarSign className="w-4 h-4" />;
    }
    return <DollarSign className="w-4 h-4" />;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      transaction.contract_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.creator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.creator?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || transaction.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full p-6 space-y-6 dark:bg-[#171717]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todas as transações relacionadas aos seus contratos
          </p>
        </div>
        <Button
          onClick={() => loadTransactions(currentPage)}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por contrato, criador ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `${pagination.total} transação${pagination.total !== 1 ? 'ões' : ''} encontrada${pagination.total !== 1 ? 's' : ''}`
              : 'Nenhuma transação encontrada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nenhuma transação encontrada com os filtros aplicados'
                  : 'Nenhuma transação encontrada'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Criador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          #{transaction.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.contract_title}</div>
                            <div className="text-xs text-muted-foreground">
                              Contrato #{transaction.contract_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.creator ? (
                            <div>
                              <div className="font-medium">{transaction.creator.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.creator.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.payment_method)}
                            <div>
                              <div className="text-sm">
                                {transaction.card_brand || transaction.payment_method}
                              </div>
                              {transaction.card_last4 && (
                                <div className="text-xs text-muted-foreground">
                                  ****{transaction.card_last4}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(transaction.created_at)}
                          </div>
                          {transaction.paid_at && (
                            <div className="text-xs text-muted-foreground">
                              Pago: {formatDate(transaction.paid_at)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {pagination.from} a {pagination.to} de {pagination.total} transações
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.last_page || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

