import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { hiringApi } from "@/api/hiring";
import { Contract } from "@/api/hiring";
import {
  Clock,
  DollarSign,
  Star,
  User,
  FileText,
  CheckCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";

interface ContractsWithPaymentAvailableProps {
  onWithdrawalRequested?: () => void;
}

export const ContractsWithPaymentAvailable: React.FC<
  ContractsWithPaymentAvailableProps
> = ({ onWithdrawalRequested }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await hiringApi.getContractsWithPaymentAvailable();
      setContracts(response.data);
    } catch (error) {
      console.error("Error loading contracts with payment available:", error);
      toast({
        title: "Error",
        description: "Failed to load contracts with payment available",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = (contract: Contract) => {
    // Navigate to withdrawal form or open withdrawal modal
    if (onWithdrawalRequested) {
      onWithdrawalRequested();
    }
  };

  const totalAvailableAmount = contracts.reduce((sum, contract) => {
    return (
      sum +
      parseFloat(contract.creator_amount.replace("R$ ", "").replace(",", "."))
    );
  }, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Payment Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Payments Available
            </h3>
            <p className="text-muted-foreground">
              You don't have any payments available for withdrawal at the
              moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Payment Available ({contracts.length})
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            These contracts have been reviewed and payment is ready for
            withdrawal.
          </p>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Available</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalAvailableAmount.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getAvatarUrl(contract.brand?.avatar_url)} />
                      <AvatarFallback>
                        {contract.brand?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{contract.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Brand: {contract.brand?.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {contract.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        Total: {contract.budget}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        Your Share: {contract.creator_amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>
                        Completed{" "}
                        {new Date(contract.completed_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {contract.review && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {contract.review.rating}/5
                      </span>
                      {contract.review.comment && (
                        <span className="text-muted-foreground">
                          - "{contract.review.comment.substring(0, 50)}..."
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    Payment Ready
                  </Badge>
                  <Button
                    onClick={() => handleWithdrawClick(contract)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Withdraw {contract.creator_amount}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
