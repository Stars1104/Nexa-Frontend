import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Star, MessageCircle, Calendar } from "lucide-react";
import { hiringApi, Review } from "../api/hiring";
import { cn } from "../lib/utils";
import { useToast } from '../hooks/use-toast';

interface ReviewsProps {
  userId: number;
  userType?: "creator" | "brand";
  showStats?: boolean;
  maxReviews?: number;
}

interface ReviewStats {
  average_rating: string | number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

export default function Reviews({
  userId,
  userType = "creator",
  showStats = true,
  maxReviews = 10,
}: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await hiringApi.getReviews(userId, undefined, true);

      // Handle the expected response structure
      const reviewsData = response.data.reviews.data.slice(0, maxReviews);
      const statsData = response.data.stats;


      setReviews(reviewsData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      setError(error.response?.data?.message || "Failed to load reviews");
      toast({
        title: "Erro",
        description: "Falha ao carregar avaliações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4)
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    if (rating >= 3)
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return "Excelente";
    if (rating >= 4) return "Muito Bom";
    if (rating >= 3) return "Bom";
    if (rating >= 2) return "Regular";
    return "Ruim";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Avaliações ({stats.total_reviews})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {Number(stats.average_rating).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Média Geral
                </div>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= Number(stats.average_rating)
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total_reviews}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Avaliações
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.rating_distribution[5] || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avaliações 5★
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma avaliação ainda</p>
              <p className="text-sm">Seja o primeiro a avaliar este criador!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer.avatar_url} />
                      <AvatarFallback>
                        {review.reviewer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {review.reviewer.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {review.contract.title}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-3 h-3",
                                star <= review.rating
                                  ? "text-yellow-500 fill-current"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <Badge
                          className={cn(
                            "text-xs",
                            getRatingColor(review.rating)
                          )}
                        >
                          {getRatingText(review.rating)}
                        </Badge>
                      </div>

                      {review.comment && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {review.comment}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
