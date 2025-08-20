import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { fetchCreatorProfile } from "../../store/thunks/userThunks";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Star, 
  Play,
  Image
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "../ui/sonner";

interface CreatorProfileProps {
  creatorId?: string;
  onBack?: () => void;
  setComponent?: (component: string | { name: string; campaign?: any; creatorId?: string }) => void;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorId, onBack, setComponent }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const creatorProfileId = creatorId || id;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'reviews'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [creatorData, setCreatorData] = useState<any>(null);

  useEffect(() => {
    if (creatorProfileId) {
      // Validate creator ID
      if (!creatorProfileId || creatorProfileId === 'undefined' || creatorProfileId === 'null') {
        console.error('Invalid creator ID:', creatorProfileId);
        toast.error("ID do criador inválido");
        return;
      }
      
      setIsLoading(true);
      dispatch(fetchCreatorProfile(creatorProfileId))
        .unwrap()
        .then((data) => {
          setCreatorData(data);
        })
        .catch((error) => {
          console.error('Error fetching creator profile:', error);
          toast.error(error || "Erro ao carregar perfil do criador");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [creatorProfileId, dispatch]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (setComponent) {
      setComponent("Minhas campanhas");
    } else {
      navigate(-1);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="h-64 bg-muted rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Criador não encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            O perfil do criador não foi encontrado ou não está disponível.
          </p>
          <Button onClick={handleBack}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const { creator, portfolio, portfolio_items, reviews } = creatorData;

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Perfil do Criador
              </h1>
              <p className="text-muted-foreground mt-1">
                Informações sobre {creator.name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    {creator.avatar ? (
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                    ) : (
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                        {getInitials(creator.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <CardTitle className="text-xl">{creator.name}</CardTitle>
                
                {portfolio?.title && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {portfolio.title}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className={`h-4 w-4 ${getRatingColor(creator.rating)} fill-current`} />
                  <span className={`font-semibold ${getRatingColor(creator.rating)}`}>
                    {creator.rating}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({creator.total_reviews} avaliações)
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Public Info */}
                <div className="space-y-3">
                  {creator.state && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{creator.state}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Membro desde {format(new Date(creator.join_date), 'MMMM yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{creator.total_campaigns}</div>
                    <div className="text-xs text-muted-foreground">Campanhas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{creator.completed_campaigns}</div>
                    <div className="text-xs text-muted-foreground">Concluídas</div>
                  </div>
                </div>

                <Separator />

                {/* Portfolio Stats */}
                {portfolio && (
                  <>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Portfólio</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground">{portfolio.items_count}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">{portfolio.images_count}</div>
                          <div className="text-xs text-muted-foreground">Imagens</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">{portfolio.videos_count}</div>
                          <div className="text-xs text-muted-foreground">Vídeos</div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Portfólio
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Avaliações
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre {creator.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {portfolio?.bio || creator.bio || "Nenhuma descrição disponível."}
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-4">
                {portfolio_items && portfolio_items.length > 0 ? (
                  portfolio_items.map((item: any) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-shrink-0">
                            {item.media_type === 'video' ? (
                              <div className="relative w-full sm:w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                                <Play className="h-8 w-8 text-muted-foreground" />
                                <img
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50"
                                />
                              </div>
                            ) : (
                              <img
                                src={item.file_url}
                                alt={item.title}
                                className="w-full sm:w-32 h-24 object-cover rounded-lg"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-foreground line-clamp-2">
                                {item.title || 'Sem título'}
                              </h3>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {item.media_type === 'video' ? 'Vídeo' : 'Imagem'}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {item.media_type === 'video' ? (
                                  <Play className="h-3 w-3" />
                                ) : (
                                  <Image className="h-3 w-3" />
                                )}
                                {item.file_size}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum item no portfólio</h3>
                      <p className="text-muted-foreground">
                        Este criador ainda não adicionou itens ao seu portfólio.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews && reviews.length > 0 ? (
                  reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {review.brand_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(review.created_at), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação</h3>
                      <p className="text-muted-foreground">
                        Este criador ainda não recebeu avaliações.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile; 