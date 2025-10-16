import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  brandPaymentApi,
  BrandPaymentMethod,
  SavePaymentMethodRequest,
} from "@/api/payment/brandPayment";
import { CreditCard, Plus, Trash2, Star, StarOff } from "lucide-react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTheme } from "../ThemeProvider";
import { useAppSelector } from "@/store/hooks";
import { paymentApi } from "@/api/payment";

export default function BrandPaymentMethods() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<BrandPaymentMethod[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // card_number: "",
    // card_holder_name: "",
    // card_expiration_date: "",
    // card_cvv: "",
    // cpf: "",
    is_default: false,
  });
  const [cardError, setCardError] = useState(null);

  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Dynamic colors based on theme
  const cardElementColors = {
    textColor: isDarkMode ? "#ffffff" : "#000000",
    placeholderColor: isDarkMode ? "#9ca3af" : "#6b7280",
    invalidColor: isDarkMode ? "#ef4444" : "#dc2626",
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await brandPaymentApi.getPaymentMethods();
      if (response.success && response.data) {
        setPaymentMethods(response.data);
      } else {
        toast({
          title: "Erro",
          description:
            response.error || "Erro ao carregar métodos de pagamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar métodos de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateCardHash = async (cardData: any) => {
    // Create a simple hash for testing - in production, use Pagar.me's encryption
    const cardString = `${cardData.card_number}${cardData.card_holder_name}${cardData.card_expiration_date}${cardData.card_cvv}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(cardString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `card_hash_${hashHex.substring(0, 32)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // // Check if all required fields are filled
    // const requiredFields = [
    //   "card_number",
    //   "card_holder_name",
    //   "card_expiration_date",
    //   "card_cvv",
    //   "cpf",
    // ];
    // const missingFields = requiredFields.filter(
    //   (field) => !formData[field as keyof typeof formData]
    // );

    // if (missingFields.length > 0) {
    //   toast({
    //     title: "Erro de Validação",
    //     description: `Campos obrigatórios não preenchidos: ${missingFields.join(
    //       ", "
    //     )}`,
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsSubmitting(true);

    try {
      // Validate card number format (13-19 digits)
      // if (!formData.card_number.match(/^[0-9]{13,19}$/)) {
      //   toast({
      //     title: "Erro de Validação",
      //     description:
      //       "Número do cartão inválido. Digite entre 13 e 19 dígitos.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // // Validate expiration date format
      // if (!formData.card_expiration_date.match(/^(0[1-9]|1[0-2])([0-9]{2})$/)) {
      //   toast({
      //     title: "Erro de Validação",
      //     description: "Formato de data inválido. Use MMAA (ex: 1225).",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // // Validate CVV format
      // if (!formData.card_cvv.match(/^[0-9]{3,4}$/)) {
      //   toast({
      //     title: "Erro de Validação",
      //     description: "CVV inválido. Digite 3 ou 4 dígitos.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // // Validate CPF format
      // if (!formData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      //   toast({
      //     title: "Erro de Validação",
      //     description: "CPF inválido. Use o formato: 123.456.789-00",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      const { customerId } = await paymentApi.registerStripeCustomer();

      if (!customerId) {
        toast({
          title: "Erro",
          description: "Erro ao registrar cliente Stripe",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { clientSecret } = await paymentApi.setupStripeIntent({
        customerId,
      });

      if (!clientSecret) {
        toast({
          title: "Erro",
          description: "Erro ao criar intenção de pagamento",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!stripe || !elements) return;

      console.log(
        "here------sdfsdfsdf-------->",
        elements.getElement(CardElement)
      );
      const { setupIntent } = await stripe?.confirmCardSetup(clientSecret!, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user?.name,
            email: user?.email,
          },
        },
      });

      if (!setupIntent || setupIntent.status !== "succeeded") {
        toast({
          title: "Erro",
          description: "Falha ao configurar o método de pagamento",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const cardInfo = await paymentApi.retrieveStripeCard({
        paymentMethodId: setupIntent.payment_method as string,
      });

      console.log("cardInfo---------->", cardInfo);

      console.log("setupIntent---------->", setupIntent);

      // // Generate card hash for testing
      // const cardHash = await generateCardHash({
      //     card_number: formData.card_number,
      //     card_holder_name: formData.card_holder_name,
      //     card_expiration_date: formData.card_expiration_date,
      //     card_cvv: formData.card_cvv,
      // });

      const requestData = {
        customer_id: customerId as string,
        payment_method_id: setupIntent?.payment_method as string,
        card_holder_name: user?.name!,
        card_brand: cardInfo.brand,
        card_last4: cardInfo.last4,
        card_exp_month: cardInfo.exp_month,
        card_exp_year: cardInfo.exp_year,
        is_default: formData.is_default,
      };

      console.log("requestData------------>", requestData);

      const response = await brandPaymentApi.savePaymentMethod(requestData);

      console.log("response----------->", response);

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Método de pagamento salvo com sucesso!",
        });
        setIsAddDialogOpen(false);
        setFormData({
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
        title: "Erro",
        description: "Erro ao salvar método de pagamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await brandPaymentApi.setDefaultPaymentMethod(
        paymentMethodId
      );
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Método de pagamento definido como padrão!",
        });
        loadPaymentMethods();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao definir método padrão",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao definir método padrão",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm("Tem certeza que deseja deletar este método de pagamento?")) {
      return;
    }

    try {
      const response = await brandPaymentApi.deletePaymentMethod(
        paymentMethodId
      );
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Método de pagamento deletado com sucesso!",
        });
        loadPaymentMethods();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao deletar método de pagamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar método de pagamento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
          <CardDescription>
            Gerencie seus cartões para pagamentos de contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SavePaymentMethod = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://nexacreators.com.br/api/brand-payment/save-method",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            card_hash: "card_hash_test123",
            card_holder_name: "Test User",
            cpf: "123.456.789-00",
          }),
        }
      );
    } catch (error) {
      console.error("Direct API call failed:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus cartões para pagamentos de contratos
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-[#e91e63] text-white hover:bg-[#e91e63]/90'>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo cartão para pagar contratos. Nenhum valor
                  será cobrado até que um contrato seja iniciado.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  handleSubmit(e);
                }}
                className="grid gap-4"
              >
                <div className="p-3 border border-input rounded-md bg-background">
                  <CardElement
                    className="text-sm text-foreground dark:text-foreground"
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: cardElementColors.textColor,
                          fontFamily: "system-ui, sans-serif",
                          "::placeholder": {
                            color: cardElementColors.placeholderColor,
                          },
                        },
                        invalid: {
                          color: cardElementColors.invalidColor,
                        },
                      },
                    }}
                    onChange={(event) => {
                      if (event.error) {
                        setCardError(event.error.message);
                      } else {
                        setCardError(null);
                      }
                    }}
                  />
                </div>
                {cardError && (
                  <p className="text-sm text-destructive">{cardError}</p>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleFormChange}
                    className="rounded"
                  />
                  <Label htmlFor="is_default">Definir como método padrão</Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className='bg-[#e91e63] text-white hover:bg-[#e91e63]/90'>
                    {isSubmitting ? 'Salvando...' : 'Salvar Cartão'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhum método de pagamento
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione um cartão para poder pagar contratos com criadores.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Cartão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{method.card_brand}</span>
                      {method.is_default && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.card_holder_name} • Adicionado em{" "}
                      {new Date(method.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      title="Definir como padrão"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  {method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Método padrão"
                    >
                      <StarOff className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    title="Deletar método"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
