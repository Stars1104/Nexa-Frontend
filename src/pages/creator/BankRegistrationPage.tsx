import React, {useState, useCallback, useEffect} from 'react';
import { Loader2 } from 'lucide-react';
import { creatorPaymentApi } from '@/api/payment';
import BankRegistration from '@/components/creator/BankRegistration';

interface BankInfo {
  bank_code: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  cpf: string;
  name: string;
}

interface BankData {
  has_bank_info: boolean;
  bank_info?: BankInfo;
  bank_account_id?: number;
}

const BankRegistrationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  const fetchUserBankData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await creatorPaymentApi.getBankInfo();
        
      if (result.success) {
        setBankData(result.data);
      } else {
        setError(result.error || result.message || 'Failed to fetch bank data');
      }
    } catch (error) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBankData = useCallback(async () => {
    await fetchUserBankData();
  }, [fetchUserBankData]);

  const handleBankDataUpdate = useCallback(async () => {
    await refreshBankData();
  }, [refreshBankData]);

  useEffect(() => {
    fetchUserBankData();
  }, [fetchUserBankData]);

  if (isLoading) {
    return (
      <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações bancárias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-destructive">
            <p className="font-semibold">Erro ao carregar dados bancários</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchUserBankData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <BankRegistration 
      initialBankData={bankData}
      onBankDataUpdate={handleBankDataUpdate}
    />
  );
};

export default BankRegistrationPage; 