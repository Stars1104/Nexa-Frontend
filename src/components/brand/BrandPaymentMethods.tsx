import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { brandPaymentApi, BrandPaymentMethod, SavePaymentMethodRequest } from '@/api/payment/brandPayment';
import { CreditCard, Plus, Trash2, Star, StarOff, Wallet, Shield, CheckCircle2, Info, Loader2, FileText, DollarSign, Clock } from 'lucide-react';
import StripeConnectOnboarding from '@/components/stripe/StripeConnectOnboarding';
import { useSearchParams } from 'react-router-dom';
import { hiringApi, Contract } from '@/api/hiring';

export default function BrandPaymentMethods() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentMethods, setPaymentMethods] = useState<BrandPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [contractsNeedingPayment, setContractsNeedingPayment] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [fundingContractId, setFundingContractId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    card_number: '',
    card_holder_name: '',
    card_expiration_date: '',
    card_cvv: '',
    cnpj: '',
    is_default: false,
  });

  useEffect(() => {
    loadPaymentMethods();
    loadContractsNeedingPayment();
  }, []);

  useEffect(() => {
    // Handle Stripe Checkout success callback
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    const fundingSuccess = searchParams.get('funding_success');
    const fundingCanceled = searchParams.get('funding_canceled');
    const contractId = searchParams.get('contract_id');
    
    // Debug logging
    if (success === 'true' || fundingSuccess === 'true') {
      console.log('Checkout success detected', {
        success,
        fundingSuccess,
        sessionId,
        allParams: Object.fromEntries(searchParams.entries()),
      });
    }
    
    // Check if returning from offer checkout
    const action = searchParams.get('action');
    const creatorId = searchParams.get('creator_id');
    const chatRoomId = searchParams.get('chat_room_id');
    
    if (success === 'true' && sessionId) {
      handleStripeCheckoutSuccess(sessionId);
      
      // If returning from offer checkout, show message and redirect to chat
      if (action === 'send_offer' && chatRoomId) {
        toast({
          title: 'Método de Pagamento Configurado',
          description: 'Agora você pode enviar ofertas. Redirecionando para o chat...',
          variant: 'default',
        });
        
        // Clear URL params
        searchParams.delete('success');
        searchParams.delete('session_id');
        searchParams.delete('action');
        searchParams.delete('creator_id');
        searchParams.delete('chat_room_id');
        setSearchParams(searchParams, { replace: true });
        
        // Redirect to chat page after a short delay
        setTimeout(() => {
          window.location.href = `/brand/chat?room_id=${chatRoomId}`;
        }, 1500);
        return;
      }
    } else if (fundingSuccess === 'true' && sessionId && contractId) {
      handleContractFundingSuccess(sessionId, parseInt(contractId));
    } else if (searchParams.get('offer_funding_success') === 'true' && sessionId) {
      handleOfferFundingSuccess(sessionId);
    } else if (canceled === 'true') {
      // Check if canceling from offer checkout
      if (action === 'send_offer') {
        toast({
          title: 'Operação Cancelada',
          description: 'A configuração do método de pagamento foi cancelada. Você precisa configurar um método de pagamento para enviar ofertas.',
          variant: 'default',
        });
        searchParams.delete('canceled');
        searchParams.delete('action');
        searchParams.delete('creator_id');
        searchParams.delete('chat_room_id');
        setSearchParams(searchParams, { replace: true });
      } else {
        toast({
          title: 'Operação Cancelada',
          description: 'A adição do método de pagamento foi cancelada. Você pode tentar novamente quando quiser.',
          variant: 'default',
        });
        searchParams.delete('canceled');
        setSearchParams(searchParams, { replace: true });
      }
    } else if (fundingCanceled === 'true') {
      toast({
        title: 'Pagamento Cancelado',
        description: 'O pagamento do contrato foi cancelado. Você pode financiar o contrato novamente a qualquer momento.',
        variant: 'default',
      });
      searchParams.delete('funding_canceled');
      if (contractId) searchParams.delete('contract_id');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await brandPaymentApi.getPaymentMethods();
      console.log('Payment methods response:', response);
      if (response.success && response.data) {
        setPaymentMethods(response.data);
      } else {
        toast({
          title: 'Ops! Algo deu errado',
          description: response.error || 'Não foi possível carregar seus métodos de pagamento. Por favor, recarregue a página ou tente novamente em alguns instantes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar seus métodos de pagamento no momento. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContractsNeedingPayment = async () => {
    try {
      setLoadingContracts(true);
      
      // Fetch contracts with status 'pending' and workflow_status 'payment_pending'
      // This will be more efficient as backend filters by workflow_status
      const response = await hiringApi.getContracts('pending', 'payment_pending');
      
      // Handle paginated response structure
      const contractsData = response.data?.data || response.data || [];
      const allContracts = Array.isArray(contractsData) ? contractsData : (contractsData.data || []);
      
      // Additional filter on frontend to ensure we only get contracts that need payment
      // This handles edge cases where payment might have been completed but status not updated
      const contractsNeedingPayment = allContracts.filter((contract: Contract) => {
        // Must be pending status
        if (contract.status !== 'pending') return false;
        
        // Must have payment_pending workflow status
        if (contract.workflow_status !== 'payment_pending') return false;
        
        // Either no payment exists, or payment status is not completed
        if (contract.payment && contract.payment.status === 'completed') return false;
        
        return true;
      });
      
      setContractsNeedingPayment(contractsNeedingPayment);
    } catch (error) {
      console.error('Error loading contracts needing payment:', error);
      toast({
        title: 'Erro ao Carregar Contratos',
        description: 'Não foi possível carregar os contratos que precisam de pagamento. Por favor, recarregue a página.',
        variant: 'destructive',
      });
      // Set empty array on error to prevent UI issues
      setContractsNeedingPayment([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Format CNPJ input
    let formattedValue = value;
    if (name === 'cnpj') {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, '');
      // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
      if (digits.length <= 2) {
        formattedValue = digits;
      } else if (digits.length <= 5) {
        formattedValue = `${digits.slice(0, 2)}.${digits.slice(2)}`;
      } else if (digits.length <= 8) {
        formattedValue = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      } else if (digits.length <= 12) {
        formattedValue = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      } else {
        formattedValue = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : formattedValue,
    }));
  };

  const generateCardHash = async (cardData: any) => {
    // Create a simple hash for testing - in production, use Pagar.me's encryption
    const cardString = `${cardData.card_number}${cardData.card_holder_name}${cardData.card_expiration_date}${cardData.card_cvv}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(cardString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `card_hash_${hashHex.substring(0, 32)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled
    const requiredFields = ['card_number', 'card_holder_name', 'card_expiration_date', 'card_cvv', 'cnpj'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);


    if (missingFields.length > 0) {
      const fieldNames: { [key: string]: string } = {
        card_number: 'Número do Cartão',
        card_holder_name: 'Nome no Cartão',
        card_expiration_date: 'Data de Validade',
        card_cvv: 'CVV',
        cnpj: 'CNPJ',
      };
      const missingFieldNames = missingFields.map(field => fieldNames[field] || field).join(', ');
      toast({
        title: 'Campos Obrigatórios',
        description: `Por favor, preencha todos os campos: ${missingFieldNames}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate card number format (13-19 digits)
      if (!formData.card_number.match(/^[0-9]{13,19}$/)) {
        toast({
          title: 'Número do Cartão Inválido',
          description: 'O número do cartão deve conter entre 13 e 19 dígitos. Verifique e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Validate expiration date format
      if (!formData.card_expiration_date.match(/^(0[1-9]|1[0-2])([0-9]{2})$/)) {
        toast({
          title: 'Data de Validade Inválida',
          description: 'Por favor, use o formato MMAA (exemplo: 1225 para dezembro de 2025).',
          variant: 'destructive',
        });
        return;
      }

      // Validate CVV format
      if (!formData.card_cvv.match(/^[0-9]{3,4}$/)) {
        toast({
          title: 'CVV Inválido',
          description: 'O CVV deve conter 3 ou 4 dígitos. Geralmente está localizado no verso do cartão.',
          variant: 'destructive',
        });
        return;
      }

      // Validate CNPJ format
      if (!formData.cnpj.match(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
        toast({
          title: 'CNPJ Inválido',
          description: 'Por favor, use o formato correto: 12.345.678/0001-90',
          variant: 'destructive',
        });
        return;
      }

      // Generate card hash for testing
      const cardHash = await generateCardHash({
          card_number: formData.card_number,
          card_holder_name: formData.card_holder_name,
          card_expiration_date: formData.card_expiration_date,
          card_cvv: formData.card_cvv,
      });

      const requestData = {
          card_hash: cardHash,
          card_holder_name: formData.card_holder_name,
          cnpj: formData.cnpj,
          is_default: formData.is_default,
      };

      const response = await brandPaymentApi.savePaymentMethod(requestData);

      if (response.success) {
        toast({
          title: 'Cartão Adicionado! 🎉',
          description: 'Seu método de pagamento foi salvo com sucesso e já está disponível para uso.',
        });
        setIsAddDialogOpen(false);
        setFormData({
          card_number: '',
          card_holder_name: '',
          card_expiration_date: '',
          card_cvv: '',
          cnpj: '',
          is_default: false,
        });
        loadPaymentMethods();
      } else {
        toast({
          title: 'Não Foi Possível Salvar',
          description: response.error || response.message || 'Ocorreu um erro ao salvar seu método de pagamento. Por favor, verifique os dados e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar seu método de pagamento no momento. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await brandPaymentApi.setDefaultPaymentMethod(paymentMethodId);
      if (response.success) {
        toast({
          title: 'Método Padrão Atualizado! ✓',
          description: 'Este método de pagamento agora é o seu padrão e será usado automaticamente nos próximos pagamentos.',
        });
        loadPaymentMethods();
      } else {
        toast({
          title: 'Não Foi Possível Atualizar',
          description: response.error || 'Não foi possível definir este método como padrão. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao Atualizar',
        description: 'Não foi possível definir o método padrão no momento. Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (paymentMethodId: string) => {
    setMethodToDelete(paymentMethodId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;

    try {
      const response = await brandPaymentApi.deletePaymentMethod(methodToDelete);
      if (response.success) {
        toast({
          title: 'Método de Pagamento Removido com Sucesso! 🎉',
          description: 'O método de pagamento foi removido da sua conta. Você pode adicionar um novo método a qualquer momento.',
        });
        loadPaymentMethods();
        setDeleteDialogOpen(false);
        setMethodToDelete(null);
      } else {
        // Extract error message from response - check all possible locations
        const errorMessage = response.error || response.message || '';
        
        // Check if this is the "only payment method" error
        const isOnlyPaymentMethodError = errorMessage.toLowerCase().includes('only payment method') || 
                                         errorMessage.toLowerCase().includes('cannot delete the only') ||
                                         errorMessage.toLowerCase().includes('único método');
        
        if (isOnlyPaymentMethodError) {
          toast({
            title: 'Não é possível remover este método de pagamento',
            description: 'Este é o seu único método de pagamento. Por favor, adicione outro método antes de remover este. Isso garante que você sempre tenha uma forma de pagamento disponível.',
            variant: 'destructive',
          });
        } else {
          // Show error toast with the message from backend
          const defaultErrorMessage = 'Este método de pagamento não pode ser removido no momento. Ele pode estar sendo usado em um contrato ativo ou pendente. Verifique seus contratos e tente novamente.';
          toast({
            title: 'Não Foi Possível Remover o Método de Pagamento',
            description: errorMessage || defaultErrorMessage,
            variant: 'destructive',
          });
        }
        setDeleteDialogOpen(false);
        setMethodToDelete(null);
      }
    } catch (error: any) {
      // Extract error message from all possible error response structures
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          '';
      
      // Check if this is the "only payment method" error in catch block
      const isOnlyPaymentMethodError = errorMessage.toLowerCase().includes('only payment method') || 
                                       errorMessage.toLowerCase().includes('cannot delete the only') ||
                                       errorMessage.toLowerCase().includes('único método');
      
      if (isOnlyPaymentMethodError) {
        toast({
          title: 'Não é possível remover este método de pagamento',
          description: 'Este é o seu único método de pagamento. Por favor, adicione outro método antes de remover este. Isso garante que você sempre tenha uma forma de pagamento disponível.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao Remover Método de Pagamento',
          description: errorMessage || 'Ops! Algo deu errado ao tentar remover o método de pagamento. Por favor, verifique sua conexão e tente novamente em alguns instantes.',
          variant: 'destructive',
        });
      }
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    }
  };

  const handleAddStripePaymentMethod = async () => {
    try {
      setIsLoadingStripe(true);
      
      const response = await brandPaymentApi.createCheckoutSession();
      
      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        toast({
          title: 'Não Foi Possível Iniciar',
          description: response.error || 'Não foi possível iniciar o processo de adição. Por favor, tente novamente em alguns instantes.',
          variant: 'destructive',
        });
        setIsLoadingStripe(false);
      }
    } catch (error) {
      toast({
        title: 'Erro ao Conectar',
        description: 'Não foi possível conectar ao sistema de pagamento. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
      setIsLoadingStripe(false);
    }
  };

  const handleStripeCheckoutSuccess = async (sessionId: string) => {
    try {
      setIsLoadingStripe(true);
      
      // Validate sessionId before making the request
      if (!sessionId || sessionId.trim() === '') {
        toast({
          title: 'Sessão Inválida',
          description: 'Não foi possível validar sua sessão de pagamento. Por favor, tente adicionar o método novamente.',
          variant: 'destructive',
        });
        setIsLoadingStripe(false);
        return;
      }
      
      const response = await brandPaymentApi.handleCheckoutSuccess(sessionId);
      
      if (response.success) {
        toast({
          title: 'Método Adicionado com Sucesso! 🎉',
          description: 'Seu método de pagamento foi adicionado e já está disponível para uso nos seus contratos.',
        });
        
        // Clean up URL parameters
        searchParams.delete('success');
        searchParams.delete('session_id');
        const applicationId = searchParams.get('application_id');
        const campaignId = searchParams.get('campaign_id');
        if (applicationId) searchParams.delete('application_id');
        if (campaignId) searchParams.delete('campaign_id');
        setSearchParams(searchParams, { replace: true });
        
        // Reload payment methods
        await loadPaymentMethods();
        
        // Reload contracts to check if any need funding
        await loadContractsNeedingPayment();
        
        // Get the updated contracts list after reload
        const response = await hiringApi.getContracts('pending');
        const allContracts = response.data.data || [];
        const contractsNeedingPayment = allContracts.filter((contract: Contract) => 
          contract.workflow_status === 'payment_pending' && 
          contract.status === 'pending' &&
          (!contract.payment || contract.payment?.status !== 'completed')
        );
        
        // If there are contracts needing payment, redirect to fund the first one
        if (contractsNeedingPayment.length > 0) {
          const firstContract = contractsNeedingPayment[0];
          if (firstContract) {
            // Redirect to Stripe checkout for contract funding
            handleFundContract(firstContract.id);
          }
        }
      } else {
        toast({
          title: 'Não Foi Possível Processar',
          description: response.error || 'Não foi possível processar seu método de pagamento. Por favor, tente adicionar novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao Processar',
        description: 'Ocorreu um erro ao processar seu método de pagamento. Por favor, tente novamente ou entre em contato com o suporte.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const handleContractFundingSuccess = async (sessionId: string, contractId: number) => {
    try {
      setIsLoadingStripe(true);
      
      // Check payment status
      const paymentStatus = await brandPaymentApi.getContractPaymentStatus(contractId.toString());
      
      if (paymentStatus.success && paymentStatus.data?.payment?.status === 'completed') {
        toast({
          title: 'Contrato Financiado! 🎉',
          description: 'Pagamento realizado com sucesso! O valor foi depositado em garantia e o contrato está pronto para iniciar.',
        });
        
        // Clean up URL parameters
        searchParams.delete('funding_success');
        searchParams.delete('session_id');
        searchParams.delete('contract_id');
        setSearchParams(searchParams, { replace: true });
        
        // Reload contracts
        await loadContractsNeedingPayment();
      } else {
        toast({
          title: 'Pagamento em Processamento',
          description: 'Seu pagamento está sendo processado. Isso pode levar alguns minutos. Atualize a página em alguns instantes para ver o status atualizado.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao Verificar Pagamento',
        description: 'Não foi possível verificar o status do pagamento no momento. Por favor, verifique novamente em alguns minutos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const handleOfferFundingSuccess = async (sessionId: string) => {
    try {
      setIsLoadingStripe(true);
      
      const response = await brandPaymentApi.handleOfferFundingSuccess(sessionId);
      
      if (response.success) {
        toast({
          title: 'Fundos Adicionados com Sucesso! 🎉',
          description: `Seu pagamento foi processado com sucesso. Os fundos foram adicionados à sua conta.`,
        });
        
        // Clean up URL parameters
        searchParams.delete('offer_funding_success');
        searchParams.delete('session_id');
        const creatorId = searchParams.get('creator_id');
        const chatRoomId = searchParams.get('chat_room_id');
        if (creatorId) searchParams.delete('creator_id');
        if (chatRoomId) searchParams.delete('chat_room_id');
        setSearchParams(searchParams, { replace: true });
      } else {
        toast({
          title: 'Erro ao Processar',
          description: response.error || 'Não foi possível processar o financiamento. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error handling offer funding success:', error);
      toast({
        title: 'Erro ao Processar',
        description: 'Ocorreu um erro ao processar o financiamento. Por favor, tente novamente ou entre em contato com o suporte.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const handleFundContract = async (contractId: number) => {
    try {
      setFundingContractId(contractId);
      setIsLoadingStripe(true);
      
      const response = await brandPaymentApi.createContractCheckoutSession(contractId);
      
      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        toast({
          title: 'Não Foi Possível Iniciar o Pagamento',
          description: response.error || 'Não foi possível iniciar o processo de financiamento. Por favor, tente novamente.',
          variant: 'destructive',
        });
        setIsLoadingStripe(false);
      }
    } catch (error) {
      toast({
        title: 'Erro ao Financiar Contrato',
        description: 'Não foi possível iniciar o processo de financiamento no momento. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
      setIsLoadingStripe(false);
    } finally {
      setFundingContractId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>Gerencie seus cartões para pagamentos de contratos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Carregando métodos de pagamento...</p>
              </div>
            </div>
          </CardContent>

        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Métodos de Pagamento Seguros</AlertTitle>
          <AlertDescription>
            Adicione métodos de pagamento para processar pagamentos de contratos. Seus dados são protegidos com criptografia de ponta a ponta.
          </AlertDescription>
        </Alert>

        {/* Stripe Connect Account Section */}
        <StripeConnectOnboarding 
          onComplete={() => {
            toast({
              title: 'Conta Conectada! ✓',
              description: 'Sua conta Stripe foi conectada com sucesso! Agora você pode receber pagamentos de forma segura.',
            });
          }}
          onError={(error) => {
            toast({
              title: 'Erro ao Conectar Conta',
              description: error || 'Não foi possível conectar sua conta Stripe. Por favor, tente novamente.',
              variant: 'destructive',
            });
          }}
        />

        {/* Contracts Needing Payment Section */}
        {contractsNeedingPayment.length > 0 && (
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Contratos Aguardando Financiamento
                  </CardTitle>
                  <CardDescription className="text-base">
                    Financie seus contratos através de depósito em garantia (escrow)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {loadingContracts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  contractsNeedingPayment.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl bg-card hover:shadow-md transition-all gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{contract.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {contract.description || 'Sem descrição'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pl-12">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold text-foreground">
                              {formatCurrency(typeof contract.budget === 'number' ? contract.budget : parseFloat(contract.budget || '0') || 0)}
                            </span>
                          </div>
                          {contract.estimated_days && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{contract.estimated_days} dias estimados</span>
                            </div>
                          )}
                          {contract.other_user && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Criador:</span>
                              <span>{contract.other_user.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:w-auto w-full">
                        <Button
                          onClick={() => handleFundContract(contract.id)}
                          disabled={isLoadingStripe && fundingContractId === contract.id}
                          className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
                        >
                          {isLoadingStripe && fundingContractId === contract.id ? (
                            <div>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </div>
                          ) : (
                            <div>
                              <Wallet className="h-4 w-4 mr-2" />
                              Financiar Contrato
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods Section
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Métodos de Pagamento
                </CardTitle>
                <CardDescription className="text-base">
                  Gerencie seus cartões para pagamentos de contratos com criadores
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="default">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Manualmente
                    </Button>
                  </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Adicionar Método de Pagamento
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Adicione um novo cartão para pagar contratos. Nenhum valor será cobrado até que um contrato seja iniciado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card_number" className="text-sm font-medium">
                        Número do Cartão
                      </Label>
                      <Input
                        id="card_number"
                        name="card_number"
                        value={formData.card_number}
                        onChange={handleFormChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card_holder_name" className="text-sm font-medium">
                        Nome no Cartão
                      </Label>
                      <Input
                        id="card_holder_name"
                        name="card_holder_name"
                        value={formData.card_holder_name}
                        onChange={handleFormChange}
                        placeholder="João Silva"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card_expiration_date" className="text-sm font-medium">
                        Validade (MM/AA)
                      </Label>
                      <Input
                        id="card_expiration_date"
                        name="card_expiration_date"
                        value={formData.card_expiration_date}
                        onChange={handleFormChange}
                        placeholder="MMAA"
                        maxLength={4}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card_cvv" className="text-sm font-medium">
                        CVV
                      </Label>
                      <Input
                        id="card_cvv"
                        name="card_cvv"
                        value={formData.card_cvv}
                        onChange={handleFormChange}
                        placeholder="123"
                        maxLength={4}
                        type="password"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium">
                        CNPJ
                      </Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleFormChange}
                        placeholder="12.345.678/0001-90"
                        maxLength={18}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
                      Definir como método padrão
                    </Label>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className='bg-[#e91e63] text-white hover:bg-[#e91e63]/90'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Salvar Cartão
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          </div>
        </CardHeader>
      <CardContent className="pt-6">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <CreditCard className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum método de pagamento</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Adicione um método de pagamento para poder realizar pagamentos de contratos com criadores de forma segura.
            </p>
            <Button 
              onClick={handleAddStripePaymentMethod}
              disabled={isLoadingStripe}
              className="bg-[#635bff] text-white hover:bg-[#635bff]/90"
              size="lg"
            >
              {isLoadingStripe ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Método de Pagamento
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between p-5 border rounded-xl transition-all hover:shadow-md ${
                  method.is_default ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-lg ${
                    method.is_default ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base">{method.card_info}</span>
                      {method.is_default && (
                        <Badge variant="default" className="bg-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{method.card_holder_name}</span>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>Adicionado em {new Date(method.created_at).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!method.is_default && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          className="h-9 w-9 p-0"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Definir como padrão</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {method.is_default && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-9 w-9 p-0"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Método padrão</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(method.id)}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remover método</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    {/* <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Confirmar Remoção
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            Tem certeza que deseja remover este método de pagamento? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog> */}
    </div>
    </TooltipProvider>
  );
} 