import React from "react";

const campaign = {
  title: "Campanha de Verão 2023",
  brand: "Marca Solar",
  type: "Vídeo",
  value: "R$ 2.500",
  deadline: "15/12/2023",
  submissionDate: "20/11/2023",
  briefing:
    "Criar conteúdo mostrando produtos de verão em uso na praia. A campanha visa destacar a linha de proteção solar da marca, enfatizando a importância da proteção contra os raios UV. Buscamos criadores que frequentam praias e piscinas e possam demonstrar o uso adequado dos produtos em situações reais.",
  requirements: [
    "Criador deve mostrar o produto sendo aplicado",
    "Mencionar os benefícios de proteção solar",
    "Incluir a hashtag #VerãoProtegido",
    "Vídeo deve ter entre 30 e 60 segundos",
  ],
  audience: "Pessoas de 18 a 35 anos que frequentam praias e piscinas",
  deliverables: "1 vídeo para Instagram/TikTok",
  states: ["SP", "RJ", "BA", "CE", "SC"],
};

const labelClass =
  "text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1";
const valueClass = "text-base font-semibold text-gray-800 dark:text-gray-100";

interface ViewApplicationProps {
  setComponent?: (component: string) => void;
  campaign?: any;
}

const ViewApplication: React.FC<ViewApplicationProps> = ({ setComponent, campaign: propCampaign }) => {
  const campaign = propCampaign;

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
            <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${campaign.logo}`} alt="Brand" className="w-16 h-16 rounded-full" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title}</h2>
          </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold">{campaign.category}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 border-b border-gray-200 dark:border-neutral-700 pb-4">
          <div>
            <div className={labelClass}>Valor</div>
            <div className={valueClass}>{campaign.budget}</div>
          </div>
          <div>
            <div className={labelClass}>Data de criação</div>
            <div className={valueClass}>{campaign.deadline ? new Date(campaign.created_at).toLocaleDateString('pt-BR') : ''}</div>
          </div>
          <div>
            <div className={labelClass}>Data de Submissão</div>
            <div className={valueClass}>{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : ''}</div>
          </div>
        </div>

        {/* Briefing */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Briefing</h3>
          <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{campaign.description}</p>
        </section>

        {/* States */}
        <section className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Estados</h3>
          <div className="flex flex-wrap gap-2">
            {(campaign.states ?? []).map((uf) => (
              <span
                key={uf}
                className="px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 text-xs font-medium"
              >
                {uf}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewApplication;
