import { Clock, DollarSign, File } from "lucide-react";
import React, { useState, useEffect } from "react";
import ApplyModal from "./ApplyModal";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { formatDate } from "date-fns";
import { toast } from "../ui/sonner";
import { fetchCreatorApplications } from "../../store/thunks/campaignThunks";

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

const ProjectDetail: React.FC<ProjectDetailProps> = ({ setComponent, projectId  }) => {
    const { approvedCampaigns, creatorApplications } = useAppSelector((state) => state.campaign);
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    // Find the campaign by projectId
    const campaign = Array.isArray(approvedCampaigns.data)
        ? approvedCampaigns.data.find((c: any) => String(c.id) === String(projectId))
        : null;
    const project = campaign;
    const [open, setOpen] = useState(false);
    
    useEffect(() => {
        if (user?.role === 'creator') {
            dispatch(fetchCreatorApplications());
        }
    }, [dispatch, user?.id, user?.role]);

    // Check if user is eligible to apply
    const isCreator = user?.role === 'creator';
    const alreadyApplied = creatorApplications.some(app => app.campaign_id === project?.id && app.creator_id === user?.id);
    const canApply = isCreator && project && project.status === 'approved' && !alreadyApplied;

    if (!project) {
        return <div className="p-8 text-center text-muted-foreground">Campanha não encontrada.</div>;
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
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        Voltar para campanhas
                    </button>
                </div>
                <div className="w-full mx-auto bg-background dark:bg-background rounded-2xl border border-border shadow-sm p-6 md:p-10 flex flex-col md:flex-row gap-10">
                    {/* Left: Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-end mb-2">
                            <span className="text-xs text-primary bg-primary/10 dark:bg-primary/20 rounded px-3 py-1 font-medium">{project.category}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                            {/* Campaign Logo */}
                            <div className="flex-shrink-0">
                                {project.logo ? (
                                    <img
                                        src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${project.logo}`}
                                        alt={`${project.title} logo`}
                                        className="w-16 h-16 rounded-xl object-cover border border-border"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                {(!project.logo || project.logo === '') && (
                                    <div className="w-16 h-16 rounded-xl border border-border flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-primary to-primary/80">
                                        {project.title.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.title}</h1>
                        </div>

                        <div className="mb-7">
                            <h2 className="font-bold text-[17px] mb-1 text-foreground">Descrição</h2>
                            <p className="text-muted-foreground text-[15px]">{project.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {campaign.location && campaign.location.split(',').map((uf: string, i: number) => (
                                <span
                                key={uf.trim()}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${statesColors[i % statesColors.length]}`}
                                >
                                {uf.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info card, image, button */}
                    <div className="w-full md:w-[340px] flex flex-col gap-6 flex-shrink-0">
                        <div className="bg-muted dark:bg-[#232326] rounded-xl p-5 flex flex-col gap-4 border border-border">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-[#E91E63]" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Pagamento</div>
                                    <div className="font-bold text-base text-foreground">{project.budget}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="text-[#E91E63]" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Prazo final</div>
                                    <div className="font-bold text-base text-foreground">{formatDate(new Date(project.deadline), 'dd/MM/yyyy')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <File className="text-[#E91E63]" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Tipo de conteúdo</div>
                                    <div className="font-bold text-base text-foreground">{project.category}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[15px] font-bold text-foreground">Exemplo visual</div>
                                {alreadyApplied && (
                                    <span className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Aplicado</span>
                                )}
                            </div>
                            <div className="rounded-xl w-full h-52 border border-border flex items-center justify-center bg-background overflow-auto">
                                {project.attach_file ? (
                                    (() => {
                                        const file = project.attach_file;
                                        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(file);
                                        return isImage ? (
                                            <img
                                                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${file}`}
                                                alt="Anexo visual"
                                                className="rounded-xl w-full h-full border border-border"
                                            />
                                        ) : (
                                            <a
                                                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${file}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline break-all"
                                            >
                                                {file.split('/').pop()}
                                            </a>
                                        );
                                    })()
                                ) : (
                                    <span className="text-muted-foreground">Nenhum anexo disponível</span>
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
                            <div className="mt-2 text-sm text-muted-foreground text-center">Apenas criadores podem se candidatar a campanhas.</div>
                        )}
                        {alreadyApplied && (
                            <div className="mt-2 text-sm text-green-700 text-center">Você já se candidatou a esta campanha.</div>
                        )}
                        {project.status !== 'approved' && (
                            <div className="mt-2 text-sm text-muted-foreground text-center">Campanha não está ativa para aplicações.</div>
                        )}
                    </div>
                </div>
            </div>
            {/* Only the new ApplyModal with the proposal form */}
            <ApplyModal
                open={open}
                onOpenChange={setOpen}
                campaignName={project.title}
                brandName={typeof project.brand === 'object' && project.brand !== null ? project.brand.name : (project.brand || '')}
                campaignId={project.id}
            />
        </div>
    );
};

export default ProjectDetail;
