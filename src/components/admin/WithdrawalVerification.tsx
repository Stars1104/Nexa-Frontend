import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface WithdrawalVerification {
  id: number;
  amount: string;
  withdrawal_method: string;
  status: string;
  transaction_id: string | null;
  processed_at: string | null;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  verification_status: 'passed' | 'failed' | 'pending';
  bank_details_match: boolean;
  amount_verification: boolean;
}

interface VerificationReport {
  summary: {
    total_withdrawals: number;
    total_amount: number;
    verification_passed: number;
    verification_failed: number;
    pending_verification: number;
  };
  withdrawals: WithdrawalVerification[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface DetailedVerification {
  withdrawal: {
    id: number;
    amount: string;
    withdrawal_method: string;
    status: string;
    transaction_id: string | null;
    processed_at: string | null;
    created_at: string;
    withdrawal_details: any;
  };
  creator: {
    id: number;
    name: string;
    email: string;
  };
  bank_account_verification: {
    withdrawal_bank_details: any;
    current_bank_account: any;
    details_match: boolean;
  };
  verification_summary: {
    withdrawal_amount_correct: boolean;
    bank_details_consistent: boolean;
    transaction_id_valid: boolean;
    processing_time_reasonable: boolean;
    overall_verification_status: string;
  };
}

export default function WithdrawalVerification() {
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: 'all',
    withdrawal_method: 'all',
  });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<DetailedVerification | null>(null);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const { toast } = useToast();

