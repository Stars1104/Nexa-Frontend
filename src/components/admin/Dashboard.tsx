import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Clock, Users, Settings, ClipboardList, Loader2 } from "lucide-react";
import { adminApi, DashboardMetrics, PendingCampaign, RecentUser } from "../../api/admin";
import { useToast } from "../../hooks/use-toast";
import { Helmet } from "react-helmet-async";

export default function Dashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>([]);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState<number[]>([]);
    const { toast } = useToast();

    // Fetch dashboard data on component mount
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch all data in parallel
            const [metricsRes, campaignsRes, usersRes] = await Promise.all([
                adminApi.getDashboardMetrics(),
                adminApi.getPendingCampaigns(),
                adminApi.getRecentUsers()
            ]);

            setMetrics(metricsRes.data);
            setPendingCampaigns(campaignsRes.data);
            setRecentUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast({
                title: "Erro",
                description: "Falha ao carregar dados do painel",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCampaignAction = async (campaignId: number, action: 'approve' | 'reject') => {
        try {
            setLoadingCampaigns(prev => [...prev, campaignId]);
            
            if (action === 'approve') {
                await adminApi.approveCampaign(campaignId);
                toast({
                    title: "Sucesso",
                    description: "Campanha aprovada com sucesso",
                });
            } else {
                await adminApi.rejectCampaign(campaignId);
                toast({
                    title: "Sucesso",
                    description: "Campanha rejeitada com sucesso",
                });
            }

            // Refresh pending campaigns
            const campaignsRes = await adminApi.getPendingCampaigns();
            setPendingCampaigns(campaignsRes.data);

            // Refresh metrics
            const metricsRes = await adminApi.getDashboardMetrics();
            setMetrics(metricsRes.data);
        } catch (error) {
            console.error(`Failed to ${action} campaign:`, error);
            toast({
                title: "Erro",
                description: `Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} campanha`,
                variant: "destructive",
            });
        } finally {
            setLoadingCampaigns(prev => prev.filter(id => id !== campaignId));
        }
    };

    const getBadgeColor = (tag: string) => {
        switch (tag) {
            case 'Marca':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';
            case 'Criador':
                return 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300';
        }
    };

    const stats = [
        {
            icon: <ClipboardList className="w-full h-full text-[#F72585] bg-pink-100 dark:bg-pink-900/40 rounded-full p-3" />,
            label: "Campanhas Pendentes",
            value: loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (metrics?.pendingCampaignsCount || 0),
        },
        {
            icon: <Users className="w-full h-full text-blue-500 bg-blue-100 dark:bg-blue-900/40 rounded-full p-3" />,
            label: "Usuários Ativos",
            value: loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (metrics?.allActiveCampaignCount || 0),
        },
        {
            icon: <Settings className="w-full h-full text-green-600 bg-green-100 dark:bg-green-900/40 rounded-full p-3" />,
            label: "Regras Ativas",
            value: loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (metrics?.allRejectCampaignCount || 0),
        },
        {
            icon: <Clock className="w-full h-full text-purple-500 bg-purple-100 dark:bg-purple-900/40 rounded-full p-3" />,
            label: "Ações Recentes",
            value: loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (metrics?.allUserCount || 0),
        },
    ];

    const canonical = typeof window !== "undefined" ? window.location.href : "";
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
    };

    return (
        <>
        <Helmet>
            <title>Nexa - Admin Painel</title>
            <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
            {canonical && <link rel="canonical" href={canonical} />}
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
        <div className="flex flex-col gap-6 px-2 sm:px-4 py-4 max-w-full mx-auto dark:bg-[#171717] min-h-[92vh]">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel do Administrador</h1>
                <p className="text-muted-foreground text-sm mt-1">Gerencie campanhas, usuários e regras da plataforma</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {stats.map((stat, i) => (
                    <Card key={stat.label} className="flex items-center justify-center gap-4 py-6 px-2 bg-background">
                        <div className="mb-2 w-12 h-12 flex items-center justify-center">{stat.icon}</div>
                        <div className="flex flex-col">
                            <div className="text-sm text-muted-foreground mb-1 text-center">{stat.label}</div>
                            <div className="text-2xl font-bold text-foreground flex items-center justify-center">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Recent Campaigns */}
                <Card className="bg-background">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Campanhas Pendentes Recentes</h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-4">
                                    {pendingCampaigns.map((campaign) => (
                                        <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg px-4 py-3 bg-muted/40 dark:bg-muted/20">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground">{campaign.title}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {campaign.brand} • {campaign.type} • R$ {campaign.budget.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
                                                <Button 
                                                    className="bg-[#F72585] hover:bg-pink-600 text-white" 
                                                    size="sm"
                                                    onClick={() => handleCampaignAction(campaign.id, 'approve')}
                                                    disabled={loadingCampaigns.includes(campaign.id)}
                                                >
                                                    {loadingCampaigns.includes(campaign.id) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Aprovar'
                                                    )}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    className="text-muted-foreground border-muted-foreground/30" 
                                                    size="sm"
                                                    onClick={() => handleCampaignAction(campaign.id, 'reject')}
                                                    disabled={loadingCampaigns.includes(campaign.id)}
                                                >
                                                    {loadingCampaigns.includes(campaign.id) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Rejeitar'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 text-center">
                                    <a href="#" className="text-[#F72585] hover:underline text-sm">Ver todas as campanhas pendentes</a>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                
                {/* Right: Recent Users */}
                <Card className="bg-background">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Usuários Recentes</h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-4">
                                    {recentUsers.map((user, index) => (
                                        <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg px-4 py-3 bg-muted/40 dark:bg-muted/20">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback>{index + 1}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-foreground text-sm">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.role} • Registrado há {user.registeredDaysAgo} {user.registeredDaysAgo === 1 ? 'dia' : 'dias'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center mt-3 sm:mt-0 sm:ml-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 text-center">
                                    <a href="#" className="text-[#F72585] hover:underline text-sm">Ver todos os usuários</a>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        </>
    );
}
