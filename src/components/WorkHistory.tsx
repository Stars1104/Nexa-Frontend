import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface WorkHistoryProps {
  userId: number;
  type: 'creator' | 'brand';
}

interface WorkHistoryStats {
  total_contracts: number;
  total_earnings: string;
  average_rating: number;
  total_reviews: number;
}

interface WorkHistoryData {
  contracts: {
    data: Contract[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  statistics: WorkHistoryStats;
}

export const WorkHistory: React.FC<WorkHistoryProps> = ({ userId, type }) => {
  const [workHistory, setWorkHistory] = useState<WorkHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkHistory();
  }, [userId, type]);

  const loadWorkHistory = async () => {
    try {
      setLoading(true);
      const response = await hiringApi.getWorkHistory(userId, type);
      setWorkHistory(response.data);
    } catch (error) {
      console.error('Error loading work history:', error);
      toast({
        title: "Error",
        description: "Failed to load work history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  if (!workHistory || workHistory.contracts.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Work History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Work History</h3>
            <p className="text-muted-foreground">
              {type === 'creator' 
                ? "You haven't completed any contracts yet."
                : "You haven't completed any projects with creators yet."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = workHistory.statistics;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Work Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_contracts}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.total_earnings}</div>
              <div className="text-sm text-muted-foreground">
                {type === 'creator' ? 'Total Earned' : 'Total Spent'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.average_rating}</div>
              <div className="text-sm text-muted-foreground">Avg. Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_reviews}</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Completed Projects ({workHistory.contracts.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workHistory.contracts.data.map((contract) => (
              <div
                key={contract.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={type === 'creator' 
                            ? contract.brand?.avatar_url 
                            : contract.creator.avatar_url
                          } 
                        />
                        <AvatarFallback>
                          {(type === 'creator' 
                            ? contract.brand?.name 
                            : contract.creator.name
                          )?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{contract.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {type === 'creator' 
                            ? `Brand: ${contract.brand?.name}`
                            : `Creator: ${contract.creator.name}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {contract.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{contract.budget}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{contract.duration_days} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span>Completed {new Date(contract.completed_at!).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {contract.review && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{contract.review.rating}/5</span>
                        {contract.review.comment && (
                          <span className="text-muted-foreground">
                            - "{contract.review.comment.substring(0, 80)}..."
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completed
                    </Badge>
                    {type === 'creator' && contract.payment && (
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Earned</div>
                        <div className="font-medium text-green-600">
                          {contract.payment.creator_amount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 