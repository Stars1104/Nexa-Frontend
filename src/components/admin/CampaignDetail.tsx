import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { File, FileText, Image, Download, ExternalLink } from "lucide-react";

const statesColors = [
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
];

interface CampaignDetailProps {
  campaign: any;
  open: boolean;
  path?: string;
  onOpenChange: (open: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const CampaignDetail = ({ 
  campaign, 
  open, 
  path,
  onOpenChange, 
  onApprove, 
  onReject,
}: CampaignDetailProps) => {
  // Helper function to get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="w-5 h-5" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  // Helper function to get file type name
  const getFileTypeName = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'Imagem';
    } else if (['pdf'].includes(extension || '')) {
      return 'PDF';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'Documento';
    } else {
      return 'Arquivo';
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Use real campaign data with fallbacks only when needed
  const displayData = {
    ...campaign,
    // Only provide fallbacks if the real data is missing
    submissionDate: campaign.submissionDate || new Date().toLocaleDateString("pt-BR"),
    briefing: campaign.description || "Briefing não disponível",
    requirements: campaign.creatorRequirements || ["Requisitos não especificados"],
    audience: "Público-alvo não especificado", // This might not be in the campaign data
    deliverables: "Entregáveis não especificados", // This might not be in the campaign data
    states: Array.isArray(campaign.states) ? campaign.states : ["Estados não especificados"],
  };

  // Get attachments from campaign data
  const attachments = campaign.attachments || campaign.attach_file || [];
  const hasAttachments = Array.isArray(attachments) ? attachments.length > 0 : !!attachments;

  const handleApprove = () => {
    onApprove?.();
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-gray-200 dark:border-neutral-700 pb-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden border">
              {displayData.logo ? (
                <img 
                  src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${displayData.logo}`} 
                  alt={`${displayData.brand?.name || 'Campaign'} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayData.brand?.name?.charAt(0)?.toUpperCase() || 'N'
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {displayData.title}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {typeof displayData.brand === 'string' ? displayData.brand : displayData.brand?.name || 'Marca não especificada'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold mt-4">
              {displayData.category}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200 dark:border-neutral-700 pb-4">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">Valor</div>
              <div className="text-base font-semibold text-gray-800 dark:text-gray-100">
                R$ {(displayData.budget || displayData.value)?.toLocaleString("pt-BR") || 'Não especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">Prazo Final</div>
              <div className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {displayData.deadline ? new Date(displayData.deadline).toLocaleDateString("pt-BR") : 'Não especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">Data de Submissão</div>
              <div className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {displayData.submissionDate ? new Date(displayData.submissionDate).toLocaleDateString("pt-BR") : 'Não especificado'}
              </div>
            </div>
          </div>

          {/* Briefing */}
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Briefing</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{displayData.briefing}</p>
          </section>

          {/* States */}
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Estados</h3>
            <div className="flex flex-wrap gap-2">
              {displayData.location && displayData.location.split(',').map((uf: string, i: number) => (
                <span
                  key={uf.trim()}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statesColors[i % statesColors.length]}`}
                >
                  {uf.trim()}
                </span>
              ))}
            </div>
          </section>

          {/* Attachments */}
          {hasAttachments && (
            <section>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Anexos</h3>
              
              {Array.isArray(attachments) && attachments.length > 3 ? (
                // Carousel for multiple files (more than 3)
                <div className="relative overflow-x-hidden">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {attachments.map((attachment: any, index: number) => (
                        <CarouselItem key={index} className="pl-1">
                          <div className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-neutral-600">
                                {getFileIcon(attachment.name || attachment)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {attachment.name || attachment}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getFileTypeName(attachment.name || attachment)}
                                  {attachment.size && ` • ${formatFileSize(attachment.size)}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const url = attachment.url || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachment}`;
                                    window.open(url, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const url = attachment.url || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachment}`;
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = attachment.name || attachment;
                                    link.click();
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {attachments.length} anexo{attachments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                // Simple list for 3 or fewer files
                <div className="space-y-2">
                  {Array.isArray(attachments) ? (
                    attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-neutral-600">
                            {getFileIcon(attachment.name || attachment)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.name || attachment}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getFileTypeName(attachment.name || attachment)}
                              {attachment.size && ` • ${formatFileSize(attachment.size)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const url = attachment.url || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachment}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const url = attachment.url || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachment}`;
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = attachment.name || attachment;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Single attachment (string)
                    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-neutral-600">
                          {getFileIcon(attachments)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            Attach File
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getFileTypeName(attachments)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachments}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${attachments}`;
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = attachments;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className={`flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-neutral-700 ${path === "pending" ? "flex" : "hidden"}`}>
          <Button
            variant="outline"
            className="w-full sm:w-auto border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
            onClick={handleReject}
          >
            Rejeitar
          </Button>
          <Button
            className="w-full sm:w-auto bg-[#E91E63] hover:bg-[#E91E63]/90 text-white"
            onClick={handleApprove}
          >
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetail; 