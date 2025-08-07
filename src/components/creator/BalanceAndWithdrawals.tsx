import React, { useState, useEffect } from 'react';
import CreatorBalance from './CreatorBalance';
import WithdrawalModal from './WithdrawalModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Clock } from 'lucide-react';
import { hiringApi, CreatorBalance as CreatorBalanceType } from '@/api/hiring';
import { useSafeToast } from '@/hooks/useSafeToast';

// Interface that matches WithdrawalModal's expected CreatorBalance
interface WithdrawalModalBalance {
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

export default function BalanceAndWithdrawals() {
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [balance, setBalance] = useState<CreatorBalanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const safeToast = useSafeToast();

  const loadBalance = async () => {
    try {
      setLoading(true);
      const response = await hiringApi.getCreatorBalance();
      setBalance(response.data);
    } catch (error) {
      console.error('Error loading balance:', error);
      safeToast.error("Falha ao carregar dados do saldo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handleWithdrawalCreated = () => {
    // Refresh balance data after withdrawal
    setShowWithdrawalModal(false);
    loadBalance();
  };

  // Transform balance data to match WithdrawalModal's expected interface
  const transformedBalance: WithdrawalModalBalance | null = balance ? {
    balance: {
      available_balance: balance.balance.available_balance,
      pending_balance: balance.balance.pending_balance,
      total_balance: balance.balance.total_balance,
      total_earned: balance.balance.total_earned,
      total_withdrawn: balance.balance.total_withdrawn,
      formatted_available_balance: balance.balance.formatted_available_balance,
      formatted_pending_balance: balance.balance.formatted_pending_balance,
      formatted_total_balance: balance.balance.formatted_total_balance,
      formatted_total_earned: balance.balance.formatted_total_earned,
      formatted_total_withdrawn: balance.balance.formatted_total_withdrawn,
    },
    earnings: {
      this_month: balance.earnings.this_month,
      this_year: balance.earnings.this_year,
      formatted_this_month: balance.earnings.formatted_this_month,
      formatted_this_year: balance.earnings.formatted_this_year,
    },
    withdrawals: {
      pending_count: balance.withdrawals.pending_count,
      pending_amount: balance.withdrawals.pending_amount,
      formatted_pending_amount: balance.withdrawals.formatted_pending_amount,
    },
    recent_transactions: balance.recent_transactions,
    recent_withdrawals: balance.recent_withdrawals,
  } : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6 dark:bg-[#171717]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saldo e Saques</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seu saldo e solicite saques dos seus ganhos
          </p>
        </div>
        <Button 
          onClick={() => setShowWithdrawalModal(true)}
          className="flex items-center gap-2"
          disabled={!balance || balance.balance.available_balance <= 0}
        >
          <Wallet className="h-4 w-4" />
          Solicitar Saque
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.balance?.formatted_available_balance || 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para saque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.earnings?.formatted_this_month || 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.withdrawals?.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Balance Component */}
      <CreatorBalance />

      {/* Withdrawal Modal */}
      {transformedBalance && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          balance={transformedBalance}
          onWithdrawalCreated={handleWithdrawalCreated}
        />
      )}
    </div>
  );
} 