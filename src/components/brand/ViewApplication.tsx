import React from "react";

const labelClass =
  "text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1";
const valueClass = "text-base font-semibold text-gray-800 dark:text-gray-100";

interface ViewApplicationProps {
  setComponent?: (component: string) => void;
  campaign?: {
    id?: number;
    title?: string;
    description?: string;
    briefing?: string;
    budget?: number;
    remunerationType?: 'paga' | 'permuta';
    deadline?: string;
    created_at?: string;
    target_states?: string[];
    category?: string;
    logo?: string;
  };
}

const ViewApplication: React.FC<ViewApplicationProps> = ({ setComponent, campaign: propCampaign }) => {
  const campaign = propCampaign;

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
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-3xl font-bold text-gray-400">
              {campaign.logo ? (
                <img src={`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}${campaign.logo}`} alt="Brand" className="w-16 h-16 rounded-full" />
              ) : (
                <span className="text-gray-400">📷</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title || 'Título não disponível'}</h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold">{campaign.category || 'Categoria não especificada'}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 border-b border-gray-200 dark:border-neutral-700 pb-4">
          <div>
            <div className={labelClass}>Valor</div>
            <div className={valueClass}>{campaign.budget ? `R$ ${campaign.budget.toLocaleString('pt-BR')}` : 'Não especificado'}</div>
          </div>
          <div>
            <div className={labelClass}>Tipo de Remuneração</div>
            <div className={valueClass}>
              {campaign.remunerationType === 'paga' ? '💰 Paga' : campaign.remunerationType === 'permuta' ? '🔄 Permuta' : 'Não especificado'}
            </div>
          </div>
          <div>
            <div className={labelClass}>Data de criação</div>
            <div className={valueClass}>{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('pt-BR') : 'Não especificada'}</div>
          </div>
          <div>
            <div className={labelClass}>Data de Submissão</div>
            <div className={valueClass}>{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : 'Não especificada'}</div>
          </div>
        </div>

        {/* Briefing */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Briefing</h3>
          <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{campaign.description || 'Descrição não disponível'}</p>
        </section>

        {/* States */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Estados</h3>
          <div className="flex flex-wrap gap-2">
            {campaign.target_states && Array.isArray(campaign.target_states) && campaign.target_states.length > 0 ? (
              campaign.target_states.map((uf: string, i: number) => (
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
      </div>
    </div>
  );
};

export default ViewApplication;
