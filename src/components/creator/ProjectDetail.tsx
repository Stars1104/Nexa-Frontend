import { Clock, DollarSign, File } from "lucide-react";
import React, { useState, useEffect } from "react";
import ApplyModal from "./ApplyModal";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { formatDate } from "date-fns";
import { toast } from "../ui/sonner";
import { fetchCreatorApplications } from "../../store/thunks/campaignThunks";
import { fetchApprovedCampaigns, fetchCampaignById } from "../../store/thunks/campaignThunks";

interface ProjectDetailProps {
  setComponent?: (component: string) => void;
  projectId?: number;
}

const statesColors = [
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
];

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  setComponent,
  projectId,
}) => {
  const { approvedCampaigns, creatorApplications, isLoading, selectedCampaign } = useAppSelector(
    (state) => state.campaign
  );
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Ensure creatorApplications is always an array
  const safeCreatorApplications = Array.isArray(creatorApplications)
    ? creatorApplications
    : [];
  
  // Ensure approvedCampaigns is always an array
  const safeApprovedCampaigns = Array.isArray(approvedCampaigns) ? approvedCampaigns : [];
  
  // Find the campaign by projectId
  let campaign = safeApprovedCampaigns.find(
    (c: any) => String(c.id) === String(projectId)
  );
  
  // Fallback to selectedCampaign if not found in approved campaigns
  if (!campaign && selectedCampaign && String(selectedCampaign.id) === String(projectId)) {
    campaign = selectedCampaign;
  }
  
  const project = campaign;
  
  const [open, setOpen] = useState(false);

  // Fetch data sequentially to prevent rate limiting
  useEffect(() => {
    if (user?.role === "creator") {
      const fetchDataSequentially = async () => {
        try {
          // First, fetch creator applications
          await dispatch(fetchCreatorApplications()).unwrap();
          
          // Then, fetch approved campaigns if needed
          if (!safeApprovedCampaigns.length || !project) {
            await dispatch(fetchApprovedCampaigns()).unwrap();
          }
          
          // If we have approved campaigns but the specific project is not found, try to fetch it by ID
          if (safeApprovedCampaigns.length > 0 && !project && projectId) {
            await dispatch(fetchCampaignById(projectId)).unwrap();
          }
        } catch (error) {
          console.error('Error fetching project detail data:', error);
          
          // Fallback: try to fetch the specific campaign by ID if other calls failed
          if (projectId) {
            try {
              await dispatch(fetchCampaignById(projectId)).unwrap();
            } catch (fallbackError) {
              console.error('Error fetching campaign by ID:', fallbackError);
            }
          }
        }
      };
      
      fetchDataSequentially();
    }
  }, [dispatch, user?.id, user?.role, safeApprovedCampaigns.length, project, projectId]);

  // Check if user is eligible to apply
  const isCreator = user?.role === "creator";
  const alreadyApplied = safeCreatorApplications.some(
    (app) => app.campaign_id === project?.id && app.creator_id === user?.id
  );
  const canApply =
    isCreator && project && project.status === "approved" && !alreadyApplied;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Carregando detalhes da campanha...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="mb-4">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Campanha não encontrada</h3>
        <p className="text-sm mb-4">A campanha que você está procurando não foi encontrada ou pode ter sido removida.</p>
        <button
          className="text-primary hover:underline"
          onClick={() => setComponent("Painel")}
        >
          Voltar para campanhas
        </button>
      </div>
    );
  }

  return (
    <div className="dark:bg-[#171717] min-h-full">
      <div className="w-full mx-auto py-8 px-2 md:px-8">
        {/* Back button */}
        <div className="mb-4">
          <button
            className="flex items-center text-muted-foreground text-sm font-normal hover:underline mb-2"
            onClick={() => setComponent("Painel")}
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar para campanhas
          </button>
        </div>
        <div className="w-full mx-auto bg-background dark:bg-background rounded-2xl border border-border shadow-sm p-6 md:p-10 flex flex-col md:flex-row gap-10">
          {/* Left: Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-2">
              <span className="text-xs text-primary bg-primary/10 dark:bg-primary/20 rounded px-3 py-1 font-medium">
                {project.category}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-8">
              {/* Campaign Logo */}
              <div className="flex-shrink-0">
                {project.logo ? (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL ||
                      "https://nexacreators.com.br"
                      }${project.logo}`}
                    alt={`${project.title} logo`}
                    className="w-16 h-16 rounded-xl object-cover border border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                {(!project.logo || project.logo === "") && (
                  <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-primary to-primary/80">
                    {project.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {project.title}
              </h1>
            </div>

            <div className="mb-7">
              <h2 className="font-bold text-[17px] mb-1 text-foreground">
                Descrição
              </h2>
              <p className="text-muted-foreground text-[15px]">
                {project.description}
              </p>
            </div>

            {/* Google Drive Link */}

            <div className="flex flex-wrap gap-2 mb-2">
              {Array.isArray(project.target_states) && project.target_states.length > 0 &&
                project.target_states.map((uf: string, i: number) => (
                  <span
                    key={uf}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statesColors[i % statesColors.length]
                      }`}
                  >
                    {uf}
                  </span>
                ))}
            </div>
          </div>

          {/* Right: Info card, image, button */}
          <div className="w-full md:w-[340px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-muted dark:bg-[#232326] rounded-xl p-5 flex flex-col gap-4 border border-border">
              <div className="flex items-center gap-3">
                {/* <DollarSign className="text-[#E91E63]" /> */}
                <span className="text-[#E91E63] text-ellipsis text-2xl">R$</span>
                <div>
                  <div className="text-xs text-muted-foreground">Pagamento</div>
                  <div className="font-bold text-base text-foreground">
                    {project.budget}
                  </div>
                </div>
              </div>
              {/* Remuneration Type */}
              {project.remunerationType && (
                <div className="flex items-center gap-3">
                  <span className="text-[#E91E63] text-ellipsis text-2xl">
                    {project.remunerationType === 'paga' ? '💰' : '🔄'}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">Tipo de Remuneração</div>
                    <div className="font-bold text-base text-foreground">
                      {project.remunerationType === 'paga' ? 'Paga' : 'Permuta'}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="text-[#E91E63]" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Prazo final
                  </div>
                  <div className="font-bold text-base text-foreground">
                    {formatDate(new Date(project.deadline), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <File className="text-[#E91E63]" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Tipo de conteúdo
                  </div>
                  <div className="font-bold text-base text-foreground">
                    {project.category}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[15px] font-bold text-foreground">
                  Exemplo visual
                </div>
                {alreadyApplied && (
                  <span className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    Aplicado
                  </span>
                )}
              </div>
              <div className="rounded-xl w-full h-52 border border-border flex items-center justify-center bg-background overflow-auto">
                {project.attach_file ? (
                  (() => {
                    const file = project.attach_file;
                    const isImage =
                      /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(
                        file
                      );
                    return isImage ? (
                      <img
                        src={`${
                          import.meta.env.VITE_BACKEND_URL ||
                          "http://localhost:8000"
                        }${file}`}
                        alt="Anexo visual"
                        className="rounded-xl w-full h-full border border-border"
                      />
                    ) : (
                      <a
                        href={`${
                          import.meta.env.VITE_BACKEND_URL ||
                          "http://localhost:8000"
                        }${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {file.split("/").pop()}
                      </a>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">
                    Nenhum anexo disponível
                  </span>
                )}
              </div>
            </div>
            <button
              className="mt-2 bg-[#E91E63] hover:bg-[#E91E63]/80 text-white font-bold rounded-xl py-4 text-base transition w-full disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setOpen(true)}
              disabled={!canApply}
            >
              Aplicar para esta campanha
            </button>
            {!isCreator && (
              <div className="mt-2 text-sm text-muted-foreground text-center">
                Apenas criadores podem se candidatar a campanhas.
              </div>
            )}
            {alreadyApplied && (
              <div className="mt-2 text-sm text-green-700 text-center">
                Você já se candidatou a esta campanha.
              </div>
            )}
            {project.status !== "approved" && (
              <div className="mt-2 text-sm text-muted-foreground text-center">
                Campanha não está ativa para aplicações.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Only the new ApplyModal with the proposal form */}
      <ApplyModal
        open={open}
        onOpenChange={setOpen}
        campaignName={project.title}
        brandName={
          typeof project.brand === "object" && project.brand !== null
            ? project.brand.name
            : project.brand || ""
        }
        campaignId={project.id}
      />
    </div>
  );
};

export default ProjectDetail;