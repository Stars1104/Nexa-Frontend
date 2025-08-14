import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Trophy, Medal, Award, Crown, TrendingUp, Users, DollarSign } from "lucide-react";
import { adminApi, BrandRanking, BrandRankingsResponse, ComprehensiveRankingsResponse } from "../../api/admin";
import { useToast } from "../../hooks/use-toast";
import { Helmet } from "react-helmet-async";

export default function BrandRankings() {
    const [rankings, setRankings] = useState<BrandRankingsResponse['data'] | null>(null);
    const [comprehensiveRankings, setComprehensiveRankings] = useState<BrandRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("comprehensive");
    const { toast } = useToast();

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            
            const [rankingsRes, comprehensiveRes] = await Promise.all([
                adminApi.getBrandRankings(),
                adminApi.getComprehensiveRankings()
            ]);

            setRankings(rankingsRes.data);
            setComprehensiveRankings(comprehensiveRes.data);
        } catch (error) {
            console.error('Failed to fetch brand rankings:', error);
            toast({
                title: "Erro",
                description: "Falha ao carregar rankings das marcas",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-5 h-5 text-yellow-500" />;
            case 2:
                return <Trophy className="w-5 h-5 text-gray-400" />;
            case 3:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <Award className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRankBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
            case 2:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
            case 3:
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
            default:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
        }
    };

    const renderRankingCard = (brand: BrandRanking, showAllMetrics = false) => (
        <Card key={brand.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-500">
                                {getRankIcon(brand.rank)}
                            </span>
                            <Badge className={getRankBadgeColor(brand.rank)}>
                                #{brand.rank}
                            </Badge>
                        </div>
                        
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={brand.avatar_url || undefined} />
                            <AvatarFallback>
                                {brand.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {brand.display_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {brand.has_premium ? "Premium" : "Standard"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        {showAllMetrics ? (
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium">
                                        {brand.total_campaigns || 0} campanhas
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium">
                                        {brand.total_contracts || 0} contratos
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium">
                                        {brand.total_paid_formatted || 'R$ 0,00'}
                                    </span>
                                </div>
                                {brand.score && (
                                    <div className="text-xs text-gray-500">
                                        Score: {brand.score.toFixed(1)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-right">
                                {brand.total_campaigns !== undefined && (
                                    <div className="text-2xl font-bold text-blue-600">
                                        {brand.total_campaigns}
                                    </div>
                                )}
                                {brand.total_contracts !== undefined && (
                                    <div className="text-2xl font-bold text-green-600">
                                        {brand.total_contracts}
                                    </div>
                                )}
                                {brand.total_paid_formatted && (
                                    <div className="text-2xl font-bold text-purple-600">
                                        {brand.total_paid_formatted}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando rankings...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Rankings das Marcas - Admin | Nexa</title>
                <meta name="description" content="Rankings das marcas baseados em campanhas, contratações e pagamentos" />
            </Helmet>

            <div className="space-y-6 p-6 dark:bg-[#171717] h-[calc(100vh-100px)]">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Rankings das Marcas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Análise das marcas com melhor desempenho na plataforma
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="comprehensive">Ranking Geral</TabsTrigger>
                        <TabsTrigger value="mostPosted">Mais Campanhas</TabsTrigger>
                        <TabsTrigger value="mostHired">Mais Contratados</TabsTrigger>
                        <TabsTrigger value="mostPaid">Mais Pagos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="comprehensive" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <span>Ranking Geral das Marcas</span>
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ranking baseado em uma combinação de campanhas, contratações e pagamentos
                                </p>
                            </CardHeader>
                        </Card>
                        
                        <div className="grid gap-4">
                            {comprehensiveRankings.map((brand) => renderRankingCard(brand, true))}
                        </div>
                    </TabsContent>

                    <TabsContent value="mostPosted" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                    <span>Marcas com Mais Campanhas</span>
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ranking baseado no número total de campanhas criadas
                                </p>
                            </CardHeader>
                        </Card>
                        
                        <div className="grid gap-4">
                            {rankings?.mostPosted.map((brand) => renderRankingCard(brand))}
                        </div>
                    </TabsContent>

                    <TabsContent value="mostHired" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="w-6 h-6 text-green-500" />
                                    <span>Marcas que Mais Contrataram</span>
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ranking baseado no número de contratos completados
                                </p>
                            </CardHeader>
                        </Card>
                        
                        <div className="grid gap-4">
                            {rankings?.mostHired.map((brand) => renderRankingCard(brand))}
                        </div>
                    </TabsContent>

                    <TabsContent value="mostPaid" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="w-6 h-6 text-purple-500" />
                                    <span>Marcas que Mais Pagaram</span>
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ranking baseado no valor total pago aos criadores
                                </p>
                            </CardHeader>
                        </Card>
                        
                        <div className="grid gap-4">
                            {rankings?.mostPaid.map((brand) => renderRankingCard(brand))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
} 