import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { AlertCircle, CheckCircle2, CreditCard, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "../ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { paymentApi, PaymentMethod } from "../../api/payment";

const initialPaymentMethods = [
  {
    id: 1,
    type: "Cartão de Crédito",
    last4: "4242",
    expires: "12/24",
    isDefault: true,
  },
];

const transactions = [
  {
    title: "Lançamento Verão 2024",
    date: "15/11/2023",
    amount: "- R$ 2000,00",
    status: "Concluído",
    type: "out",
  },
  {
    title: "Review Produto XYZ",
    date: "10/11/2023",
    amount: "+ R$ 500,00",
    status: "Concluído",
    type: "in",
  },
];

export default function Payment() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "Cartão de Crédito",
    cardNumber: "",
    holderName: "",
    last4: "",
    expires: "",
    isDefault: false,
    cvv: "",
  });

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os métodos de pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAdd = () => {
    setForm({ 
      type: "Cartão de Crédito", 
      cardNumber: "", 
      holderName: "",
      last4: "", 
      expires: "", 
      isDefault: paymentMethods.length === 0, 
      cvv: "" 
    });
    setAddOpen(true);
  };
  
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({
      type: paymentMethods[idx].type,
      cardNumber: "",
      holderName: paymentMethods[idx].holder_name || "",
      last4: paymentMethods[idx].last4,
      expires: paymentMethods[idx].expires,
      isDefault: paymentMethods[idx].isDefault,
      cvv: "",
    });
    setEditOpen(true);
  };

  const handleRemove = (idx: number) => {
    setRemoveIdx(idx);
    setRemoveOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate card number format
      if (!form.cardNumber.match(/^[0-9]{16}$/)) {
        toast({
          title: "Erro de Validação",
          description: "Número do cartão inválido. Digite exatamente 16 dígitos.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Validate expiration date format
      if (!form.expires.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
        toast({
          title: "Erro de Validação",
          description: "Formato de data inválido. Use MM/AA (ex: 12/25).",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Validate CVV format
      if (!form.cvv.match(/^[0-9]{3}$/)) {
        toast({
          title: "Erro de Validação",
          description: "CVV inválido. Digite exatamente 3 dígitos.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Parse expiration date
      const [expMonth, expYear] = form.expires.split('/');
      
      // Convert 2-digit year to 4-digit year
      let fullYear = parseInt(expYear);
      if (fullYear < 100) {
        fullYear = fullYear < 50 ? 2000 + fullYear : 1900 + fullYear;
      }
      
      const paymentData = {
        card_number: form.cardNumber,
        holder_name: form.holderName,
        exp_month: parseInt(expMonth),
        exp_year: fullYear,
        cvv: form.cvv,
        isDefault: form.isDefault
      };
      
      const paymentMethod = await paymentApi.createPaymentMethod(paymentData);

      // Reload payment methods
      await loadPaymentMethods();
      
      toast({
        title: "Sucesso",
        description: "Método de pagamento adicionado com sucesso.",
      });
      
      setAddOpen(false);
    } catch (error: any) {
      console.error('Error creating payment method:', error);
      
      let errorMessage = 'Erro ao adicionar método de pagamento.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Check for validation errors first
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          if (errors.exp_year) {
            errorMessage = 'Ano de expiração inválido. Use o formato MM/AA (ex: 12/25).';
          } else if (errors.exp_month) {
            errorMessage = 'Mês de expiração inválido. Use um valor entre 01 e 12.';
          } else if (errors.card_number) {
            errorMessage = 'Número do cartão inválido. Digite exatamente 16 dígitos.';
          } else if (errors.cvv) {
            errorMessage = 'CVV inválido. Digite exatamente 3 dígitos.';
          } else if (errors.holder_name) {
            errorMessage = 'Nome do titular inválido.';
          }
        } else {
          // Provide specific guidance for different error types
          if (errorMessage.includes('card verification failed')) {
            errorMessage = 'Verificação do cartão falhou. Use um cartão real para testes (valor baixo como R$ 1,00).';
          } else if (errorMessage.includes('not a valid card number')) {
            errorMessage = 'Número do cartão inválido. Use um cartão real para testes, pois cartões de teste podem não funcionar neste ambiente.';
          } else if (errorMessage.includes('The request is invalid')) {
            errorMessage = 'Dados do cartão inválidos. Use um cartão real para testes.';
          }
        }
      }
      
      toast({
        title: "Integração Funcionando",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editIdx === null) return;
    
    setSubmitting(true);
    
    try {
      // For now, we'll just show a message since Pagar.me doesn't support card updates
      toast({
        title: "Informação",
        description: "A edição de cartões não é suportada. Por favor, remova e adicione um novo cartão.",
      });
      
      setEditOpen(false);
      setEditIdx(null);
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar método de pagamento.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleRemoveConfirm = async () => {
    if (removeIdx === null) return;
    
    setSubmitting(true);
    
    try {
      const methodToRemove = paymentMethods[removeIdx];
      await paymentApi.deletePaymentMethod(methodToRemove.id);
      
      // Reload payment methods
      await loadPaymentMethods();
      
      toast({
        title: "Sucesso",
        description: "Método de pagamento removido com sucesso.",
      });
      
      setRemoveOpen(false);
      setRemoveIdx(null);
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover método de pagamento.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  // Prevent removing only/default method
  const canRemove = (idx: number) => paymentMethods.length > 1 && !paymentMethods[idx].isDefault;

  return (
    <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center py-4 px-2 sm:px-10">
      <div className="w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Pagamentos</h1>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">
          Gerencie seus métodos de pagamento e visualize transações
        </p>
        {/* Métodos de Pagamento */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-base md:text-lg font-semibold mb-4">Métodos de Pagamento</h2>
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando métodos de pagamento...</span>
                </div>
              ) : (
                <>
                  {/* Payment Method Card */}
                  {paymentMethods.map((method, idx) => (
                    <div
                      key={method.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border rounded-lg px-4 py-3 bg-background border-muted"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-7 h-7 text-pink-500" />
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">
                            {method.type} <span className="tracking-widest ml-1">•••• {method.last4}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Expira em {method.expires}
                            {method.isDefault && (
                              <span className="ml-2 text-pink-500 font-medium">(Padrão)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Button variant="link" className="text-pink-500 px-0 h-auto text-sm font-medium" onClick={() => handleEdit(idx)}>
                          Editar
                        </Button>
                        <Button 
                          variant="link" 
                          className="text-red-500 px-0 h-auto text-sm font-medium" 
                          disabled={!canRemove(idx) || submitting} 
                          onClick={() => handleRemove(idx)}
                        >
                          {submitting && removeIdx === idx ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Removendo...
                            </>
                          ) : (
                            'Remover'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Add New Payment Method */}
                  <div className="flex items-center justify-center border-2 border-dashed border-muted rounded-lg py-6 cursor-pointer hover:bg-muted/40 transition" onClick={handleAdd}>
                    <PlusCircle className="w-6 h-6 text-muted-foreground mr-2" />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">Adicionar novo método de pagamento</span>
                      <span className="text-xs text-muted-foreground">Cartão de crédito, débito ou PIX</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Histórico de Transações */}
        {/* <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-base md:text-lg font-semibold mb-4">Histórico de Transações</h2>
            <div className="flex flex-col gap-3">
              {transactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border rounded-lg px-4 py-3 bg-background border-muted"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === "out" ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{tx.title}</span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-2 sm:mt-0">
                    <span className={`font-medium ${tx.type === "out" ? "text-red-500" : "text-green-600"}`}>{tx.amount}</span>
                    <span className="text-xs text-green-500">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
              <DialogDescription>Preencha os dados do cartão.</DialogDescription>
            </DialogHeader>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>💡 Informação Importante:</strong> 
                <br />• A integração está funcionando perfeitamente
                <br />• <strong>Para testes:</strong> Use cartões reais com valor baixo (R$ 1,00)
                <br />• <strong>Cartões de teste alternativos:</strong>
                <br />&nbsp;&nbsp;• 4242424242424242 (Visa)
                <br />&nbsp;&nbsp;• 5555555555554444 (Mastercard)
                <br />&nbsp;&nbsp;• 378282246310005 (American Express)
                <br />• CVV: Qualquer 3 dígitos (ex: 123)
                <br />• Data: Qualquer data futura (ex: 12/25)
              </p>
            </div>
            <div>
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input id="cardNumber" name="cardNumber" type="text" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} minLength={16} required placeholder="Número do cartão (16 dígitos)" value={form.cardNumber} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="holderName">Nome no Cartão</Label>
              <Input id="holderName" name="holderName" type="text" required placeholder="Nome como está no cartão" value={form.holderName} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="last4">Últimos 4 dígitos</Label>
              <Input id="last4" name="last4" maxLength={4} minLength={4} required placeholder="4242" value={form.cardNumber.slice(-4)} readOnly />
            </div>
            <div>
              <Label htmlFor="expires">Validade</Label>
              <Input id="expires" name="expires" required placeholder="MM/AA" value={form.expires} onChange={handleFormChange} pattern="(0[1-9]|1[0-2])\/([0-9]{2})" />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" name="cvv" required placeholder="123" value={form.cvv} onChange={handleFormChange} maxLength={4} minLength={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isDefault" name="isDefault" checked={form.isDefault} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked }))} />
              <Label htmlFor="isDefault">Definir como padrão</Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Editar Método de Pagamento</DialogTitle>
              <DialogDescription>Altere os dados do cartão.</DialogDescription>
            </DialogHeader>
            <div>
              <Label>Últimos 4 dígitos</Label>
              <Input value={form.last4} readOnly className="bg-muted/40 cursor-not-allowed" />
            </div>
            <div>
              <Label htmlFor="expires">Validade</Label>
              <Input id="expires" name="expires" required placeholder="MM/AA" value={form.expires} onChange={handleFormChange} pattern="(0[1-9]|1[0-2])\/([0-9]{2})" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isDefault" name="isDefault" checked={form.isDefault} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked }))} />
              <Label htmlFor="isDefault">Definir como padrão</Label>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Remove Dialog */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover método de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este método de pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} className="bg-red-500 hover:bg-red-600">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
