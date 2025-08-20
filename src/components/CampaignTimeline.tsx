import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Upload, 
  Download, 
  FileText, 
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  MessageSquare,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { useAppSelector } from '../store/hooks';
import { 
  campaignTimelineApi, 
  CampaignMilestone, 
  TimelineStatistics 
} from '../api/campaignTimeline';
import { deliveryMaterialsApi, DeliveryMaterial } from '../api/deliveryMaterials';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface CampaignTimelineProps {
  contractId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignTimeline({ contractId, isOpen, onClose }: CampaignTimelineProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  
  // Debug logging
  console.log('CampaignTimeline component rendered:', { 
    contractId, 
    isOpen, 
    user: user ? { id: user.id, role: user.role } : null
  });
  
  const [milestones, setMilestones] = useState<CampaignMilestone[]>([]);
  const [statistics, setStatistics] = useState<TimelineStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<CampaignMilestone | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [justification, setJustification] = useState('');
  const [extensionDays, setExtensionDays] = useState(1);
  const [extensionReason, setExtensionReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());
  const [showMaterialDetails, setShowMaterialDetails] = useState<number | null>(null);
  const [materialDescription, setMaterialDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle material approval/rejection
  const handleMaterialApproval = async (materialId: number, comment?: string) => {
    try {
      await deliveryMaterialsApi.approveDeliveryMaterial(materialId, { comment });
      toast({
        title: "Sucesso",
        description: "Material aprovado com sucesso!",
      });
      loadTimeline(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error approving material:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aprovar material",
        variant: "destructive",
      });
    }
  };

  const handleMaterialRejection = async (materialId: number, rejectionReason: string, comment?: string) => {
    try {
      await deliveryMaterialsApi.rejectDeliveryMaterial(materialId, { rejection_reason: rejectionReason, comment });
      toast({
        title: "Sucesso",
        description: "Material rejeitado com sucesso!",
      });
      loadTimeline(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error rejecting material:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao rejeitar material",
        variant: "destructive",
      });
    }
  };

  // Helper function to get materials for a specific milestone
  const getMilestoneMaterials = (milestoneId: number) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    return milestone?.deliveryMaterials || [];
  };

  // Handle delivery material upload
  const handleDeliveryMaterialUpload = async () => {
    if (!selectedFile || !selectedMilestone) return;

    try {
      setIsUploading(true);
      await deliveryMaterialsApi.submitDeliveryMaterial({
        contract_id: contractId,
        milestone_id: selectedMilestone.id,
        file: selectedFile,
        title: comment.trim() || undefined,
        description: materialDescription.trim() || undefined,
      });
      
      toast({
        title: "Sucesso",
        description: "Material enviado com sucesso!",
      });
      
      setShowUploadDialog(false);
      setSelectedFile(null);
      setComment('');
      setMaterialDescription('');
      setSelectedMilestone(null);
      loadTimeline(); // Reload to show new material
    } catch (error: any) {
      console.error('Error uploading delivery material:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao enviar material",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Load timeline data
  useEffect(() => {
    console.log('CampaignTimeline useEffect triggered:', { isOpen, contractId, user });
    
    if (isOpen && contractId && user) {
      console.log('Loading timeline for contract:', contractId);
      loadTimeline();
    } else {
      console.log('Not loading timeline:', { isOpen, contractId, hasUser: !!user });
      if (!user) {
        console.warn('User not authenticated, cannot load timeline');
      }
    }
  }, [isOpen, contractId, user]);

  const loadTimeline = async () => {
    try {
      setIsLoading(true);
      console.log('Loading timeline for contract:', contractId);
      console.log('User role:', user?.role);
      
      // Check if user has access to this contract
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      if (user.role !== 'brand' && user.role !== 'creator') {
        throw new Error('Usuário não tem permissão para acessar este contrato');
      }
      
      const [timelineData, statsData] = await Promise.all([
        campaignTimelineApi.getTimeline(contractId),
        campaignTimelineApi.getStatistics(contractId)
      ]);
      
      console.log('Timeline data received:', timelineData);
      console.log('Stats data received:', statsData);
      
      setMilestones(timelineData);
      setStatistics(statsData);
      // Materials are now loaded with the timeline, so we don't need to load them separately
    } catch (error: any) {
      console.error('Error loading timeline:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao carregar timeline",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMilestones = async () => {
    try {
      setIsLoading(true);
      console.log('Creating milestones for contract:', contractId);
      
      const newMilestones = await campaignTimelineApi.createMilestones(contractId);
      setMilestones(newMilestones);
      toast({
        title: "Sucesso",
        description: "Milestones criados com sucesso!",
      });
    } catch (error: any) {
      console.error('Error creating milestones:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Erro ao criar milestones";
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        if (error.response?.data?.error === 'Timeline already exists for this contract') {
          errorMessage = "Timeline já existe para este contrato. Recarregando...";
          // Reload the timeline since it already exists
          loadTimeline();
        } else {
          errorMessage = error.response?.data?.message || errorMessage;
        }
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para criar milestones para este contrato";
      } else if (error.response?.status === 422) {
        errorMessage = "Dados inválidos. Verifique as informações do contrato";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedMilestone) return;

    try {
      setIsUploading(true);
      const response = await campaignTimelineApi.uploadFile(selectedMilestone.id, selectedFile);
      
      // Update the milestone in the list
      setMilestones(prev => prev.map(m => 
        m.id === selectedMilestone.id ? response.data : m
      ));
      
      setShowUploadDialog(false);
      setSelectedFile(null);
      setSelectedMilestone(null);
      
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao enviar arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedMilestone) return;

    try {
      const updatedMilestone = await campaignTimelineApi.approveMilestone(
        selectedMilestone.id, 
        comment
      );
      
      // Update the milestone in the list
      setMilestones(prev => prev.map(m => 
        m.id === selectedMilestone.id ? updatedMilestone : m
      ));
      
      setShowApprovalDialog(false);
      setComment('');
      setSelectedMilestone(null);
      
      toast({
        title: "Sucesso",
        description: "Milestone aprovado com sucesso!",
      });
    } catch (error: any) {
      console.error('Error approving milestone:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao aprovar milestone",
        variant: "destructive",
      });
    }
  };

  const handleJustification = async () => {
    if (!selectedMilestone || !justification.trim()) return;

    try {
      const updatedMilestone = await campaignTimelineApi.justifyDelay(
        selectedMilestone.id, 
        justification
      );
      
      // Update the milestone in the list
      setMilestones(prev => prev.map(m => 
        m.id === selectedMilestone.id ? updatedMilestone : m
      ));
      
      setShowJustificationDialog(false);
      setJustification('');
      setSelectedMilestone(null);
      
      toast({
        title: "Sucesso",
        description: "Justificativa enviada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error justifying delay:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao enviar justificativa",
        variant: "destructive",
      });
    }
  };

  const handleExtension = async () => {
    if (!selectedMilestone || !extensionReason.trim() || extensionDays < 1) return;

    try {
      const updatedMilestone = await campaignTimelineApi.extendTimeline(
        selectedMilestone.id,
        extensionDays,
        extensionReason
      );
      
      // Update the milestone in the list
      setMilestones(prev => prev.map(m => 
        m.id === selectedMilestone.id ? updatedMilestone : m
      ));
      
      setShowExtensionDialog(false);
      setExtensionDays(1);
      setExtensionReason('');
      setSelectedMilestone(null);
      
      toast({
        title: "Sucesso",
        description: "Timeline estendida com sucesso!",
      });
    } catch (error: any) {
      console.error('Error extending timeline:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao estender timeline",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (milestone: CampaignMilestone) => {
    try {
      const response = await campaignTimelineApi.downloadFile(milestone.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao baixar arquivo",
        variant: "destructive",
      });
    }
  };

  const toggleMilestoneExpansion = (milestoneId: number) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (milestone: CampaignMilestone) => {
    if (milestone.is_overdue) return <XCircle className="w-5 h-5 text-red-500" />;
    if (milestone.status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (milestone.status === 'approved') return <CheckCircle className="w-5 h-5 text-blue-500" />;
    if (milestone.status === 'delayed') return <AlertCircle className="w-5 h-5 text-orange-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusBadge = (milestone: CampaignMilestone) => {
    if (milestone.is_overdue) return <Badge variant="destructive">Atrasado</Badge>;
    if (milestone.status === 'completed') return <Badge className="bg-green-500">Concluído</Badge>;
    if (milestone.status === 'approved') return <Badge className="bg-blue-500">Aprovado</Badge>;
    if (milestone.status === 'delayed') return <Badge className="bg-orange-500">Atrasado</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getDeadlineText = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (isPast(deadlineDate)) {
      const daysOverdue = differenceInDays(now, deadlineDate);
      return `${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} atrasado`;
    }
    
    if (isToday(deadlineDate)) return 'Vence hoje';
    if (isTomorrow(deadlineDate)) return 'Vence amanhã';
    
    const daysUntil = differenceInDays(deadlineDate, now);
    return `Vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`;
  };

  const hasOverdueMilestones = milestones.some(m => m.is_overdue);



  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 background-color backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sliding Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full background-color border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 transition-all duration-300 ease-in-out",
        // Responsive width
        "w-full sm:w-96 md:w-[420px] lg:w-[480px]",
        // Animation
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171717]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg">Linha do Tempo da Campanha</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full bg-white dark:bg-[#171717]">
          {/* Warning Banner for Overdue Milestones */}
          {hasOverdueMilestones && (
            <Alert className="mx-4 mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>⚠️ REGRA DE PUNIÇÃO AUTOMÁTICA:</strong> Criadores que ultrapassem prazos sem justificativa receberão advertência automática e podem ser suspensos por 7 dias de novos convites. 
                {user?.role === 'brand' && " Use o botão 'Justificar Atraso' para evitar penalidades injustas."}
                {user?.role === 'creator' && " Entre em contato com a marca para justificar os atrasos."}
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics */}
          {statistics && (
            <Card className="mx-4 mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Progresso Geral</h3>
                  <span className="text-sm text-muted-foreground">
                    {statistics.completed_milestones}/{statistics.total_milestones} concluídos
                  </span>
                </div>
                <Progress value={statistics.progress_percentage} className="mb-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Concluído: {statistics.completed_milestones}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Aprovado: {statistics.approved_milestones}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Pendente: {statistics.pending_milestones}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Atrasado: {statistics.overdue_milestones}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Materials Summary */}
          {user?.role === 'brand' && (() => {
            const allMaterials = milestones.flatMap(m => m.deliveryMaterials || []);
            if (allMaterials.length === 0) return null;
            
            return (
              <Card className="mx-4 mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      📦 Materiais de Entrega
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {allMaterials.length} material{allMaterials.length !== 1 ? 'is' : ''} enviado{allMaterials.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Pendente: {allMaterials.filter(m => m.status === 'pending').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Aprovado: {allMaterials.filter(m => m.status === 'approved').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Rejeitado: {allMaterials.filter(m => m.status === 'rejected').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Create Milestones Button */}
          {milestones.length === 0 && user?.role === 'brand' && !isLoading && (
            <div className="mx-4 mt-4">
              <Button onClick={createMilestones} disabled={isLoading} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Criar Timeline
              </Button>
            </div>
          )}

          {/* Show message if timeline already exists */}
          {milestones.length > 0 && user?.role === 'brand' && (
            <div className="mx-4 mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Timeline já existe para este contrato. Você pode visualizar e gerenciar os milestones abaixo.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Timeline */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum milestone criado ainda.</p>
                  {user?.role === 'brand' && !isLoading && <p className="text-sm">Clique em "Criar Timeline" para começar.</p>}
                  {isLoading && <p className="text-sm">Carregando timeline...</p>}
                </div>
              ) : (
                milestones.map((milestone, index) => (
                  <Card key={milestone.id} className={cn(
                    "transition-all duration-200",
                    milestone.is_overdue && "border-red-200 bg-red-50 dark:bg-red-900/20"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center bg-background">
                              {getStatusIcon(milestone)}
                            </div>
                            {index < milestones.length - 1 && (
                              <div className="w-0.5 h-8 bg-muted mt-2" />
                            )}
                          </div>

                          {/* Milestone content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{milestone.title}</h4>
                                {getStatusBadge(milestone)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMilestoneExpansion(milestone.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedMilestones.has(milestone.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground mb-2">
                              {milestone.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{getDeadlineText(milestone.deadline)}</span>
                              </div>
                              {milestone.file_name && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate">{milestone.file_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Expanded content */}
                            {expandedMilestones.has(milestone.id) && (
                              <div className="mt-4 space-y-3">
                                <Separator />
                                
                                {/* File section */}
                                {milestone.file_path && (
                                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{milestone.file_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {milestone.formatted_file_size}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownload(milestone)}
                                      className="flex-shrink-0"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Baixar
                                    </Button>
                                  </div>
                                )}

                                {/* Comment section */}
                                {milestone.comment && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                      Comentário:
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                      {milestone.comment}
                                    </p>
                                  </div>
                                )}

                                {/* Justification section */}
                                {milestone.justification && (
                                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                                      Justificativa:
                                    </p>
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                      {milestone.justification}
                                    </p>
                                  </div>
                                )}

                                {/* Delivery Materials Section */}
                                <div className="mt-4">
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    📦 Materiais de Entrega
                                  </h5>
                                  
                                  {/* Creator Submission Section */}
                                  {user?.role === 'creator' && milestone.can_upload_file && (
                                    <div className="mb-4 p-3 border-2 border-dashed border-muted rounded-lg">
                                      <div className="text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm font-medium mb-2">Enviar Material para Aprovação</p>
                                        <p className="text-xs text-muted-foreground mb-3">
                                          Envie fotos, vídeos ou documentos para este milestone
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedMilestone(milestone);
                                            setShowUploadDialog(true);
                                          }}
                                        >
                                          <Upload className="w-4 h-4 mr-1" />
                                          Enviar Material
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Display Submitted Materials */}
                                  {(() => {
                                    const milestoneMaterials = getMilestoneMaterials(milestone.id);
                                    
                                    if (milestoneMaterials.length === 0) {
                                      return (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                          <p>Nenhum material enviado para este milestone.</p>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <div className="space-y-2">
                                        {milestoneMaterials.map((material) => (
                                          <div
                                            key={material.id}
                                            className="p-3 border rounded-lg bg-background"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                  {material.media_type === 'image' ? '🖼️' : 
                                                   material.media_type === 'video' ? '🎥' : 
                                                   material.media_type === 'document' ? '📄' : '📎'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="font-medium text-sm truncate">
                                                    {material.title || material.file_name}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Enviado por {material.creator?.name || 'Criador'}
                                                  </p>
                                                </div>
                                              </div>
                                              <Badge
                                                variant={
                                                  material.status === 'approved' ? 'default' : 
                                                  material.status === 'rejected' ? 'destructive' : 'secondary'
                                                }
                                              >
                                                {material.status === 'approved' ? 'Aprovado' :
                                                 material.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                              </Badge>
                                            </div>
                                            
                                            {material.description && (
                                              <p className="text-sm text-muted-foreground mb-2">
                                                {material.description}
                                              </p>
                                            )}
                                            
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                              <span>{material.formatted_file_size}</span>
                                              <span>•</span>
                                              <span>{format(new Date(material.submitted_at), 'dd/MM/yyyy HH:mm')}</span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  // Download functionality
                                                  const link = document.createElement('a');
                                                  link.href = material.file_url || '';
                                                  link.download = material.file_name;
                                                  link.click();
                                                }}
                                              >
                                                <Download className="w-4 h-4 mr-1" />
                                                Baixar
                                              </Button>
                                              
                                              {material.status === 'pending' && (
                                                <>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                    onClick={() => handleMaterialApproval(material.id)}
                                                  >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Aprovar
                                                  </Button>
                                                  
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                      setShowMaterialDetails(material.id);
                                                    }}
                                                  >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Rejeitar
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2">
                                  {/* Upload File Button */}
                                  {milestone.can_upload_file && user?.role === 'creator' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setShowUploadDialog(true);
                                      }}
                                    >
                                      <Upload className="w-4 h-4 mr-1" />
                                      Enviar Arquivo
                                    </Button>
                                  )}

                                  {/* Request Approval Button */}
                                  {milestone.can_request_approval && user?.role === 'creator' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setShowApprovalDialog(true);
                                      }}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1" />
                                      Solicitar Aprovação
                                    </Button>
                                  )}

                                  {/* Approve Button */}
                                  {milestone.can_be_approved && user?.role === 'brand' && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setShowApprovalDialog(true);
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Aprovar
                                    </Button>
                                  )}

                                  {/* Justify Delay Button */}
                                  {milestone.can_justify_delay && user?.role === 'brand' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setShowJustificationDialog(true);
                                      }}
                                    >
                                      <AlertCircle className="w-4 h-4 mr-1" />
                                      Justificar Atraso
                                    </Button>
                                  )}

                                  {/* Extend Timeline Button */}
                                  {milestone.can_be_extended && user?.role === 'brand' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setShowExtensionDialog(true);
                                      }}
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      Estender Timeline
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Upload File Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedMilestone?.can_upload_file ? 'Enviar Material de Entrega' : 'Enviar Arquivo'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Arquivo</label>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.avi,.jpg,.jpeg,.png"
                />
              </div>
              
              {/* Additional fields for delivery materials */}
              {selectedMilestone?.can_upload_file && (
                <>
                  <div>
                    <label className="text-sm font-medium">Título (opcional)</label>
                    <Input
                      placeholder="Ex: Vídeo final da campanha"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição (opcional)</label>
                    <Textarea
                      placeholder="Descreva o material enviado..."
                      rows={2}
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={selectedMilestone?.can_upload_file ? handleDeliveryMaterialUpload : handleFileUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedMilestone?.can_be_approved ? 'Aprovar Milestone' : 'Solicitar Aprovação'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comentário (opcional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleApproval}>
                  {selectedMilestone?.can_be_approved ? 'Aprovar' : 'Solicitar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Justification Dialog */}
      {showJustificationDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Justificar Atraso</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Justificativa</label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explique o motivo do atraso..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowJustificationDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleJustification}
                  disabled={!justification.trim()}
                >
                  Enviar Justificativa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extension Dialog */}
      {showExtensionDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Estender Timeline</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dias para estender</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(parseInt(e.target.value) || 1)}
                  placeholder="Ex: 3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Motivo da extensão</label>
                <Textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explique o motivo da extensão..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExtensionDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExtension}
                  disabled={!extensionReason.trim() || extensionDays < 1}
                >
                  Estender Timeline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Rejection Dialog */}
      {showMaterialDetails !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Rejeitar Material</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Motivo da Rejeição *</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explique o motivo da rejeição..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMaterialDetails(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (comment.trim()) {
                      const material = milestones
                        .flatMap(m => m.deliveryMaterials || [])
                        .find(m => m.id === showMaterialDetails);
                      if (material) {
                        handleMaterialRejection(material.id, comment.trim());
                        setShowMaterialDetails(null);
                        setComment('');
                      }
                    }
                  }}
                  disabled={!comment.trim()}
                >
                  Rejeitar Material
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 