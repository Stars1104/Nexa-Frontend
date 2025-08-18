import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BanknoteIcon, CreditCard, User, Building2, Hash, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { creatorPaymentApi } from "@/api/payment/creatorPayment";

interface BankInfo {
  bank_code: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  cpf: string;
  name: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface BankAccountFormProps {
  onSuccess?: () => void;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_code: '',
    agencia: '',
    agencia_dv: '',
    conta: '',
    conta_dv: '',
    cpf: '',
    name: ''
  });

  // Brazilian bank codes and names
  const bankOptions = [
    { code: '001', name: 'Banco do Brasil S.A.' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Bradesco S.A.' },
    { code: '341', name: 'Itaú Unibanco S.A.' },
    { code: '033', name: 'Santander (Brasil) S.A.' },
    { code: '422', name: 'Banco Safra S.A.' },
    { code: '077', name: 'Banco Inter S.A.' },
    { code: '212', name: 'Banco Original S.A.' },
    { code: '336', name: 'Banco C6 S.A.' },
    { code: '260', name: 'Nu Pagamentos S.A. (Nubank)' },
    { code: '208', name: 'BTG Pactual S.A.' },
    { code: '623', name: 'Banco PAN S.A.' },
    { code: '041', name: 'Banrisul – Banco do Estado do Rio Grande do Sul S.A.' },
    { code: '748', name: 'Sicredi – Cooperativa de Crédito' },
    { code: '756', name: 'Sicoob – Sistema de Cooperativas de Crédito' }
  ];

  // Ensure bankInfo is never undefined
  const safeBankInfo = bankInfo || {
    bank_code: '',
    agencia: '',
    agencia_dv: '',
    conta: '',
    conta_dv: '',
    cpf: '',
    name: ''
  };

  // CPF validation function
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Bank code validation
    if (!safeBankInfo.bank_code.trim()) {
      newErrors.bank_code = 'Código do banco é obrigatório';
    } else if (!/^\d{3,4}$/.test(safeBankInfo.bank_code)) {
      newErrors.bank_code = 'Código do banco deve ter 3 ou 4 dígitos';
    }

    // Agency validation
    if (!safeBankInfo.agencia.trim()) {
      newErrors.agencia = 'Agência é obrigatória';
    } else if (!/^\d{1,5}$/.test(safeBankInfo.agencia)) {
      newErrors.agencia = 'Agência deve ter até 5 dígitos';
    }

    // Agency DV validation
    if (!safeBankInfo.agencia_dv.trim()) {
      newErrors.agencia_dv = 'Dígito da agência é obrigatório';
    } else if (!/^\d{1,2}$/.test(safeBankInfo.agencia_dv)) {
              newErrors.agencia_dv = 'Dígito da agência deve ter 1 ou 2 dígitos';
    }

    // Account validation
    if (!safeBankInfo.conta.trim()) {
      newErrors.conta = 'Conta é obrigatória';
    } else if (!/^\d{1,12}$/.test(safeBankInfo.conta)) {
      newErrors.conta = 'Conta deve ter até 12 dígitos';
    }

    // Account DV validation
    if (!safeBankInfo.conta_dv.trim()) {
      newErrors.conta_dv = 'Dígito da conta é obrigatório';
    } else if (!/^\d{1,2}$/.test(safeBankInfo.conta_dv)) {
              newErrors.conta_dv = 'Dígito da conta deve ter 1 ou 2 dígitos';
    }

    // CPF validation
    if (!safeBankInfo.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(safeBankInfo.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    // Name validation
    if (!safeBankInfo.name.trim()) {
      newErrors.name = 'Nome completo é obrigatório';
    } else if (safeBankInfo.name.trim().split(' ').length < 2) {
      newErrors.name = 'Digite o nome completo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Format CPF input
    if (name === 'cpf') {
      const cleanValue = value.replace(/\D/g, '');
      const formattedValue = cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setBankInfo(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setBankInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBankCodeChange = (value: string) => {
    setBankInfo(prev => ({
      ...prev,
      bank_code: value
    }));

    // Clear error when user selects a bank
    if (errors.bank_code) {
      setErrors(prev => ({
        ...prev,
        bank_code: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await creatorPaymentApi.registerBank(safeBankInfo);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Informações bancárias registradas com sucesso",
        });
        
        // Reset form
        setBankInfo({
          bank_code: '',
          agencia: '',
          agencia_dv: '',
          conta: '',
          conta_dv: '',
          cpf: '',
          name: ''
        });
        setErrors({});
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMessage = result.error || result.message || 'Erro ao registrar informações bancárias';
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Bank registration error:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const result = await creatorPaymentApi.getBankInfo();
        if (result.success && result.data?.bank_info) {
          setBankInfo(result.data.bank_info);
        } else if (result.success && result.data) {
          // If the API returns the bank info directly without the bank_info wrapper
          const bankData = result.data;
          if (bankData.bank_code || bankData.agencia || bankData.conta) {
            setBankInfo({
              bank_code: bankData.bank_code || '',
              agencia: bankData.agencia || '',
              agencia_dv: bankData.agencia_dv || '',
              conta: bankData.conta || '',
              conta_dv: bankData.conta_dv || '',
              cpf: bankData.cpf || '',
              name: bankData.name || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching bank info:', error);
        // Keep the default bankInfo state if there's an error
      }
    };
    fetchBankInfo();
  }, []);

  return (
    <div className="min-h-[90vh] bg-background flex items-start justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BanknoteIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Cadastro Bancário
          </CardTitle>
          <p className="text-muted-foreground">
            Informe seus dados bancários para receber pagamentos
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="w-4 h-4" />
                Informações do Banco
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_code" className="text-sm font-medium text-foreground">
                    <Hash className="inline w-4 h-4 mr-2" />
                    Banco
                  </Label>
                  <Select onValueChange={handleBankCodeChange} value={safeBankInfo.bank_code} defaultValue={safeBankInfo.bank_code}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bank_code && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {errors.bank_code}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="agencia" className="text-sm font-medium text-foreground">
                      <Building2 className="inline w-4 h-4 mr-2" />
                      Agência
                    </Label>
                    <Input
                      id="agencia"
                      name="agencia"
                      type="text"
                      value={safeBankInfo.agencia}
                      onChange={handleChange}
                      placeholder="0000"
                      maxLength={5}
                      pattern="[0-9]{1,5}"
                      className={cn(
                        "transition-all duration-200",
                      )}
                      disabled={isLoading}
                    />
                    {errors.agencia && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {errors.agencia}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agencia_dv" className="text-sm font-medium text-foreground">
                      <Hash className="inline w-4 h-4 mr-2" />
                      Digito da Agência
                    </Label>
                    <Input
                      id="agencia_dv"
                      name="agencia_dv"
                      type="text"
                      value={safeBankInfo.agencia_dv}
                      onChange={handleChange}
                      placeholder="0"
                      maxLength={2}
                      pattern="[0-9]{1,2}"
                      className={cn(
                        "transition-all duration-200",
                      )}
                      disabled={isLoading}
                    />
                    {errors.agencia_dv && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {errors.agencia_dv}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="w-4 h-4" />
                Informações da Conta
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="conta" className="text-sm font-medium text-foreground">
                      <CreditCard className="inline w-4 h-4 mr-2" />
                      Conta
                    </Label>
                    <Input
                      id="conta"
                      name="conta"
                      type="text"
                      value={safeBankInfo.conta}
                      onChange={handleChange}
                      placeholder="00000000"
                      maxLength={12}
                      pattern="[0-9]{1,12}"
                      className={cn(
                        "transition-all duration-200",
                      )}
                      disabled={isLoading}
                    />
                    {errors.conta && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {errors.conta}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="conta_dv" className="text-sm font-medium text-foreground">
                      <Hash className="inline w-4 h-4 mr-2" />
                      Digito da Conta
                    </Label>
                    <Input
                      id="conta_dv"
                      name="conta_dv"
                      type="text"
                      value={safeBankInfo.conta_dv}
                      onChange={handleChange}
                      placeholder="0"
                      maxLength={2}
                      pattern="[0-9]{1,2}"
                      className={cn(
                        "transition-all duration-200",
                      )}
                      disabled={isLoading}
                    />
                    {errors.conta_dv && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        {errors.conta_dv}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4" />
                Informações Pessoais
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium text-foreground">
                    <Shield className="inline w-4 h-4 mr-2" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={safeBankInfo.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={cn(
                      "transition-all duration-200"
                    )}
                    disabled={isLoading}
                  />
                  {errors.cpf && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {errors.cpf}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    <User className="inline w-4 h-4 mr-2" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={safeBankInfo.name}
                    onChange={handleChange}
                    placeholder="Nome completo do titular"
                    className={cn(
                      "transition-all duration-200"
                    )}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </div>
                  )}
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Registrar Informações Bancárias
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountForm; 