import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchUserCampaigns, updateCampaign, deleteCampaign } from "../../store/thunks/campaignThunks";
import { toast } from "../ui/sonner";
import { Button } from "../ui/button";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  MoreVertical,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  X,
  History,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EditCampaign from "./EditCampaign";
import { hiringApi } from "../../api/hiring";
import CampaignTimelineSidebar from "../CampaignTimelineSidebar";

interface CampaignManagementProps {
  setComponent?: (component: string | { name: string; campaign?: any }) => void;
}

interface Campaign {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  remuneration_type: 'paga' | 'permuta';
  target_states: string[];
  target_genders: string[];
  target_creator_types: string[];
  min_age?: number;
  max_age?: number;
  logo?: string;
  created_at: string;
  updated_at: string;
  applications_count?: number;
  is_active: boolean;
  is_featured: boolean;
}

const CampaignManagement: React.FC<CampaignManagementProps> = ({ setComponent }) => {
  const dispatch = useAppDispatch();
  const { userCampaigns, isLoading, error } = useAppSelector((state) => state.campaign);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [campaignContracts, setCampaignContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'log'>('details');
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [showTimelineSidebar, setShowTimelineSidebar] = useState(false);

  useEffect(() => {
    dispatch(fetchUserCampaigns());
  }, [dispatch]);

  const filteredCampaigns = userCampaigns.filter((campaign) => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovada';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitada';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Use utility function that handles timezone correctly for YYYY-MM-DD dates
  const formatDate = (dateString: string) => {
    // Check if date is in YYYY-MM-DD format (from backend)
    // If so, create Date in local timezone to avoid UTC conversion issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
    // For other formats, use standard parsing
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  };

  const handleView = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowViewModal(true);
    setActiveTab('details');
    await loadCampaignContracts(campaign.id);
  };

  const loadCampaignContracts = async (campaignId: number) => {
    try {
      setLoadingContracts(true);
      const response = await hiringApi.getContracts();
      const allContracts = response.data.data || [];
      
      // Filter contracts that belong to this campaign through offers
      const contracts = allContracts.filter((contract: any) => {
        return contract.offer?.campaign_id === campaignId;
      });
      
      setCampaignContracts(contracts);
    } catch (error) {
      console.error('Error loading campaign contracts:', error);
      toast.error("Erro ao carregar contratos da campanha");
    } finally {
      setLoadingContracts(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCampaign) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteCampaign(selectedCampaign.id)).unwrap();
      toast.success("Campanha deletada com sucesso!");
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      dispatch(fetchUserCampaigns()); // Refresh the list
    } catch (error) {
      toast.error("Erro ao deletar campanha");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = () => {
    setShowEditModal(false);
    setSelectedCampaign(null);
    dispatch(fetchUserCampaigns()); // Refresh the list
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">Erro ao carregar campanhas</p>
        <Button onClick={() => dispatch(fetchUserCampaigns())}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 dark:bg-[#171717] h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Campanhas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas campanhas e acompanhe o progresso
          </p>
        </div>
        <Button
          onClick={() => setComponent?.("Nova campanha")}
          className="flex items-center gap-2 bg-[#e91e63] text-white"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-white outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg bg-white border dark:bg-[#0d0d0d] text-gray-900 dark:text-white appearance-none"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovada</option>
            <option value="rejected">Rejeitada</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma campanha encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca"
                : "Crie sua primeira campanha para começar"
              }
            </p>
            {(!searchTerm && statusFilter === "all") && (
              <Button onClick={() => setComponent?.("Nova campanha")} className="bg-[#e91e63] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            )}
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white dark:bg-[#0d0d0d] rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                      {campaign.logo ? (
                        <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${campaign.logo}`}
                          alt={campaign.title}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {campaign.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {campaign.remuneration_type === 'paga' 
                              ? formatCurrency(campaign.budget)
                              : 'Permuta'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Prazo: {formatDate(campaign.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{campaign.applications_count || 0} candidaturas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(campaign)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Campaigns
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(campaign)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(campaign)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir a campanha <strong>"{selectedCampaign.title}"</strong>?
              Todas as candidaturas e dados relacionados serão perdidos.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCampaign && (
        <EditCampaign
          campaign={selectedCampaign}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
        />
      )}

      {/* Campaign Details Modal */}
      {showViewModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] border rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  {selectedCampaign.logo ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${selectedCampaign.logo}`}
                      alt={selectedCampaign.title}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedCampaign.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCampaign.status)}`}>
                      {getStatusIcon(selectedCampaign.status)}
                      {getStatusLabel(selectedCampaign.status)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'log'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <History className="w-4 h-4" />
                Log da Campanha
              </button>
            </div>

            {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Detalhes da Campanha
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Orçamento:</strong> {selectedCampaign.remuneration_type === 'paga' 
                          ? formatCurrency(selectedCampaign.budget)
                          : 'Permuta'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Prazo:</strong> {formatDate(selectedCampaign.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Candidaturas:</strong> {selectedCampaign.applications_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Categoria:</strong> {(selectedCampaign as any).category || 'Não especificada'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Descrição
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedCampaign.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Briefing
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {(selectedCampaign as any).briefing || 'Nenhum briefing disponível'}
                  </p>
                </div>
              </div>

              {/* Requirements and Additional Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Requisitos
                  </h3>
                  <ul className="space-y-2">
                    {(selectedCampaign as any).requirements?.map((requirement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        {requirement}
                      </li>
                    )) || (
                      <li className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum requisito específico
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Estados Alvo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCampaign as any).target_states?.map((state: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {state}
                      </span>
                    )) || (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Todos os estados
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Informações da Marca
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Nome:</strong> {(selectedCampaign as any).brand?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Email:</strong> {(selectedCampaign as any).brand?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'log' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contratos e Timeline
                  </h3>
                  {loadingContracts && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                {campaignContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {loadingContracts 
                        ? 'Carregando contratos...' 
                        : 'Nenhum contrato encontrado para esta campanha'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaignContracts.map((contract: any) => (
                      <div
                        key={contract.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {contract.title}
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <span>
                                <strong>Status:</strong> {contract.status}
                              </span>
                              <span>
                                <strong>Criador:</strong> {contract.creator?.name || 'N/A'}
                              </span>
                              {contract.started_at && (
                                <span>
                                  <strong>Iniciado:</strong> {formatDate(contract.started_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContractId(contract.id);
                              setShowTimelineSidebar(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Activity className="w-4 h-4" />
                            Ver Timeline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Timeline Sidebar */}
      {selectedContractId && (
        <CampaignTimelineSidebar
          contractId={selectedContractId}
          isOpen={showTimelineSidebar}
          onClose={() => {
            setShowTimelineSidebar(false);
            setSelectedContractId(null);
          }}
        />
      )}
    </div>
  );
};

export default CampaignManagement;
