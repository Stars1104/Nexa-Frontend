import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  BanknoteIcon, 
  User, 
  Building2, 
  Hash, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
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

interface BankData {
  has_bank_info: boolean;
  bank_info?: BankInfo;
  bank_account_id?: number;
}

interface ValidationErrors {
  [key: string]: string;
}

interface BankRegistrationProps {
  initialBankData?: BankData | null;
  onBankDataUpdate?: () => void;
}

const BankRegistration: React.FC<BankRegistrationProps> = ({ 
  initialBankData, 
  onBankDataUpdate 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [existingBankInfo, setExistingBankInfo] = useState<BankInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  // CPF validation function
  const validateCPF = useCallback((cpf: string): boolean => {
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
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Bank code validation
    if (!bankInfo.bank_code.trim()) {
      newErrors.bank_code = 'Código do banco é obrigatório';
    } else if (!/^\d{3,4}$/.test(bankInfo.bank_code)) {
      newErrors.bank_code = 'Código do banco deve ter 3 ou 4 dígitos';
    }

    // Agency validation
    if (!bankInfo.agencia.trim()) {
      newErrors.agencia = 'Agência é obrigatória';
    } else if (!/^\d{1,5}$/.test(bankInfo.agencia)) {
      newErrors.agencia = 'Agência deve ter até 5 dígitos';
    }

    // Agency DV validation
    if (!bankInfo.agencia_dv.trim()) {
      newErrors.agencia_dv = 'Dígito da agência é obrigatório';
    } else if (!/^\d{1,2}$/.test(bankInfo.agencia_dv)) {
      newErrors.agencia_dv = 'Dígito da agência deve ter 1 ou 2 dígitos';
    }

    // Account validation
    if (!bankInfo.conta.trim()) {
      newErrors.conta = 'Conta é obrigatória';
    } else if (!/^\d{1,12}$/.test(bankInfo.conta)) {
      newErrors.conta = 'Conta deve ter até 12 dígitos';
    }

    // Account DV validation
    if (!bankInfo.conta_dv.trim()) {
      newErrors.conta_dv = 'Dígito da conta é obrigatório';
    } else if (!/^\d{1,2}$/.test(bankInfo.conta_dv)) {
      newErrors.conta_dv = 'Dígito da conta deve ter 1 ou 2 dígitos';
    }

    // CPF validation
    if (!bankInfo.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(bankInfo.cpf)) {
      newErrors.cpf = 'CPF deve estar no formato XXX.XXX.XXX-XX';
    } else if (!validateCPF(bankInfo.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    // Name validation
    if (!bankInfo.name.trim()) {
      newErrors.name = 'Nome do titular é obrigatório';
    } else if (bankInfo.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bankInfo, validateCPF]);

  // Initialize bank data from props
  useEffect(() => {
    if (initialBankData) {
      if (initialBankData.has_bank_info && initialBankData.bank_info) {
        const bankData = initialBankData.bank_info;
        setExistingBankInfo(bankData);
        setBankInfo(bankData);
      } else {
        setExistingBankInfo(null);
        setBankInfo({
          bank_code: '',
          agencia: '',
          agencia_dv: '',
          conta: '',
          conta_dv: '',
          cpf: '',
          name: ''
        });
      }
    }
  }, [initialBankData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      let result;
      
      if (existingBankInfo && !isEditing) {
        // Update existing bank info
        result = await creatorPaymentApi.updateBankInfo(bankInfo);
      } else {
        // Register new bank info
        result = await creatorPaymentApi.registerBank(bankInfo);
      }

      if (result.success) {
        
        toast({
          title: "Sucesso!",
          description: existingBankInfo && !isEditing 
            ? "Informações bancárias atualizadas com sucesso"
            : "Informações bancárias registradas com sucesso",
        });
        
        // Call parent callback to refresh data
        if (onBankDataUpdate) {
          onBankDataUpdate();
        }
        setIsEditing(false);
      } else {
        const errorMessage = result.error || result.message || 'Erro ao processar informações bancárias';
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

  const handleDelete = async () => {
    if (!existingBankInfo) return;

    if (!confirm('Tem certeza que deseja remover suas informações bancárias?')) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await creatorPaymentApi.deleteBankInfo();

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Informações bancárias removidas com sucesso",
        });
        
        // Clear all bank information
        setExistingBankInfo(null);
        setBankInfo({
          bank_code: '',
          agencia: '',
          agencia_dv: '',
          conta: '',
          conta_dv: '',
          cpf: '',
          name: ''
        });
        setIsEditing(false);
        setErrors({});
        
        // Call parent callback to refresh data
        if (onBankDataUpdate) {
          onBankDataUpdate();
        }
      } else {
        const errorMessage = result.error || result.message || 'Erro ao remover informações bancárias';
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to existing data
    if (existingBankInfo) {
      setBankInfo({
        bank_code: existingBankInfo.bank_code,
        agencia: existingBankInfo.agencia,
        agencia_dv: existingBankInfo.agencia_dv,
        conta: existingBankInfo.conta,
        conta_dv: existingBankInfo.conta_dv,
        cpf: existingBankInfo.cpf,
        name: existingBankInfo.name
      });
    }
    setErrors({});
  };

  return (
    <div className="min-h-[90vh] bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BanknoteIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {existingBankInfo ? 'Informações Bancárias' : 'Cadastro Bancário'}
          </CardTitle>
          <p className="text-muted-foreground">
            {existingBankInfo 
              ? 'Gerencie suas informações bancárias para receber pagamentos'
              : 'Informe seus dados bancários para receber pagamentos'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          {existingBankInfo && !isEditing ? (
            // Display existing bank info
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Dados Bancários</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Banco</Label>
                    <p className="text-foreground">{existingBankInfo.bank_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Agência</Label>
                    <p className="text-foreground">{existingBankInfo.agencia}-{existingBankInfo.agencia_dv}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Conta</Label>
                    <p className="text-foreground">{existingBankInfo.conta}-{existingBankInfo.conta_dv}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                    <p className="text-foreground">{existingBankInfo.cpf}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Nome do Titular</Label>
                    <p className="text-foreground">{existingBankInfo.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Informações bancárias configuradas</span>
              </div>
            </div>
          ) : (
            // Bank registration form
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
                      Código do Banco
                    </Label>
                    <Select
                      value={bankInfo.bank_code}
                      onValueChange={handleBankCodeChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={cn(
                        "transition-all duration-200",
                        errors.bank_code && "border-destructive focus:border-destructive"
                      )}>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankOptions.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.code} - {bank.name}
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

                  <div className="space-y-2">
                    <Label htmlFor="agencia" className="text-sm font-medium text-foreground">
                      Agência
                    </Label>
                    <Input
                      id="agencia"
                      name="agencia"
                      type="text"
                      value={bankInfo.agencia}
                      onChange={handleChange}
                      placeholder="Ex: 1234"
                      maxLength={5}
                      pattern="[0-9]{1,5}"
                      className={cn(
                        "transition-all duration-200",
                        errors.agencia && "border-destructive focus:border-destructive"
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
                      Digito da Agência
                    </Label>
                    <Input
                      id="agencia_dv"
                      name="agencia_dv"
                      type="text"
                      value={bankInfo.agencia_dv}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                      maxLength={2}
                      pattern="[0-9]{1,2}"
                      className={cn(
                        "transition-all duration-200",
                        errors.agencia_dv && "border-destructive focus:border-destructive"
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

                  <div className="space-y-2">
                    <Label htmlFor="conta" className="text-sm font-medium text-foreground">
                      Conta
                    </Label>
                    <Input
                      id="conta"
                      name="conta"
                      type="text"
                      value={bankInfo.conta}
                      onChange={handleChange}
                      placeholder="Ex: 12345678"
                      maxLength={12}
                      pattern="[0-9]{1,12}"
                      className={cn(
                        "transition-all duration-200",
                        errors.conta && "border-destructive focus:border-destructive"
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
                      Digito da Conta
                    </Label>
                    <Input
                      id="conta_dv"
                      name="conta_dv"
                      type="text"
                      value={bankInfo.conta_dv}
                      onChange={handleChange}
                      placeholder="Ex: 9"
                      maxLength={2}
                      pattern="[0-9]{1,2}"
                      className={cn(
                        "transition-all duration-200",
                        errors.conta_dv && "border-destructive focus:border-destructive"
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
                      value={bankInfo.cpf}
                      onChange={handleChange}
                      placeholder="Ex: 123.456.789-00"
                      maxLength={14}
                      className={cn(
                        "transition-all duration-200",
                        errors.cpf && "border-destructive focus:border-destructive"
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
                      Nome do Titular
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={bankInfo.name}
                      onChange={handleChange}
                      placeholder="Nome completo do titular"
                      maxLength={255}
                      className={cn(
                        "transition-all duration-200",
                        errors.name && "border-destructive focus:border-destructive"
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {existingBankInfo && isEditing ? 'Atualizar' : 'Registrar'}
                </Button>
                
                {existingBankInfo && isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankRegistration; 