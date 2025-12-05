import { Clock, DollarSign, File, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import ApplyModal from "./ApplyModal";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { formatDate } from "date-fns";
import { toast } from "../ui/sonner";
import { fetchCreatorApplications } from "../../store/thunks/campaignThunks";
import { fetchApprovedCampaigns, fetchCampaignById } from "../../store/thunks/campaignThunks";
import { getCampaignLogoUrl } from "../../utils/imageUtils";
import {
  Dialog,
  DialogContent,
} from "../ui/dialog";

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

  
  const safeCreatorApplications = Array.isArray(creatorApplications)
    ? creatorApplications
    : [];
  
  
  const safeApprovedCampaigns = Array.isArray(approvedCampaigns) ? approvedCampaigns : [];
  
  
  let campaign = safeApprovedCampaigns.find(
    (c: any) => String(c.id) === String(projectId)
  );
  
  
  if (!campaign && selectedCampaign && String(selectedCampaign.id) === String(projectId)) {
    campaign = selectedCampaign;
  }
  
  const project = campaign;
  
  const [open, setOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  
  useEffect(() => {
    if (user?.role === "creator") {
      const fetchDataSequentially = async () => {
        try {
          
          await dispatch(fetchCreatorApplications()).unwrap();
          
          
          if (!safeApprovedCampaigns.length || !project) {
            await dispatch(fetchApprovedCampaigns()).unwrap();
          }
          
          
          if (safeApprovedCampaigns.length > 0 && !project && projectId) {
            await dispatch(fetchCampaignById(projectId)).unwrap();
          }
        } catch (error) {
          console.error('Error fetching project detail data:', error);
          
          
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

  
  const isCreator = user?.role === "creator";
  const isStudent = user?.role === "student";
  const canApplyToCampaigns = isCreator || isStudent;
  const alreadyApplied = safeCreatorApplications.some(
    (app) => app.campaign_id === project?.id && app.creator_id === user?.id
  );
  const canApply =
    canApplyToCampaigns && project && project.status === "approved" && !alreadyApplied;

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
        {}
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
          {}
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-2">
              <span className="text-xs text-primary bg-primary/10 dark:bg-primary/20 rounded px-3 py-1 font-medium">
                {project.category}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-8">
              {}
              <div className="flex-shrink-0">
                {(() => {
                  const logoPath = project.logo || (project as any).logo_url;
                  const logoUrl = getCampaignLogoUrl(logoPath);
                  if (logoUrl) {
                    return (
                      <img
                        src={logoUrl}
                        alt={`${project.title} logo`}
                        className="w-16 h-16 rounded-xl object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          minWidth: 0,
                          minHeight: 0,
                          objectFit: 'cover',
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                        onClick={() => {
                          setSelectedImageUrl(logoUrl);
                          setImageModalOpen(true);
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                {(!project.logo && !(project as any).logo_url) && (
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

            {}

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

          {}
          <div className="w-full md:w-[340px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-muted dark:bg-[#232326] rounded-xl p-5 flex flex-col gap-4 border border-border">
              <div className="flex items-center gap-3">
                {}
                <span className="text-[#E91E63] text-ellipsis text-2xl">R$</span>
                <div>
                  <div className="text-xs text-muted-foreground">Pagamento</div>
                  <div className="font-bold text-base text-foreground">
                    {project.budget}
                  </div>
                </div>
              </div>
              {}
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
                    {(() => {
                        
                        if (project.deadline && /^\d{4}-\d{2}-\d{2}$/.test(project.deadline)) {
                            const [year, month, day] = project.deadline.split('-').map(Number);
                            return formatDate(new Date(year, month - 1, day), "dd/MM/yyyy");
                        }
                        return formatDate(new Date(project.deadline), "dd/MM/yyyy");
                    })()}
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
              <div className="rounded-xl flex items-center justify-center bg-background overflow-auto min-h-[200px]">
                {(() => {
                  
                  
                  const attachData = project.attach_file || (project as any).attachments;
                  const attachments = attachData ? (Array.isArray(attachData) ? attachData : [attachData]) : [];
                  
                  if (attachments.length === 0) {
                    return (
                      <span className="text-muted-foreground">
                        Nenhum anexo disponível
                      </span>
                    );
                  }
                  
                  
                  if (attachments.length === 1) {
                    const file = attachments[0];
                    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(file);
                    return isImage ? (
                      <img
                        src={`${
                          import.meta.env.VITE_BACKEND_URL ||
                          "http://localhost:8000"
                        }${file}`}
                        alt="Anexo visual"
                        className="rounded-xl w-full h-full object-contain border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        loading="lazy"
                        decoding="async"
                        style={{
                          minWidth: 0,
                          minHeight: 0,
                          objectFit: 'contain',
                          maxWidth: '80%',
                          maxHeight: '80%'
                        }}
                        onClick={() => {
                          const imageUrl = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}${file}`;
                          setSelectedImageUrl(imageUrl);
                          setImageModalOpen(true);
                        }}
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
                  } else {
                    
                    return (
                      <div className="grid grid-cols-2 gap-2 p-4 w-full">
                        {attachments.map((file: string, index: number) => {
                          const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(file);
                          return (
                            <div key={index} className="border rounded-lg p-2">
                              {isImage ? (
                                <img
                                  src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}${file}`}
                                  alt={`Anexo ${index + 1}`}
                                  className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    const imageUrl = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}${file}`;
                                    setSelectedImageUrl(imageUrl);
                                    setImageModalOpen(true);
                                  }}
                                />
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}${file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-sm break-all"
                                >
                                  {file.split("/").pop()}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
            <button
              className="mt-2 bg-[#E91E63] hover:bg-[#E91E63]/80 text-white font-bold rounded-xl py-4 text-base transition w-full disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setOpen(true)}
              disabled={!canApply}
            >
              Aplicar para esta campanha
            </button>
            {!canApplyToCampaigns && (
              <div className="mt-2 text-sm text-muted-foreground text-center">
                Apenas criadores e alunos podem se candidatar a campanhas.
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
      {}
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

      {}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/90 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt="Visualização ampliada"
                className="max-w-full max-h-[95vh] object-contain"
                style={{
                  maxWidth: '100%',
                  maxHeight: '95vh',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            )}
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Fechar"
            >
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;