import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCampaignApplications, approveApplication, rejectApplication } from "../../store/thunks/campaignThunks";
import { toast } from "../ui/sonner";
import { Button } from "../ui/button";
import { Link as LinkIcon, DollarSign, Calendar, X } from "lucide-react";
import { useBrandChatNavigation } from "../../hooks/useBrandChatNavigation";

function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ViewCreatorsProps {
  setComponent?: (component: string | { name: string; campaign: any }) => void;
  campaignId: number;
  campaignTitle?: string;
}

const ViewCreators: React.FC<ViewCreatorsProps> = ({ setComponent, campaignId, campaignTitle }) => {
  const dispatch = useAppDispatch();
  const { applications, isLoading, error } = useAppSelector((state) => state.campaign);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { navigateToChatWithRoom } = useBrandChatNavigation();

  useEffect(() => {
    if (campaignId) {
      dispatch(fetchCampaignApplications(campaignId));
    }
  }, [dispatch, campaignId]);

  const handleApprove = async (applicationId: number) => {
    try {
      await dispatch(approveApplication({ campaignId, applicationId })).unwrap();
      toast.success("Aplicação aprovada com sucesso!");
      setSidebarOpen(false);
      setSelectedApp(null);
    } catch {
      toast.error("Erro ao aprovar aplicação");
    }
  };

  const handleReject = async (applicationId: number) => {
    try {
      await dispatch(rejectApplication({ campaignId, applicationId, reason: "" })).unwrap();
      toast.success("Aplicação rejeitada com sucesso!");
      setSidebarOpen(false);
      setSelectedApp(null);
    } catch {
      toast.error("Erro ao rejeitar aplicação");
    }
  };

  // Filter applications for this campaign
  const filteredApps = applications.filter(app => app.campaign_id === campaignId);

  // Sidebar close handler
  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedApp(null), 300); // Wait for animation
  };

  return (
    <div className="min-h-[92vh] dark:bg-[#171717] px-2 sm:px-10 py-4 relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button className="text-gray-500 dark:text-gray-300 hover:text-pink-500 transition-colors" aria-label="Voltar para Campanhas" onClick={() => setComponent?.("Minhas campanhas")}> 
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-300 cursor-pointer" onClick={() => setComponent?.("Minhas campanhas")}>Voltar para Campanhas</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Aplicações para: {campaignTitle || "Campanha"}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">{filteredApps.length} criadores se candidataram para esta campanha</p>
      {isLoading && <div className="text-center text-muted-foreground py-8">Carregando aplicações...</div>}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      <div className="space-y-4">
        {filteredApps.map((app) => {
          const status = app.status;
          const isApproved = status === 'approved';
          const isRejected = status === 'rejected';
          const creator = app.creator || {};
          return (
            <div
              key={app.id}
              className="bg-background rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-6 gap-4 border border-gray-100 dark:border-neutral-700 cursor-pointer hover:shadow-md transition"
              onClick={() => { setSelectedApp(app); setSidebarOpen(true); }}
            >
              {/* User Info */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {creator.avatar ? (
                  <img
                    src={creator.avatar}
                    alt={creator.name || "Criador"}
                    className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-pink-600 text-white font-bold text-lg border border-gray-200 dark:border-neutral-700">
                    {getInitials(creator.name)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{creator.name}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                    {/* Follower count if available */}
                    {creator.followers && <span>{creator.followers} seguidores</span>}
                  </div>
                  <div className="mt-2">
                    {status === 'pending' && (
                      <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-1 rounded-full">Aguardando decisão</span>
                    )}
                    {status === 'approved' && (
                      <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-3 py-1 rounded-full">Aprovado</span>
                    )}
                    {status === 'rejected' && (
                      <span className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-3 py-1 rounded-full">Rejeitado</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {isApproved ? (
                  <button 
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-sm sm:text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      setIsCreatingChat(true);
                      try {
                        await navigateToChatWithRoom(campaignId, app.creator.id, setComponent);
                      } finally {
                        setIsCreatingChat(false);
                      }
                    }}
                    disabled={isCreatingChat}
                  >
                    {isCreatingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Chat
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base shadow-sm ${
                      isRejected 
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                        : 'bg-[#E91E63] hover:bg-pink-600 text-white'
                    }`}
                    onClick={e => { e.stopPropagation(); handleApprove(app.id); }}
                    disabled={isRejected || isLoading}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Aprovar
                  </button>
                )}
                <button 
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg border font-medium transition-colors text-sm sm:text-base shadow-sm ${
                    isApproved 
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={e => { e.stopPropagation(); handleReject(app.id); }}
                  disabled={isApproved || isLoading}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Rejeitar
                </button>
              </div>
            </div>
          );
        })}
        {(!isLoading && filteredApps.length === 0) && (
          <div className="text-center text-muted-foreground py-8">Nenhuma aplicação encontrada.</div>
        )}
      </div>

      {/* Proposal Sidebar (Right) */}
      <div
        className={`fixed top-0 right-0 h-full w-full z-50 transition-all duration-300 ${sidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ background: sidebarOpen ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)" }}
        onClick={closeSidebar}
      >
        <aside
          className={`fixed top-0 right-0 h-full w-full sm:w-[550px] bg-white dark:bg-neutral-900 shadow-2xl z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              {selectedApp?.creator?.avatar ? (
                <img
                  src={selectedApp.creator.avatar}
                  alt={selectedApp.creator.name || "Criador"}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-600 text-white font-bold text-lg border border-gray-200 dark:border-neutral-700">
                  {getInitials(selectedApp?.creator?.name)}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-base">
                  {selectedApp?.creator?.name}
                </div>
                {selectedApp?.creator?.email && (
                  <div className="text-xs text-muted-foreground">{selectedApp.creator.email}</div>
                )}
              </div>
            </div>
            <button onClick={closeSidebar} className="text-gray-500 hover:text-pink-600 transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          {selectedApp && (
            <div className="p-4 space-y-4">
              <div>
                <div className="font-bold mb-1">Proposta</div>
                <div className="text-sm whitespace-pre-line">{selectedApp.proposal}</div>
              </div>
              <div>
                <div className="font-bold mb-1">Links do Portfólio</div>
                <div className="flex flex-col gap-1">
                  {selectedApp.portfolio_links?.length ? selectedApp.portfolio_links.map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> {link}
                    </a>
                  )) : <span className="text-xs text-muted-foreground">Nenhum link informado</span>}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {selectedApp.proposed_budget && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {selectedApp.proposed_budget}</span>
                )}
                {selectedApp.estimated_delivery_days && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedApp.estimated_delivery_days} dias</span>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={closeSidebar}>Fechar</Button>
                {selectedApp.status === 'pending' && (
                  <>
                    <Button className="bg-green-600 text-white" onClick={() => handleApprove(selectedApp.id)}>Aprovar</Button>
                    <Button variant="destructive" onClick={() => handleReject(selectedApp.id)}>Rejeitar</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ViewCreators;
