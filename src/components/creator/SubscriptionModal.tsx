import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { paymentClient } from "../../services/apiClient";

interface SubscriptionModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionModal({
  open,
  onOpenChange,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    card_number: "",
    card_holder_name: "",
    card_expiration_date: "",
    card_cvv: "",
    cpf: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Apply CPF mask: XXX.XXX.XXX-XX
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");
    // Add spaces every 4 digits
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiration = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");
    // Format as MM/YY
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case "cpf":
        formattedValue = formatCPF(value);
        break;
      case "card_number":
        formattedValue = formatCardNumber(value);
        break;
      case "card_expiration_date":
        formattedValue = formatExpiration(value);
        break;
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  // CPF validation function
  const validateCPF = (cpf: string): boolean => {
    // Remove formatting
    const numbers = cpf.replace(/[.-]/g, "");

    // Check if it has 11 digits
    if (numbers.length !== 11) {
      return false;
    }

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false;
    }

    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(numbers[9]) !== digit1) {
      return false;
    }

    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[10]) === digit2;
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.card_number.replace(/\s/g, "").match(/^\d{16}$/)) {
      errors.push("Card number must be 16 digits");
    }

    if (!formData.card_holder_name.trim()) {
      errors.push("Card holder name is required");
    }

    if (!formData.card_expiration_date.match(/^\d{2}\/\d{2}$/)) {
      errors.push("Expiration date must be in MM/YY format");
    }

    if (!formData.card_cvv.match(/^\d{3,4}$/)) {
      errors.push("CVV must be 3 or 4 digits");
    }

    if (!formData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      errors.push("CPF must be in XXX.XXX.XXX-XX format");
    } else if (!validateCPF(formData.cpf)) {
      errors.push("CPF is not valid. Please check the number.");
    }

    return errors;
  };

  const handlePay = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue with the payment",
        variant: "destructive",
      });
      return;
    }

    // Check if modal is still open
    if (!open) {
      return;
    }

    const errors = validateForm();

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for backend
      const paymentData = {
        card_number: formData.card_number.replace(/\s/g, ""),
        card_holder_name: formData.card_holder_name.trim(),
        card_expiration_date: formData.card_expiration_date.replace("/", ""), // Remove slash to get MMYY format
        card_cvv: formData.card_cvv,
        cpf: formData.cpf, // Keep the formatted CPF (XXX.XXX.XXX-XX)
        test_mode: import.meta.env.DEV ? "true" : "false", // Enable test mode in development
      };

      // Validate data before sending
      if (paymentData.card_number.length !== 16) {
        toast({
          title: "Validation Error",
          description: "Card number must be exactly 16 digits",
          variant: "destructive",
        });
        return;
      }

      if (paymentData.card_expiration_date.length !== 4) {
        toast({
          title: "Validation Error",
          description: "Expiration date must be in MMYY format",
          variant: "destructive",
        });
        return;
      }

      if (paymentData.card_cvv.length < 3 || paymentData.card_cvv.length > 4) {
        toast({
          title: "Validation Error",
          description: "CVV must be 3 or 4 digits",
          variant: "destructive",
        });
        return;
      }

      if (!paymentData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
        toast({
          title: "Validation Error",
          description: "CPF must be in XXX.XXX.XXX-XX format",
          variant: "destructive",
        });
        return;
      }

      const response = await paymentClient.post(
        "/payment/subscription",
        paymentData
      );

      if (response.data.success) {
        handleSuccess();
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error(
        "Full error response:",
        JSON.stringify(error.response?.data, null, 2)
      );

      // Handle different types of errors
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        toast({
          title: "Payment Timeout",
          description:
            "The payment request took too long. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with the payment",
          variant: "destructive",
        });
      } else if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors)
            .flat()
            .join(", ");
          toast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Validation Error",
            description:
              error.response?.data?.message ||
              "Please check your input and try again",
            variant: "destructive",
          });
        }
      } else if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description:
            error.response?.data?.message ||
            "You do not have permission to perform this action",
          variant: "destructive",
        });
      } else if (error.response?.status === 429) {
        toast({
          title: "Too Many Requests",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
      } else if (!error.response) {
        toast({
          title: "Network Error",
          description:
            "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Failed",
          description:
            error.response?.data?.message ||
            error.message ||
            "An error occurred during payment",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onClose) {
      onClose();
    }
  };

  const handleSuccess = () => {
    // Dispatch event to notify other components about premium status update
    window.dispatchEvent(new CustomEvent("premium-status-updated"));

    onSuccess?.();
    handleClose();
  };

  // If using controlled state and modal is not open, don't render
  if (open !== undefined && !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Premium Subscription</CardTitle>
          <CardDescription>
            Get access to premium features for R$ 49.99/month
            {import.meta.env.DEV && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                🧪 Test Mode: Payments will be simulated for development
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card_number">Card Number</Label>
            <Input
              id="card_number"
              name="card_number"
              placeholder="1234 5678 9012 3456"
              value={formData.card_number}
              onChange={handleInputChange}
              maxLength={19}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_holder_name">Card Holder Name</Label>
            <Input
              id="card_holder_name"
              name="card_holder_name"
              placeholder="John Doe"
              value={formData.card_holder_name}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_expiration_date">Expiration</Label>
              <Input
                id="card_expiration_date"
                name="card_expiration_date"
                placeholder="MM/YY"
                value={formData.card_expiration_date}
                onChange={handleInputChange}
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_cvv">CVV</Label>
              <Input
                id="card_cvv"
                name="card_cvv"
                placeholder="123"
                value={formData.card_cvv}
                onChange={handleInputChange}
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              placeholder="111.444.777-35"
              value={formData.cpf}
              onChange={handleInputChange}
              maxLength={14}
            />
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground">
                Valid test CPFs: 111.444.777-35, 123.456.789-09, 987.654.321-00
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={isLoading} className="flex-1">
              {isLoading ? "Processing..." : "Pay R$ 49.99"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
