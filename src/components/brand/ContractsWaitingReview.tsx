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
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ContractsWaitingReviewProps {
  onReviewSubmitted?: () => void;
}

export const ContractsWaitingReview: React.FC<ContractsWaitingReviewProps> = ({
  onReviewSubmitted,
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await hiringApi.getContractsWaitingForReview();
      setContracts(response.data);
    } catch (error) {
      console.error("Error loading contracts waiting for review:", error);
      toast({
        title: "Error",
        description: "Failed to load contracts waiting for review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (contract: Contract) => {
    // Navigate to review form or open review modal
    // This would typically open a review form component
    console.log("Review contract:", contract.id);
  };

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
            <CheckCircle className="h-5 w-5 text-green-600" />
            Contracts Waiting for Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              You have no contracts waiting for review. All your completed
              contracts have been reviewed.
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
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Contracts Waiting for Review ({contracts.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please review these completed contracts to release payment to
          creators.
        </p>
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
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contract.creator.avatar_url} />
                      <AvatarFallback>
                        {contract.creator.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{contract.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Creator: {contract.creator.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {contract.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{contract.budget}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>
                        Completed{" "}
                        {new Date(contract.completed_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                  >
                    Waiting for Review
                  </Badge>
                  <Button
                    onClick={() => handleReviewClick(contract)}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Submit Review
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
