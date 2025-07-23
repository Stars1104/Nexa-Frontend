import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCampaigns, approveCampaign, rejectCampaign } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";
import CampaignDetail from "./CampaignDetail";
import { Campaign } from "../../store/slices/campaignSlice";
import { toast } from "../ui/sonner";

const TABS = [
  { label: "Todas", value: "all" },
  { label: "Aprovadas", value: "approved" },
  { label: "Pendentes", value: "pending" },
  { label: "Rejeitadas", value: "rejected" },
  { label: "Arquivadas", value: "archived" },
];

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprovada",
  pending: "Pendente",
  rejected: "Rejeitada",
  archived: "Arquivada",
};

function filterCampaigns(campaigns: Campaign[], tab: string) {
  if (tab === "all") return campaigns;
  if (tab === "approved") return campaigns.filter((c) => c.status === "approved");
  if (tab === "pending") return campaigns.filter((c) => c.status === "pending");
  if (tab === "rejected") return campaigns.filter((c) => c.status === "rejected");
  if (tab === "archived") return campaigns.filter((c) => c.status === "archived");
  return campaigns;
}

const CampaignList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { campaigns, isLoading, error } = useAppSelector((state) => state.campaign);
  
  const [tab, setTab] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const campaignsToDisplay = Array.isArray(campaigns) ? campaigns : [];
  const filtered = filterCampaigns(campaignsToDisplay, tab);

  // Fetch campaigns on component mount
  useEffect(() => {
    const fetchCampaignsData = async () => {
      try {
        await dispatch(fetchCampaigns()).unwrap();
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error("Erro ao carregar campanhas");
      }
    };
    
    fetchCampaignsData();
  }, [dispatch]);

  // Clear error on component unmount
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const handleOpenModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleApprove = async (campaignId: number) => {
    try {
      await dispatch(approveCampaign(campaignId)).unwrap();
      toast.success("Campanha aprovada com sucesso!");
      handleCloseModal();
    } catch (error) {
      toast.error("Erro ao aprovar campanha");
    }
  };

  const handleReject = async (campaignId: number) => {
    try {
      await dispatch(rejectCampaign({ campaignId })).unwrap();
      toast.success("Campanha rejeitada com sucesso!");
      handleCloseModal();
    } catch (error) {
      toast.error("Erro ao rejeitar campanha");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="w-full mx-auto px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E91E63] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Erro ao carregar campanhas</p>
          <button 
            onClick={async () => {
              try {
                await dispatch(fetchCampaigns()).unwrap();
              } catch (error) {
                console.error('Error retrying fetch campaigns:', error);
                toast.error("Erro ao carregar campanhas");
              }
            }}
            className="px-4 py-2 bg-[#E91E63] text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-2 sm:px-6 py-6 dark:bg-[#171717] min-h-[92vh]">
      <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">Todas as Campanhas</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">Visualize e gerencie todas as campanhas da plataforma</p>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-5 py-2 rounded-lg font-medium border transition-colors duration-150
              ${tab === t.value
                ? "bg-[#E91E63] text-white border-[#E91E63]"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table for desktop, cards for mobile */}
      <div className="bg-background rounded-xl shadow p-2 sm:p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma campanha encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-2 font-medium">Nome</th>
                    <th className="py-3 px-2 font-medium">Status</th>
                    <th className="py-3 px-2 font-medium">Data de Criação</th>
                    <th className="py-3 px-2 font-medium">Marca</th>
                    <th className="py-3 px-2 font-medium">Criadores Aprovados</th>
                    <th className="py-3 px-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-2 text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</td>
                      <td className="py-4 px-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(c.submissionDate)}
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-700 dark:text-gray-300">
                        {c.brand?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-2 text-sm text-center text-gray-700 dark:text-gray-300">
                        {c.approvedCreators}
                      </td>
                      <td className="py-4 px-2">
                        <button
                          className="px-4 py-2 border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                          onClick={() => handleOpenModal(c)}
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {filtered.map((c, i) => (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{c.title}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Data: <span className="text-gray-700 dark:text-gray-200">{formatDate(c.submissionDate)}</span></span>
                    <span>Marca: <span className="text-gray-700 dark:text-gray-200">{c.brand?.name || 'N/A'}</span></span>
                    <span>Criadores: <span className="text-gray-700 dark:text-gray-200">{c.approvedCreators}</span></span>
                  </div>
                  <div className="mt-2">
                    <button
                      className="w-full px-4 py-2 border border-[#E91E63] text-[#E91E63] rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                      onClick={() => handleOpenModal(c)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {isModalOpen && selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onApprove={() => handleApprove(selectedCampaign.id)}
          onReject={() => handleReject(selectedCampaign.id)}
        />
      )}
    </div>
  );
};

export default CampaignList;
