import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchApprovedCampaigns } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";
import { toast } from "../ui/sonner";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  CalendarIcon,
  Filter,
  X,
  Search,
  Star,
  FileText,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchCreatorApplications, toggleFavoriteCampaign } from "../../store/thunks/campaignThunks";
import CampaignCard from "./CampaignCard";
import CampaignStats from "./CampaignStats";
import ContractList from "./ContractList";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { hiringApi } from "../../api/hiring";
import { useSafeToast } from "../../hooks/useSafeToast";

// Stats will be calculated dynamically based on approved campaigns

// Categorias em português
const categories = [
  "Todas as categorias",
  "Vídeo",
  "Foto",
  "Review",
  "Unboxing",
  "Tutorial",
  "Story",
  "Reels",
  "Post",
  "Live",
  "Podcast",
  "Blog",
];

// Estados brasileiros por nome
const brazilianStates = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins",
];

interface DashboardProps {
  setComponent?: (component: string) => void;
  setProjectId?: (projectId: number) => void;
}

interface FilterState {
  category: string;
  region: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  sort: string;
  search: string;
  budgetMin: string;
  budgetMax: string;
}

const statesColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
];

export default function Dashboard({
  setComponent,
  setProjectId,
}: DashboardProps) {
  const dispatch = useAppDispatch();
  const { approvedCampaigns, isLoading, error } = useAppSelector(
    (state) => state.campaign
  );
  const { creatorApplications } = useAppSelector((state) => state.campaign);
  const { user } = useAppSelector((state) => state.auth);
  const safeToast = useSafeToast();

  // Ensure creatorApplications is always an array
  const safeCreatorApplications = Array.isArray(creatorApplications)
    ? creatorApplications
    : [];

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    region: "all",
    dateFrom: undefined,
    dateTo: undefined,
    sort: "newest-first",
    search: "",
    budgetMin: "",
    budgetMax: "",
  });

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Ensure approvedCampaigns is always an array
  const campaigns = Array.isArray(approvedCampaigns) ? approvedCampaigns : [];
  
  // Add state for completed campaigns and reviews
  const [completedCampaigns, setCompletedCampaigns] = useState<number>(0);
  const [reviewStats, setReviewStats] = useState<{ total: number; average: number }>({ total: 0, average: 0 });

  // Fetch approved campaigns on component mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        await dispatch(fetchApprovedCampaigns()).unwrap();
      } catch (error) {
        console.error("Error fetching approved campaigns:", error);
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

  // Fetch completed campaigns and reviews on mount (after user is loaded)
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      // Fetch completed campaigns
      try {
        const workHistoryRes = await hiringApi.getCreatorWorkHistory();
        const completed = Array.isArray(workHistoryRes.data.data)
          ? workHistoryRes.data.data.filter((c: any) => c.status === "completed").length
          : 0;
        setCompletedCampaigns(completed);
      } catch (e) {
        setCompletedCampaigns(0);
      }
      // Fetch reviews
      try {
        const reviewsRes = await hiringApi.getReviews(user.id, undefined, true);
        const stats = reviewsRes.data.stats || {};
        setReviewStats({
          total: stats.total_reviews || 0,
          average: Number(stats.average_rating) || 0,
        });
      } catch (e) {
        setReviewStats({ total: 0, average: 0 });
      }
    };
    if (user?.id) fetchStats();
  }, [user]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: "all",
      region: "all",
      dateFrom: undefined,
      dateTo: undefined,
      sort: "newest-first",
      search: "",
      budgetMin: "",
      budgetMax: "",
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.region !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search ||
    filters.budgetMin ||
    filters.budgetMax;

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleToggleFavorite = async (campaignId: number) => {
    try {
      const result = await dispatch(toggleFavoriteCampaign(campaignId)).unwrap();
    } catch (error) {
      console.error('❌ Error in handleToggleFavorite:', error);
      safeToast.error("Falha ao favoritar/desfavoritar campanha");
    }
  };

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = campaigns
    .filter((campaign) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const title = campaign.title?.toLowerCase() || "";
        const description = campaign.description?.toLowerCase() || "";
        const brandName = campaign.brand?.name?.toLowerCase() || "";
        const category =
          campaign.category?.toLowerCase() ||
          campaign.type?.toLowerCase() ||
          "";

        if (
          !title.includes(searchTerm) &&
          !description.includes(searchTerm) &&
          !brandName.includes(searchTerm) &&
          !category.includes(searchTerm)
        ) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== "all") {
        const campaignCategory =
          campaign.category?.toLowerCase() ||
          campaign.type?.toLowerCase() ||
          "";
        if (!campaignCategory.includes(filters.category.toLowerCase())) {
          return false;
        }
      }

      // Region filter
      if (filters.region !== "all") {
        const campaignLocations =
          typeof campaign.location === "string"
            ? campaign.location.split(",").map((loc) => loc.trim())
            : Array.isArray(campaign.location)
            ? campaign.location
            : [];
        if (
          !campaignLocations.some(
            (loc) => loc.toUpperCase() === filters.region.toUpperCase()
          )
        ) {
          return false;
        }
      }

      // Budget range filter
      if (
        filters.budgetMin &&
        campaign.budget < parseFloat(filters.budgetMin)
      ) {
        return false;
      }
      if (
        filters.budgetMax &&
        campaign.budget > parseFloat(filters.budgetMax)
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const campaignDate = new Date(campaign.deadline);
        const fromDate = new Date(filters.dateFrom);
        if (campaignDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const campaignDate = new Date(campaign.deadline);
        const toDate = new Date(filters.dateTo);
        if (campaignDate > toDate) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // First priority: Favorited campaigns
      if (a.is_favorited && !b.is_favorited) return -1;
      if (!a.is_favorited && b.is_favorited) return 1;
      
      // Second priority: Sort by specified criteria
      switch (filters.sort) {
        case "newest-first":
          return new Date(b.submissionDate || b.created_at).getTime() - new Date(a.submissionDate || a.created_at).getTime();
        case "oldest-first":
          return new Date(a.submissionDate || a.created_at).getTime() - new Date(b.submissionDate || b.created_at).getTime();
        case "budget-high":
          return b.budget - a.budget;
        case "budget-low":
          return a.budget - b.budget;
        case "deadline-soon":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "deadline-late":
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        default:
          return 0;
      }
    });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Format budget for display
  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(budget);
  };

