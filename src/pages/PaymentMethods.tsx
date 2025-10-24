import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, CreditCard, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CardBrandLogos from '@/components/ui/CardBrandLogos';
import { stripeApi } from '@/api/stripe';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit',
      last4: '4242',
      brand: 'visa',
      expiryMonth: '12',
      expiryYear: '2025',
      isDefault: true
    }
  ]);
  
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCardBrandIcon = (brand: string) => {
    const brandConfigs = {
      visa: { label: 'VISA', color: 'text-blue-600 dark:text-blue-400' },
      mastercard: { label: 'Mastercard', color: 'text-red-600 dark:text-red-400' },
      discover: { label: 'DISCOVER', color: 'text-orange-600 dark:text-orange-400' },
      jcb: { label: 'JCB', color: 'text-green-600 dark:text-green-400' },
      unionpay: { label: 'UnionPay', color: 'text-blue-600 dark:text-blue-400' },
      amex: { label: 'AMEX', color: 'text-blue-600 dark:text-blue-400' }
    };
    
    const brandConfig = brandConfigs[brand as keyof typeof brandConfigs] || { label: brand.toUpperCase(), color: 'text-muted-foreground' };
    return (
      <div className={`font-bold text-sm ${brandConfig.color}`}>
        {brandConfig.label}
      </div>
    );
  };
interface IndividualInfo {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: Record<string, any>;
  dob?: Record<string, any>;
}

interface CompanyInfo {
  name: string;
  structure?: string;
  address?: Record<string, any>;
}

interface CreateStripeAccountRequest {
  type: "individual" | "business";
  country: string; // 2-letter country code
  email: string;
  business_type: "individual" | "company";
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  individual?: IndividualInfo;
  company?: CompanyInfo;
}

const handleAddCard = async (formData: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: formData.type,
        last4: formData.cardNumber.slice(-4),
        brand: formData.brand,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods(prev => [...prev, newCard]);
      setIsAddCardOpen(false);
      
      toast({
        title: "Card Added Successfully",
        description: "Your payment method has been added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleRemoveCard = async (cardId: string) => {
    try {
      setPaymentMethods(prev => prev.filter(card => card.id !== cardId));
      toast({
        title: "Card Removed",
        description: "Payment method has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      setPaymentMethods(prev => 
        prev.map(card => ({
          ...card,
          isDefault: card.id === cardId
        }))
      );
      toast({
        title: "Default Card Updated",
        description: "Your default payment method has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default card.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Payment methods</h1>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
            <Info className="w-4 h-4 mr-2" />
            Additional 5% fee for Credit/Debit Card payment
          </Badge>
        </div>

        {/* Add New Card Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Card Brand Logos */}
            <CardBrandLogos className="mb-6" />

            <p className="text-center text-muted-foreground text-sm mb-6">
              Pay directly from your credit card.
            </p>

            <div className="text-center">
              <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3">
                    <Plus className="w-4 h-4 mr-2" />
                    Add credit card
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Credit Card</DialogTitle>
                  </DialogHeader>
                  <AddCardForm onSubmit={handleAddCard} isLoading={isLoading} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Payment Methods</h2>
            {paymentMethods.map((card) => (
              <Card key={card.id} className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2">
                          {getCardBrandIcon(card.brand)}
                          <span className="text-muted-foreground">•••• •••• •••• {card.last4}</span>
                          {card.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!card.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(card.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Add Card Form Component
const AddCardForm = ({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    brand: '',
    type: 'credit'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const detectCardBrand = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';
    return 'visa'; // default
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted,
      brand: detectCardBrand(value)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          value={formData.cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          maxLength={19}
          required
        />
      </div>

      <div>
        <Label htmlFor="cardholderName">Cardholder Name</Label>
        <Input
          id="cardholderName"
          type="text"
          placeholder="John Doe"
          value={formData.cardholderName}
          onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expiryMonth">Month</Label>
          <Select
            value={formData.expiryMonth}
            onValueChange={(value) => setFormData(prev => ({ ...prev, expiryMonth: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {(i + 1).toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="expiryYear">Year</Label>
          <Select
            value={formData.expiryYear}
            onValueChange={(value) => setFormData(prev => ({ ...prev, expiryYear: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="YYYY" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="text"
            placeholder="123"
            value={formData.cvv}
            onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
            maxLength={4}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </form>
  );
};

export default PaymentMethods;