  const fetchVerificationReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.withdrawal_method && filters.withdrawal_method !== 'all') params.append('withdrawal_method', filters.withdrawal_method);

      const response = await apiClient.get(`/admin/payouts/verification-report?${params}`);
      setReport(response.data.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar relatório de verificação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedVerification = async (withdrawalId: number) => {
    setDetailedLoading(true);
    try {
      const response = await apiClient.get(`/admin/payouts/${withdrawalId}/verify`);
      setSelectedWithdrawal(response.data.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar detalhes da verificação',
        variant: 'destructive',
      });
    } finally {
      setDetailedLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationReport();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(amount.replace('R$ ', '').replace(',', '.')));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verificação de Saques</h1>
          <p className="text-muted-foreground">
            Verifique se os fundos foram retirados corretamente para as contas bancárias registradas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border transition-colors">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Filtros de Verificação
          </CardTitle>
          <CardDescription>
            Configure os filtros para verificar saques específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-sm font-medium">Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setFilters({ ...filters, start_date: date ? format(date, 'yyyy-MM-dd') : '' });
                    }}
                    initialFocus
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              {startDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setFilters({ ...filters, start_date: '' });
                  }}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-sm font-medium">Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setFilters({ ...filters, end_date: date ? format(date, 'yyyy-MM-dd') : '' });
                    }}
                    initialFocus
                    locale={ptBR}
                    className="rounded-md border"
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEndDate(undefined);
                    setFilters({ ...filters, end_date: '' });
                  }}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="method">Método</Label>
              <Select value={filters.withdrawal_method} onValueChange={(value) => setFilters({ ...filters, withdrawal_method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="pagarme_bank_transfer">Pagar.me</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setStartDate(sevenDaysAgo);
                setEndDate(today);
                setFilters({
                  ...filters,
                  start_date: format(sevenDaysAgo, 'yyyy-MM-dd'),
                  end_date: format(today, 'yyyy-MM-dd')
                });
              }}
              className="text-xs"
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setStartDate(thirtyDaysAgo);
                setEndDate(today);
                setFilters({
                  ...filters,
                  start_date: format(thirtyDaysAgo, 'yyyy-MM-dd'),
                  end_date: format(today, 'yyyy-MM-dd')
                });
              }}
              className="text-xs"
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(firstDayOfMonth);
                setEndDate(today);
                setFilters({
                  ...filters,
                  start_date: format(firstDayOfMonth, 'yyyy-MM-dd'),
                  end_date: format(today, 'yyyy-MM-dd')
                });
              }}
              className="text-xs"
            >
              Este mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                setFilters({
                  ...filters,
                  start_date: '',
                  end_date: ''
                });
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar datas
            </Button>
          </div>

          {/* Apply Filters Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {startDate && endDate && (
                <span>
                  Período: {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>
                        <Button 
              onClick={fetchVerificationReport} 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg font-medium px-6 py-2 rounded-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aplicar Filtros
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.total_withdrawals}</div>
              <p className="text-xs text-muted-foreground">
                Valor total: {formatCurrency(report.summary.total_amount.toString())}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{report.summary.verification_passed}</div>
              <p className="text-xs text-muted-foreground">
                {((report.summary.verification_passed / report.summary.total_withdrawals) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.summary.verification_failed}</div>
              <p className="text-xs text-muted-foreground">
                {((report.summary.verification_failed / report.summary.total_withdrawals) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{report.summary.pending_verification}</div>
              <p className="text-xs text-muted-foreground">
                {((report.summary.pending_verification / report.summary.total_withdrawals) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Withdrawals Table */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Saques</CardTitle>
            <CardDescription>
              Lista de saques com status de verificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="min-w-[150px]">Criador</TableHead>
                    <TableHead className="w-24">Valor</TableHead>
                    <TableHead className="min-w-[120px]">Método</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-24">Verificação</TableHead>
                    <TableHead className="min-w-[100px]">Data</TableHead>
                    <TableHead className="w-16">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {report.withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>#{withdrawal.id}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{withdrawal.creator.name}</div>
                        <div className="text-sm text-muted-foreground truncate" title={withdrawal.creator.email}>
                          {withdrawal.creator.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{withdrawal.amount}</TableCell>
                    <TableCell className="max-w-[120px]">
                      <div className="truncate" title={withdrawal.withdrawal_method}>
                        {withdrawal.withdrawal_method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={withdrawal.status === 'completed' ? 'default' : 'secondary'}>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.verification_status)}
                        {getStatusBadge(withdrawal.verification_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {withdrawal.processed_at ? (
                        format(new Date(withdrawal.processed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchDetailedVerification(withdrawal.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Verificação - Saque #{withdrawal.id}</DialogTitle>
                            <DialogDescription>
                              Verificação detalhada do saque e conta bancária
                            </DialogDescription>
                          </DialogHeader>
                          {detailedLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-sm text-muted-foreground">Carregando detalhes...</p>
                              </div>
                            </div>
                          ) : selectedWithdrawal ? (
                            <div className="space-y-6">
                              {/* Withdrawal Details */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Detalhes do Saque</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Valor</Label>
                                      <p className="text-lg font-bold break-words">{selectedWithdrawal.withdrawal.amount}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Método</Label>
                                      <p className="break-words">{selectedWithdrawal.withdrawal.withdrawal_method}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Status</Label>
                                      <div>
                                        <Badge>{selectedWithdrawal.withdrawal.status}</Badge>
                                      </div>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                      <Label className="text-sm font-medium">ID da Transação</Label>
                                      <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded border">
                                        {selectedWithdrawal.withdrawal.transaction_id || 'N/A'}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Criado em</Label>
                                      <p className="break-words">{format(new Date(selectedWithdrawal.withdrawal.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Processado em</Label>
                                      <p className="break-words">
                                        {selectedWithdrawal.withdrawal.processed_at 
                                          ? format(new Date(selectedWithdrawal.withdrawal.processed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                          : 'N/A'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Creator Information */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Informações do Criador</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Nome</Label>
                                      <p className="break-words">{selectedWithdrawal.creator.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="break-all font-mono text-sm bg-muted/50 p-2 rounded border">
                                        {selectedWithdrawal.creator.email}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Bank Account Verification */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Verificação da Conta Bancária</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      {selectedWithdrawal.bank_account_verification.details_match ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                      <span className="font-medium">
                                        Detalhes bancários {selectedWithdrawal.bank_account_verification.details_match ? 'coincidem' : 'não coincidem'}
                                      </span>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Withdrawal Bank Details */}
                                      <div>
                                        <h4 className="font-medium mb-3">Detalhes do Saque</h4>
                                        {selectedWithdrawal.bank_account_verification.withdrawal_bank_details ? (
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Banco:</strong> {selectedWithdrawal.bank_account_verification.withdrawal_bank_details.bank_code}</div>
                                            <div><strong>Agência:</strong> {selectedWithdrawal.bank_account_verification.withdrawal_bank_details.agencia}-{selectedWithdrawal.bank_account_verification.withdrawal_bank_details.agencia_dv}</div>
                                            <div><strong>Conta:</strong> {selectedWithdrawal.bank_account_verification.withdrawal_bank_details.conta}-{selectedWithdrawal.bank_account_verification.withdrawal_bank_details.conta_dv}</div>
                                            <div><strong>CPF:</strong> {selectedWithdrawal.bank_account_verification.withdrawal_bank_details.cpf}</div>
                                            <div><strong>Nome:</strong> {selectedWithdrawal.bank_account_verification.withdrawal_bank_details.name}</div>
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground">Nenhum detalhe bancário encontrado</p>
                                        )}
                                      </div>

                                      {/* Current Bank Account */}
                                      <div>
                                        <h4 className="font-medium mb-3">Conta Atual</h4>
                                        {selectedWithdrawal.bank_account_verification.current_bank_account ? (
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Banco:</strong> {selectedWithdrawal.bank_account_verification.current_bank_account.bank_code}</div>
                                            <div><strong>Agência:</strong> {selectedWithdrawal.bank_account_verification.current_bank_account.agencia}-{selectedWithdrawal.bank_account_verification.current_bank_account.agencia_dv}</div>
                                            <div><strong>Conta:</strong> {selectedWithdrawal.bank_account_verification.current_bank_account.conta}-{selectedWithdrawal.bank_account_verification.current_bank_account.conta_dv}</div>
                                            <div><strong>CPF:</strong> {selectedWithdrawal.bank_account_verification.current_bank_account.cpf}</div>
                                            <div><strong>Nome:</strong> {selectedWithdrawal.bank_account_verification.current_bank_account.name}</div>
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground">Nenhuma conta bancária registrada</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Verification Summary */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Resumo da Verificação</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span>Valor do saque correto</span>
                                      {selectedWithdrawal.verification_summary.withdrawal_amount_correct ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>Detalhes bancários consistentes</span>
                                      {selectedWithdrawal.verification_summary.bank_details_consistent ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>ID da transação válido</span>
                                      {selectedWithdrawal.verification_summary.transaction_id_valid ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>Tempo de processamento razoável</span>
                                      {selectedWithdrawal.verification_summary.processing_time_reasonable ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">Status Geral</span>
                                      {getStatusBadge(selectedWithdrawal.verification_summary.overall_verification_status)}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!report && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum dado de verificação encontrado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 