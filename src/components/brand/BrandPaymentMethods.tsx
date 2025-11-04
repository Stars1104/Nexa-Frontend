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
import { CreditCard, Plus, Trash2, Star, StarOff, Wallet, Shield, CheckCircle2, Info, Loader2 } from 'lucide-react';
import StripeConnectOnboarding from '@/components/stripe/StripeConnectOnboarding';
import { useSearchParams } from 'react-router-dom';

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
  }, []);

  useEffect(() => {
    // Handle Stripe Checkout success callback
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true' && sessionId) {
      handleStripeCheckoutSuccess(sessionId);
    } else if (canceled === 'true') {
      toast({
        title: 'Cancelado',
        description: 'Adição de método de pagamento foi cancelada.',
        variant: 'default',
      });
      // Clean up URL
      searchParams.delete('canceled');
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
          title: 'Erro',
          description: response.error || 'Erro ao carregar métodos de pagamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar métodos de pagamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      toast({
        title: 'Erro de Validação',
        description: `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate card number format (13-19 digits)
      if (!formData.card_number.match(/^[0-9]{13,19}$/)) {
        toast({
          title: 'Erro de Validação',
          description: 'Número do cartão inválido. Digite entre 13 e 19 dígitos.',
          variant: 'destructive',
        });
        return;
      }

      // Validate expiration date format
      if (!formData.card_expiration_date.match(/^(0[1-9]|1[0-2])([0-9]{2})$/)) {
        toast({
          title: 'Erro de Validação',
          description: 'Formato de data inválido. Use MMAA (ex: 1225).',
          variant: 'destructive',
        });
        return;
      }

      // Validate CVV format
      if (!formData.card_cvv.match(/^[0-9]{3,4}$/)) {
        toast({
          title: 'Erro de Validação',
          description: 'CVV inválido. Digite 3 ou 4 dígitos.',
          variant: 'destructive',
        });
        return;
      }

      // Validate CNPJ format
      if (!formData.cnpj.match(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
        toast({
          title: 'Erro de Validação',
          description: 'CNPJ inválido. Use o formato: 12.345.678/0001-90',
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
          title: 'Sucesso',
          description: 'Método de pagamento salvo com sucesso!',
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
          title: 'Erro',
          description: response.error || response.message || 'Erro ao salvar método de pagamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar método de pagamento',
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
          title: 'Sucesso',
          description: 'Método de pagamento definido como padrão!',
        });
        loadPaymentMethods();
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao definir método padrão',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao definir método padrão',
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
          title: 'Sucesso',
          description: 'Método de pagamento deletado com sucesso!',
        });
        loadPaymentMethods();
        setDeleteDialogOpen(false);
        setMethodToDelete(null);
      } else {
        // Show error toast with the message from backend
        const errorMessage = response.error || response.message || 'Erro ao deletar método de pagamento';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        // Keep dialog open so user can see the error, or close it
        setDeleteDialogOpen(false);
        setMethodToDelete(null);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao deletar método de pagamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
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
          title: 'Erro',
          description: response.error || 'Erro ao criar sessão de checkout',
          variant: 'destructive',
        });
        setIsLoadingStripe(false);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar processo de adição de método de pagamento',
        variant: 'destructive',
      });
      setIsLoadingStripe(false);
    }
  };

  const handleStripeCheckoutSuccess = async (sessionId: string) => {
    try {
      setIsLoadingStripe(true);
      
      const response = await brandPaymentApi.handleCheckoutSuccess(sessionId);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Método de pagamento adicionado com sucesso!',
        });
        
        // Clean up URL parameters
        searchParams.delete('success');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
        
        // Reload payment methods
        await loadPaymentMethods();
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao processar método de pagamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar método de pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStripe(false);
    }
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
              title: 'Sucesso',
              description: 'Conta Stripe conectada com sucesso!',
            });
          }}
          onError={(error) => {
            toast({
              title: 'Erro',
              description: error,
              variant: 'destructive',
            });
          }}
        />

        {/* Payment Methods Section */}
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
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
    </AlertDialog>
    </div>
    </TooltipProvider>
  );
} 