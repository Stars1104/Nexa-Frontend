import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchCampaignById } from "../../store/thunks/campaignThunks";
import { Campaign } from "../../store/slices/campaignSlice";

const labelClass =
  "text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1";
const valueClass = "text-base font-semibold text-gray-800 dark:text-gray-100";

interface ViewApplicationProps {
  setComponent?: (component: string) => void;
  campaign?: Campaign | {
    id: number;
    title?: string;
    description?: string;
    requirements?: string[] | string;
    briefing?: string;
    budget?: number | string;
    remuneration_type?: 'paga' | 'permuta';
    remunerationType?: 'paga' | 'permuta';
    deadline?: string;
    created_at?: string;
    target_states?: string[] | string;
    category?: string;
    logo?: string;
    brand?: {
      name?: string;
    };
    [key: string]: any;
  };
}

const ViewApplication: React.FC<ViewApplicationProps> = ({ setComponent, campaign: propCampaign }) => {
  // Extract campaign data from prop if it's wrapped in a response object
  const extractCampaignData = (campaignObj: any) => {
    if (campaignObj && typeof campaignObj === 'object') {
      // Check if the campaign data is wrapped in a 'data' property (API response structure)
      if (campaignObj.data && typeof campaignObj.data === 'object') {
        return campaignObj.data;
      }
      // Check if it's a direct campaign object
      if (campaignObj.id && (campaignObj.title || campaignObj.description || campaignObj.budget)) {
        return campaignObj;
      }
    }
    return campaignObj;
  };

  const dispatch = useDispatch<AppDispatch>();
  const [campaign, setCampaign] = useState(extractCampaignData(propCampaign));
  const [isLoading, setIsLoading] = useState(false);

  // Check if we need to fetch campaign data (only ID available)
  const needsFetching = campaign && campaign.id && !campaign.title;

  // Fetch campaign data if only ID is available
  useEffect(() => {
    if (needsFetching && campaign.id) {
      setIsLoading(true);
      dispatch(fetchCampaignById(campaign.id))
        .unwrap()
        .then((fetchedCampaign) => {
          // Handle API response structure - campaign data might be wrapped in a 'data' property
          const campaignData = (fetchedCampaign as any).data || fetchedCampaign;
          // Update the campaign state with fetched data
          setCampaign(campaignData);
        })
        .catch((error) => {
          console.error('Error fetching campaign:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [needsFetching, campaign?.id, dispatch]);

  // Update local state when prop changes
  useEffect(() => {
    const extractedData = extractCampaignData(propCampaign);
    setCampaign(extractedData);
  }, [propCampaign]);

  // Check if campaign exists
  if (!campaign) {
    return (
      <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Erro ao carregar campanha</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Não foi possível carregar os dados da campanha.</p>
          <button
            onClick={() => setComponent?.('Minhas campanhas')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar para campanhas
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if fetching campaign data
  if (isLoading) {
    return (
      <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Carregando campanha...</h1>
          <p className="text-gray-600 dark:text-gray-400">Buscando dados da campanha.</p>
        </div>
      </div>
    );
  }

  // Check if we have enough campaign data to display
  const hasEnoughData = campaign.title || campaign.description || campaign.budget;
  if (!hasEnoughData && needsFetching) {
    return (
      <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Dados insuficientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">A campanha não possui dados suficientes para exibição.</p>
          <button
            onClick={() => setComponent?.('Minhas campanhas')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar para campanhas
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get the best available description
  const getDescription = () => {
    // Handle requirements as array, join with commas if multiple
    const requirements = Array.isArray(campaign.requirements) 
      ? campaign.requirements.join(', ') 
      : campaign.requirements;
    const desc = requirements || campaign.briefing || campaign.description;
    return desc || 'Descrição não disponível';
  };

  // Helper function to get remuneration type
  const getRemunerationType = () => {
    const type = campaign.remunerationType || (campaign as any).remuneration_type;
    if (type === 'paga') return '💰 Paga';
    if (type === 'permuta') return '🔄 Permuta';
    return 'Não especificado';
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não especificada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Helper function to format budget - handle both string and number types
  const formatBudget = (budget?: number | string) => {
    if (!budget) return 'Não especificado';
    
    // Convert string to number if needed
    let numericBudget: number;
    if (typeof budget === 'string') {
      numericBudget = parseFloat(budget);
      if (isNaN(numericBudget)) return 'Não especificado';
    } else {
      numericBudget = budget;
    }
    
    if (numericBudget <= 0) return 'Não especificado';
    return `R$ ${numericBudget.toLocaleString('pt-BR')}`;
  };



  // Helper function to get target states - handle both string and array types
  const getTargetStates = () => {
    if (!campaign.target_states) return [];
    
    if (Array.isArray(campaign.target_states)) {
      return campaign.target_states;
    }
    
    // Handle case where target_states is a JSON string
    if (typeof campaign.target_states === 'string') {
      try {
        const parsed = JSON.parse(campaign.target_states);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    return [];
  };

  return (
    <div className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center py-4 px-2 sm:px-10">
      {/* Top Bar */}
      <div className="w-full flex items-center gap-2 mb-6">
        <button
          onClick={() => setComponent?.('Minhas campanhas')}
          className="p-2 rounded-full dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-neutral-700 transition"
          aria-label="Voltar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 text-gray-500 dark:text-gray-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes da Campanha</h1>
      </div>
      {/* Main Card */}
      <div className="w-full bg-background rounded-xl shadow-md p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between sm:items-start gap-4 border-b border-gray-200 dark:border-neutral-700 pb-4 mb-4">
          <div className="flex justify-center items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
              {campaign.logo ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}${campaign.logo}`}
                  alt="Campaign Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-gray-400 ${campaign.logo ? 'hidden' : ''}`}>
                {campaign.title ? campaign.title.charAt(0).toUpperCase() : '📷'}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title || 'Título não disponível'}</h2>
              {campaign.brand?.name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {campaign.brand.name}
                </p>
              )}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold">
            {campaign.category || 'Categoria não especificada'}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 border-b border-gray-200 dark:border-neutral-700 pb-4">
          <div>
            <div className={labelClass}>Valor</div>
                            <div className={valueClass}>{formatBudget(campaign.budget)}</div>
          </div>
          <div>
            <div className={labelClass}>Tipo de Remuneração</div>
            <div className={valueClass}>{getRemunerationType()}</div>
          </div>
          <div>
            <div className={labelClass}>Data de criação</div>
            <div className={valueClass}>{formatDate(campaign.created_at)}</div>
          </div>
          <div>
            <div className={labelClass}>Data de Submissão</div>
            <div className={valueClass}>{formatDate(campaign.deadline)}</div>
          </div>
        </div>

        {/* Briefing */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Briefing</h3>
          <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{getDescription()}</p>
        </section>

        {/* States */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Estados</h3>
          <div className="flex flex-wrap gap-2">
            {getTargetStates().length > 0 ? (
              getTargetStates().map((uf: string, i: number) => (
                <span
                  key={uf}
                  className="px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 text-xs font-medium"
                >
                  {uf}
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Estados não especificados</span>
            )}
          </div>
        </section>

        {/* Attachments */}
        {campaign.attachments && campaign.attachments.length > 0 && (
          <section className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Arquivos Anexados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campaign.attachments.map((attachment, index) => {
                const fileName = attachment.split('/').pop() || `Arquivo ${index + 1}`;
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                
                // Determine file type icon and styling
                const getFileIcon = () => {
                  if (['pdf'].includes(fileExtension || '')) {
                    return (
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  } else if (['doc', 'docx'].includes(fileExtension || '')) {
                    return (
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                    return (
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(fileExtension || '')) {
                    return (
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    );
                  } else {
                    return (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  }
                };

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {getFileIcon()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {fileExtension || 'Arquivo'}
                      </p>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}${attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Baixar arquivo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ViewApplication;

