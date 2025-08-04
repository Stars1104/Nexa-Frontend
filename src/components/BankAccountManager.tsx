import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BanknoteIcon, 
  CreditCard, 
  User, 
  Building2, 
  Shield, 
  CheckCircle, 
  Edit,
  Plus,
  Trash2
} from "lucide-react";
import { creatorPaymentApi } from "@/api/payment/creatorPayment";
import BankAccountForm from "./BankAccountForm";

interface BankInfo {
  bank_code: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  cpf: string;
  name: string;
}

const BankAccountManager: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bank account information
  const fetchBankInfo = async () => {
    try {
      setIsLoading(true);
      const result = await creatorPaymentApi.getBankInfo();
      
      if (result.success && result.data) {
        // Check if we have bank info in the response
        const bankData = result.data.bank_info || result.data;
        
        if (bankData && (bankData.bank_code || bankData.agencia || bankData.conta)) {
          setBankInfo({
            bank_code: bankData.bank_code || '',
            agencia: bankData.agencia || '',
            agencia_dv: bankData.agencia_dv || '',
            conta: bankData.conta || '',
            conta_dv: bankData.conta_dv || '',
            cpf: bankData.cpf || '',
            name: bankData.name || ''
          });
          setHasBankAccount(true);
        } else {
          setHasBankAccount(false);
          setBankInfo(null);
        }
      } else {
        setHasBankAccount(false);
        setBankInfo(null);
      }
    } catch (error) {
      console.error('Error fetching bank info:', error);
      setHasBankAccount(false);
      setBankInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete bank account
  const handleDeleteBankAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir suas informações bancárias?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await creatorPaymentApi.deleteBankInfo();
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Informações bancárias excluídas com sucesso",
        });
        setHasBankAccount(false);
        setBankInfo(null);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao excluir informações bancárias",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting bank info:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir informações bancárias",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
    fetchBankInfo(); // Refresh the bank info
  };

  useEffect(() => {
    fetchBankInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg border-border">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-lg">Carregando informações bancárias...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form if user wants to register
  if (showRegistrationForm) {
    return (
      <div className="min-h-[90vh] bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="ml-4">
            <Button
              variant="outline"
              onClick={() => setShowRegistrationForm(false)}
              className="mb-4"
            >
              ← Voltar
            </Button>
          </div>
          <BankAccountForm onSuccess={handleRegistrationSuccess} />
        </div>
      </div>
    );
  }

  // Show existing bank account information
  if (hasBankAccount && bankInfo) {
    return (
      <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg border-border">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Conta Bancária Registrada
            </CardTitle>
            <Badge variant="secondary" className="mx-auto">
              Ativo
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Bank Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="w-4 h-4" />
                Informações do Banco
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Código do Banco
                  </label>
                  <p className="text-foreground font-medium">{bankInfo.bank_code}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Agência
                  </label>
                  <p className="text-foreground font-medium">
                    {bankInfo.agencia}-{bankInfo.agencia_dv}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="w-4 h-4" />
                Informações da Conta
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Conta
                  </label>
                  <p className="text-foreground font-medium">
                    {bankInfo.conta}-{bankInfo.conta_dv}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4" />
                Informações Pessoais
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    CPF
                  </label>
                  <p className="text-foreground font-medium">{bankInfo.cpf}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome Completo
                  </label>
                  <p className="text-foreground font-medium">{bankInfo.name}</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Segurança</p>
                  <p>
                    Suas informações bancárias são criptografadas e armazenadas com segurança. 
                    Utilizamos padrões bancários para proteger seus dados.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRegistrationForm(true)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Informações
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBankAccount}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration prompt if no bank account
  return (
    <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BanknoteIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Cadastro Bancário
          </CardTitle>
          <p className="text-muted-foreground">
            Para receber pagamentos, você precisa cadastrar suas informações bancárias
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">Receba pagamentos diretamente na sua conta</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">Processamento seguro e rápido</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm">Dados criptografados e protegidos</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Segurança</p>
                <p>
                  Suas informações bancárias são criptografadas e armazenadas com segurança. 
                  Utilizamos padrões bancários para proteger seus dados.
                </p>
              </div>
            </div>
          </div>

          {/* Register Button */}
          <Button
            onClick={() => setShowRegistrationForm(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Informações Bancárias
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountManager; 