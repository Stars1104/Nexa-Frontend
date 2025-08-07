import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchUserCampaigns } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";
import { toast } from "../ui/sonner";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, User } from "lucide-react";

const tagColors: Record<string, string> = {
    Photo: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200",
    Video: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200",
    Review: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200",
    Unboxing: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200",
    Tutorial: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200",
    Story: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-200",
    Reels: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200",
    Post: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-200",
};

const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200",
    pending: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200",
    rejected: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200",
    archived: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
    approved: "Aprovada",
    pending: "Pendente",
    rejected: "Rejeitada",
    archived: "Arquivada",
};

interface AllowedCampaignsProps {
    setComponent?: (component: string | { name: string; campaign: any }) => void;
}

const AllowedCampaigns: React.FC<AllowedCampaignsProps> = ({ setComponent }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { userCampaigns, isLoading, error } = useSelector((state: RootState) => state.campaign);

    const [currentPage, setCurrentPage] = useState(1);
    const campaignsPerPage = 9;

    // Fetch user campaigns on component mount
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                await dispatch(fetchUserCampaigns()).unwrap();
            } catch (error) {
                console.error('Error fetching user campaigns:', error);
                toast.error("Erro ao carregar campanhas");
            }
        };

        fetchCampaigns();
    }, [dispatch]);

    // Clear error on component unmount
    useEffect(() => {
        return () => {
            if (error) {
                dispatch(clearError());
            }
        };
    }, [dispatch, error]);

    // Calculate pagination
    const totalCampaigns = userCampaigns?.length || 0;
    const totalPages = Math.ceil(totalCampaigns / campaignsPerPage);
    const startIndex = (currentPage - 1) * campaignsPerPage;
    const endIndex = startIndex + campaignsPerPage;
    const currentCampaigns = userCampaigns?.slice(startIndex, endIndex) || [];

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    // Format budget for display
    const formatBudget = (budget: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(budget);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate pagination items
    const generatePaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={() => handlePageChange(i)}
                            isActive={currentPage === i}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            // Show first page
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        onClick={() => handlePageChange(1)}
                        isActive={currentPage === 1}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            // Show ellipsis if needed
            if (currentPage > 3) {
                items.push(
                    <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            // Show current page and neighbors
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={() => handlePageChange(i)}
                            isActive={currentPage === i}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            // Show ellipsis if needed
            if (currentPage < totalPages - 2) {
                items.push(
                    <PaginationItem key="ellipsis2">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            // Show last page
            if (totalPages > 1) {
                items.push(
                    <PaginationItem key={totalPages}>
                        <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer"
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        }

        return items;
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-10 dark:bg-[#171717] min-h-[92vh]">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    Minhas Campanhas
                </h1>
                <p className="text-muted-foreground mb-6 text-sm md:text-base">
                    Carregando suas campanhas...
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-background rounded-xl shadow-sm border border-mute p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 flex-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 md:p-10 dark:bg-[#171717] min-h-[92vh]">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Erro ao carregar campanhas: {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 dark:bg-[#171717] min-h-[92vh]">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                Minhas Campanhas <span>📋</span>
            </h1>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Gerencie suas campanhas e acompanhe o progresso
            </p>

            {totalCampaigns === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-muted-foreground mb-6">
                        Você ainda não criou nenhuma campanha. Comece criando sua primeira campanha!
                    </p>
                    <button
                        onClick={() => setComponent?.("Nova campanha")}
                        className="bg-[#E91E63] text-white font-medium rounded-lg px-6 py-3 transition hover:bg-[#E91E63]/90"
                    >
                        Criar Primeira Campanha
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {startIndex + 1}-{Math.min(endIndex, totalCampaigns)} de {totalCampaigns} campanhas
                        </p>
                        {totalCampaigns > campaignsPerPage && (
                            <p className="text-sm text-muted-foreground">
                                Página {currentPage} de {totalPages}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {currentCampaigns.map((campaign: any, index: number) => (
                            <div
                                key={index}
                                className="bg-background rounded-xl shadow-sm border border-mute p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}${campaign.logo}`}
                                        alt="campaign"
                                        className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-base md:text-lg text-black dark:text-white line-clamp-1">
                                            {campaign.title}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 flex-wrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${tagColors[campaign.type] || "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                                }`}
                                        >
                                            {campaign.category}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}
                                        >
                                            {statusLabels[campaign.status]}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
                                        </svg>
                                        Prazo: {formatDate(campaign.deadline)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        {formatBudget(campaign.budget)}
                                    </span>
                                </div>
                                
                                {/* Google Drive Link */}

                                <div className="flex gap-3 mt-2 md:flex-row flex-col">
                                    <button
                                        className="flex-1 border-2 border-[#E91E63] text-[#E91E63] rounded-lg py-2 transition hover:bg-[#E91E63] hover:text-white"
                                        onClick={() => setComponent?.({ name: "Ver aplicação", campaign })}
                                    >
                                        <svg className="inline mr-2" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            <path stroke="currentColor" strokeWidth="2" d="M2 12C3.6 7 7.8 4 12 4s8.4 3 10 8c-1.6 5-5.8 8-10 8s-8.4-3-10-8Z" />
                                        </svg>
                                        Ver aplicações
                                    </button>
                                    <button
                                        className="flex-1 bg-[#E91E63] text-white font-medium rounded-lg py-2 transition hover:bg-[#E91E63]/90 flex justify-center items-center gap-2"
                                        onClick={() => setComponent?.({ name: "Ver criadores", campaign })}
                                    >
                                        <User />
                                        Ver criadores
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalCampaigns > campaignsPerPage && (
                        <div className="flex justify-center mt-8">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {generatePaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AllowedCampaigns; 