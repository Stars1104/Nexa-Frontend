import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Dialog, DialogContent } from "../ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../ui/sonner";
import { AppDispatch, RootState } from "../../store";
import { fetchPendingCampaigns, approveCampaign, rejectCampaign } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";
import CampaignDetail from "@/components/admin/CampaignDetail";
import { Campaign } from "../../store/slices/campaignSlice";
import CampaignLogo from "../ui/CampaignLogo";

export default function PendingCampaign() {
    const dispatch = useDispatch<AppDispatch>();
    const { pendingCampaigns, isLoading, error } = useSelector((state: RootState) => state.campaign);
    const { user } = useSelector((state: RootState) => state.auth);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
    const [accessDenied, setAccessDenied] = useState(false);
    const timeoutRefs = useRef<number[]>([]);
    
    // Ensure pendingCampaigns is always an array
    const campaignsToDisplay = Array.isArray(pendingCampaigns) ? pendingCampaigns : [];

    // Check if user has admin role before making API calls
    useEffect(() => {
        if (user && user.role !== 'admin') {
            setAccessDenied(true);
            toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
            return;
        }

        const fetchCampaigns = async () => {
            try {
                await dispatch(fetchPendingCampaigns()).unwrap();
            } catch (error: any) {
                console.error('Error fetching pending campaigns:', error);
                if (error?.includes('403') || error?.includes('Acesso negado')) {
                    setAccessDenied(true);
                    toast.error("Acesso negado. Você não tem permissão para acessar campanhas pendentes.");
                } else {
                    toast.error("Erro ao carregar campanhas pendentes");
                }
            }
        };
        
        fetchCampaigns();
    }, [dispatch, user]);

    // Clear error on component unmount
    useEffect(() => {
        return () => {
            if (error) {
                dispatch(clearError());
            }
        };
    }, [dispatch, error]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            // Clear any pending timeouts to prevent memory leaks
            timeoutRefs.current.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            timeoutRefs.current = [];
        };
    }, []);

    const handleApprove = useCallback(async (id: number) => {
        if (user?.role !== 'admin') {
            toast.error("Acesso negado. Apenas administradores podem aprovar campanhas.");
            return;
        }

        setProcessingIds(prev => new Set(prev).add(id));
        
        try {
            await dispatch(approveCampaign(id)).unwrap();
            // Add a small delay to prevent toast from interfering with DOM updates
            const timeoutId = setTimeout(() => {
                toast.success("Campanha aprovada com sucesso!");
            }, 100);
            timeoutRefs.current.push(timeoutId as unknown as number);
            // Don't refresh the list - let Redux state handle the UI update
        } catch (error: any) {
            console.error('Error approving campaign:', error);
            const errorMessage = typeof error === 'string' ? error : error?.message || "Erro ao aprovar campanha";
            if (errorMessage.includes('403') || errorMessage.includes('Acesso negado')) {
                toast.error("Acesso negado. Você não tem permissão para aprovar campanhas.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    }, [user?.role, dispatch]);

    const handleReject = useCallback(async (id: number) => {
        if (user?.role !== 'admin') {
            toast.error("Acesso negado. Apenas administradores podem rejeitar campanhas.");
            return;
        }

        setProcessingIds(prev => new Set(prev).add(id));
        
        try {
            await dispatch(rejectCampaign({ campaignId: id, reason: "Rejeitado pelo administrador" })).unwrap();
            // Add a small delay to prevent toast from interfering with DOM updates
            const timeoutId = setTimeout(() => {
                toast.success("Campanha rejeitada com sucesso!");
            }, 100);
            timeoutRefs.current.push(timeoutId as unknown as number);
            // Don't refresh the list - let Redux state handle the UI update
        } catch (error: any) {
            console.error('Error rejecting campaign:', error);
            const errorMessage = typeof error === 'string' ? error : error?.message || "Erro ao rejeitar campanha";
            if (errorMessage.includes('403') || errorMessage.includes('Acesso negado')) {
                toast.error("Acesso negado. Você não tem permissão para rejeitar campanhas.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    }, [user?.role, dispatch]);

    const handleViewDetails = useCallback((campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setDetailOpen(true);
    }, []);

    const handleRefresh = useCallback(() => {
        if (user?.role !== 'admin') {
            toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
            return;
        }

        const refreshCampaigns = async () => {
            try {
                await dispatch(fetchPendingCampaigns()).unwrap();
            } catch (error: any) {
                console.error('Error refreshing pending campaigns:', error);
                const errorMessage = typeof error === 'string' ? error : error?.message || "Erro ao atualizar campanhas pendentes";
                if (errorMessage.includes('403') || errorMessage.includes('Acesso negado')) {
                    setAccessDenied(true);
                    toast.error("Acesso negado. Você não tem permissão para acessar campanhas pendentes.");
                } else {
                    toast.error(errorMessage);
                }
            }
        };
        
        refreshCampaigns();
    }, [user?.role, dispatch]);

    // Show access denied message if user doesn't have admin role
    if (accessDenied || (user && user.role !== 'admin')) {
        return (
            <div className="w-full px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh] flex items-center justify-center">
                <Alert className="max-w-md border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <AlertTitle className="text-red-800 dark:text-red-200">Acesso Negado</AlertTitle>
                    <AlertDescription className="text-red-700 dark:text-red-300">
                        Você não tem permissão para acessar esta página. Apenas administradores podem visualizar campanhas pendentes.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isLoading && (!Array.isArray(campaignsToDisplay) || campaignsToDisplay.length === 0)) {
        return (
            <div className="w-full px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando campanhas pendentes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh]">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Campanhas Pendentes</h1>
                    <p className="text-muted-foreground text-sm mt-1">Aprove ou rejeite campanhas submetidas por marcas</p>
                    {/* Removed Badge for mock data as it's no longer used */}
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                    {isLoading ? "Atualizando..." : "Atualizar"}
                </Button>
            </div>

            {/* Error message */}
            {error && (
                <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <AlertTitle className="text-red-800 dark:text-red-200">Erro</AlertTitle>
                    <AlertDescription className="text-red-700 dark:text-red-300">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="w-full flex flex-col gap-4 p-4 sm:p-6 bg-background rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex gap-2 mt-2 sm:mt-0 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Total</span>
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                            {campaignsToDisplay.length} campanhas
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                            Filtrar
                        </Button>
                        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                            Ordenar
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {(!Array.isArray(campaignsToDisplay) || campaignsToDisplay.length === 0) && !isLoading && (
                        <Alert className="mt-8">
                            <AlertTitle>Nenhuma campanha pendente</AlertTitle>
                            <AlertDescription>
                                Não há campanhas aguardando aprovação no momento.
                            </AlertDescription>
                        </Alert>
                    )}

                    {campaignsToDisplay.map((campaign : any) => (
                        <Card key={`campaign-${campaign.id}-${campaign.status}-${processingIds.has(campaign.id)}`} className="p-0 border bg-background text-foreground shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-6">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center gap-3">
                                        <CampaignLogo 
                                            logo={campaign.logo}
                                            brandName={campaign.brand?.name || 'Brand'}
                                            size="md"
                                        />
                                        <div>
                                            <CardTitle className="text-lg sm:text-xl text-foreground">{campaign.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{campaign.brand?.name || 'Marca não especificada'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-4">
                                            <span>
                                                <span className="font-medium text-foreground">Valor:</span> R$ {campaign.budget?.toLocaleString("pt-BR") || campaign.value?.toLocaleString("pt-BR")}
                                            </span>
                                            <span>
                                                <span className="font-medium text-foreground">Prazo:</span> {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString("pt-BR") : 'Prazo não definido'}
                                            </span>
                                            <span>
                                                <span className="font-medium text-foreground">Estados:</span> {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("pt-BR") : 'Prazo não definido'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        {campaign.category}
                                    </Badge>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                                        Pendente
                                    </Badge>
                                </div>
                            </div>
                            
                            <CardContent className="pt-4 pb-2 px-4 sm:px-6">
                                <div className="space-y-2">
                                    <div>
                                        <span className="block text-sm font-medium text-foreground mb-1">Descrição</span>
                                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                            
                            <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 pb-4 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(campaign)}
                                    className="w-full sm:w-auto"
                                >
                                    Ver detalhes
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleReject(campaign.id)}
                                    disabled={processingIds.has(campaign.id)}
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    {processingIds.has(campaign.id) ? "Rejeitando..." : "Rejeitar"}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleApprove(campaign.id)}
                                    disabled={processingIds.has(campaign.id)}
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {processingIds.has(campaign.id) ? "Aprovando..." : "Aprovar"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Campaign Detail Modal */}
            {selectedCampaign && (
                <CampaignDetail
                    campaign={selectedCampaign}
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                    onApprove={() => handleApprove(selectedCampaign.id)}
                    onReject={() => handleReject(selectedCampaign.id)}
                    path="pending"
                />
            )}
        </div>
    );
}