// Helper function to safely convert budget to number
  const safeParseBudget = (budget: any): number => {
    if (typeof budget === 'number') {
      return isNaN(budget) ? 0 : budget;
    }
    if (typeof budget === 'string') {
      // Remove currency symbols and formatting
      const cleanValue = budget.replace(/[^\d,.-]/g, '');
      if (cleanValue.includes(',')) {
        // Handle Brazilian format (1.500,50 -> 1500.50)
        const withoutThousands = cleanValue.replace(/\./g, '');
        const numericValue = withoutThousands.replace(',', '.');
        const parsed = parseFloat(numericValue);
        return isNaN(parsed) ? 0 : parsed;
      } else {
        const parsed = parseFloat(cleanValue);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
    return 0;
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get deadline status
  const getDeadlineStatus = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0)
      return {
        status: "expired",
        text: "Expirado",
        color: "text-red-600 bg-red-100",
      };
    if (days <= 3)
      return {
        status: "urgent",
        text: `${days} dias`,
        color: "text-orange-600 bg-orange-100",
      };
    if (days <= 7)
      return {
        status: "soon",
        text: `${days} dias`,
        color: "text-yellow-600 bg-yellow-100",
      };
    return {
      status: "normal",
      text: `${days} dias`,
      color: "text-green-600 bg-green-100",
    };
  };

  // Calculate enhanced stats
  const activeOpportunities = campaigns.filter(
    (c) => getDaysUntilDeadline(c.deadline) > 0
  ).length;

  const averageBudget =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + safeParseBudget(c.budget), 0) / campaigns.length
      : 0;

  const approvedApplications = safeCreatorApplications.filter(
    (app) => app.status === "approved"
  ).length;

  const successRate =
    safeCreatorApplications.length > 0
      ? Math.round(
          (approvedApplications / safeCreatorApplications.length) * 100
        )
      : 0;

  const totalEarnings = approvedApplications * averageBudget;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 min-h-[92vh] dark:bg-[#171717]">
      {/* Welcome */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold flex items-center gap-2">
          Bem-vinda, {user?.name || "Criador"} <span>👋</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Descubra novas campanhas e comece a criar conteúdo incrível!
        </p>
      </div>

      {/* Enhanced Stats */}
      <CampaignStats
        totalCampaigns={campaigns.length}
        myApplications={safeCreatorApplications.length}
        completedCampaigns={completedCampaigns}
        reviewsCount={reviewStats.total}
        reviewsAverage={reviewStats.average}
        totalEarnings={totalEarnings}
        averageBudget={averageBudget}
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar campanhas por título, descrição, marca ou categoria..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-10 h-12"
          />
        </div>

        {/* Filter Toggle and Quick Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros Avançados</span>
              <span className="sm:hidden">Filtros</span>
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {[
                    filters.category !== "all" ? 1 : 0,
                    filters.region !== "all" ? 1 : 0,
                    filters.dateFrom ? 1 : 0,
                    filters.dateTo ? 1 : 0,
                    filters.search ? 1 : 0,
                    filters.budgetMin ? 1 : 0,
                    filters.budgetMax ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar Filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={filters.sort}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sort: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest-first">Mais recentes</SelectItem>
                  <SelectItem value="oldest-first">Mais antigas</SelectItem>
                  <SelectItem value="price-high-to-low">
                    Maior orçamento
                  </SelectItem>
                  <SelectItem value="price-low-to-high">
                    Menor orçamento
                  </SelectItem>
                  <SelectItem value="deadline-soonest">Prazo próximo</SelectItem>
                  <SelectItem value="deadline-latest">Prazo distante</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Filtros Avançados</CardTitle>
              <CardDescription>
                Refine sua busca para encontrar as campanhas ideais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label
                    htmlFor="category-filter"
                    className="text-xs font-medium"
                  >
                    Categoria
                  </Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category.toLowerCase().replace(/\s+/g, "-")}
                        >
                          {category}
                        </SelectItem>   
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region Filter */}
                <div className="space-y-2">
                  <Label
                    htmlFor="region-filter"
                    className="text-xs font-medium"
                  >
                    Estado
                  </Label>
                  <Select
                    value={filters.region}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, region: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Min Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Orçamento Mínimo
                  </Label>
                  <Input
                    type="number"
                    placeholder="R$ 0"
                    value={filters.budgetMin}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        budgetMin: e.target.value,
                      }))
                    }
                    className="h-9"
                  />
                </div>

                {/* Budget Max Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Orçamento Máximo
                  </Label>
                  <Input
                    type="number"
                    placeholder="R$ 10.000"
                    value={filters.budgetMax}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        budgetMax: e.target.value,
                      }))
                    }
                    className="h-9"
                  />
                </div>

                {/* Date From Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? (
                          format(filters.dateFrom, "PPP", { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">
                            Escolha uma data
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) =>
                          setFilters((prev) => ({ ...prev, dateFrom: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? (
                          format(filters.dateTo, "PPP", { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">
                            Escolha uma data
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) =>
                          setFilters((prev) => ({ ...prev, dateTo: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Campaigns and Contracts */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
                Campanhas Disponíveis
              </h3>
              {filteredAndSortedCampaigns.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedCampaigns.length} de {campaigns.length}{" "}
                  campanhas
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex gap-2 mb-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                    <CardFooter>
                      <div className="flex justify-between items-center w-full">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedCampaigns.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  {hasActiveFilters ? (
                    <>
                      <div className="mb-4">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhuma campanha encontrada
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Nenhuma campanha corresponde aos filtros atuais.
                        </p>
                        <p className="text-muted-foreground text-sm mb-6">
                          Tente ajustar os filtros ou limpe-os para ver todas as
                          campanhas.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="mx-auto"
                      >
                        Limpar Filtros
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhuma campanha disponível
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Não há campanhas aprovadas disponíveis no momento.
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Volte mais tarde para novas oportunidades!
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedCampaigns
                  .filter((campaign: any) => {
                    if (statusFilter === "all") return true;
                    const myApp =
                      user?.role === "creator"
                        ? safeCreatorApplications.find(
                            (app) =>
                              app.campaign_id === campaign.id &&
                              app.creator_id === user.id
                          )
                        : null;
                    if (!myApp) return false;
                    return myApp.status === statusFilter;
                  })
                  .map((campaign: any) => {
                    const myApp =
                      user?.role === "creator"
                        ? safeCreatorApplications.find(
                            (app) =>
                              app.campaign_id === campaign.id &&
                              app.creator_id === user.id
                          )
                        : null;

                    return (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        userApplication={myApp}
                        onViewDetails={(campaignId) => {
                          setComponent("Detalhes do Projeto");
                          setProjectId(campaignId);
                        }}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <ContractList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
