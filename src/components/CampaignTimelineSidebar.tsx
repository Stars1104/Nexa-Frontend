import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

import { ScrollArea } from './ui/scroll-area';
import { 
  Clock, 
  AlertCircle, 
  Upload, 
  Download, 
  FileText, 
  ChevronRight,
  ChevronDown,
  Plus,
  AlertTriangle,
  X,
  FileVideo,
  ImageIcon,
  Check,
  Ban
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { useAppSelector } from '../store/hooks';
import { 
  campaignTimelineApi, 
  CampaignMilestone
} from '../api/campaignTimeline';

interface CampaignTimelineSidebarProps {
  contractId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignTimelineSidebar({ contractId, isOpen, onClose }: CampaignTimelineSidebarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  
  const [milestones, setMilestones] = useState<CampaignMilestone[]>([]);

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

  // Load timeline when component mounts or contractId changes
  useEffect(() => {
    if (isOpen && contractId) {
      loadTimeline();
    }
  }, [isOpen, contractId]);

  const loadTimeline = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      if (user.role !== 'brand' && user.role !== 'creator') {
        throw new Error('Usuário não tem permissão para acessar este contrato');
      }
      
      const timelineData = await campaignTimelineApi.getTimeline(contractId);
      
      setMilestones(timelineData);
    } catch (error: any) {
      console.error('Error loading timeline:', error);
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
      const newMilestones = await campaignTimelineApi.createMilestones(contractId);
      setMilestones(newMilestones);
      toast({
        title: "Sucesso",
        description: "Milestones criados com sucesso!",
      });
    } catch (error: any) {
      console.error('Error creating milestones:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar milestones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (milestoneId: number) => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      await campaignTimelineApi.uploadFile(milestoneId, selectedFile);
      
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
      
      setShowUploadDialog(false);
      setSelectedFile(null);
      setMaterialDescription('');
      loadTimeline(); // Reload to get updated data
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

  const handleMilestoneApproval = async (milestoneId: number, approved: boolean) => {
    try {
      if (approved) {
        await campaignTimelineApi.approveMilestone(milestoneId, comment);
        toast({
          title: "Sucesso",
          description: "Milestone aprovado com sucesso!",
        });
      } else {
        await campaignTimelineApi.rejectMilestone(milestoneId, comment);
        toast({
          title: "Sucesso",
          description: "Milestone rejeitado com sucesso!",
        });
      }
      
      setShowApprovalDialog(false);
      setComment('');
      loadTimeline(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar milestone",
        variant: "destructive",
      });
    }
  };

  const handleJustifyDelay = async (milestoneId: number) => {
    if (!justification.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça uma justificativa para o atraso",
        variant: "destructive",
      });
      return;
    }

    try {
      await campaignTimelineApi.justifyDelay(milestoneId, justification);
      
      toast({
        title: "Sucesso",
        description: "Atraso justificado com sucesso!",
      });
      
      setShowJustificationDialog(false);
      setJustification('');
      loadTimeline(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error justifying delay:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao justificar atraso",
        variant: "destructive",
      });
    }
  };

  const handleExtendTimeline = async (milestoneId: number) => {
    if (!extensionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça um motivo para a extensão",
        variant: "destructive",
      });
      return;
    }

    try {
      await campaignTimelineApi.extendTimeline(milestoneId, extensionDays, extensionReason);
      
      toast({
        title: "Sucesso",
        description: "Timeline estendida com sucesso!",
      });
      
      setShowExtensionDialog(false);
      setExtensionDays(1);
      setExtensionReason('');
      loadTimeline(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error extending timeline:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao estender timeline",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (isOverdue) return '🔴';
    switch (status) {
      case 'approved': return '🟢';
      case 'completed': return '🟢';
      case 'delayed': return '🔴';
      default: return '🟡';
    }
  };

  const getMilestoneIcon = (milestoneType: string) => {
    switch (milestoneType) {
      case 'script_submission': return '📝';
      case 'script_approval': return '✅';
      case 'video_submission': return '🎥';
      case 'final_approval': return '🏆';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200';
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const hasOverdueMilestones = milestones.some(m => m.is_overdue);
  const hasDelayedMilestones = milestones.some(m => m.is_delayed);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Linha do Tempo
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Warning for overdue/delayed milestones */}
        {(hasOverdueMilestones || hasDelayedMilestones) && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {hasOverdueMilestones && hasDelayedMilestones 
                ? "Existem milestones atrasados e com atraso justificado. Penalidades podem ser aplicadas."
                : hasOverdueMilestones 
                ? "Existem milestones atrasados. Use 'Justificar Atraso' para evitar penalidades."
                : "Existem milestones com atraso justificado."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Nenhum milestone encontrado
                </p>
                {user?.role === 'brand' && (
                  <Button onClick={createMilestones}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Milestones
                  </Button>
                )}
              </div>
            ) : (
              <>


                {/* Milestones */}
                <div className="space-y-4">
                  {milestones.map((milestone, index) => {
                    const isExpanded = expandedMilestones.has(milestone.id);
                    const isOverdue = milestone.is_overdue;
                    const canUpload = milestone.can_upload_file && user?.role === 'creator';
                    const canApprove = milestone.can_be_approved && user?.role === 'brand';
                    const canJustify = milestone.can_justify_delay && user?.role === 'creator';
                    const canExtend = milestone.can_be_extended && user?.role === 'brand';

                    return (
                      <Card key={milestone.id} className={cn(
                        "transition-all duration-200",
                        isOverdue && "border-red-300 bg-red-50/50"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getMilestoneIcon(milestone.milestone_type)}</span>
                              <div className="flex-1">
                                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                                  {milestone.title}
                                </CardTitle>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={cn(
                                "text-xs border",
                                getStatusColor(milestone.status, isOverdue)
                              )}>
                                {getStatusIcon(milestone.status, isOverdue)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newExpanded = new Set(expandedMilestones);
                                  if (isExpanded) {
                                    newExpanded.delete(milestone.id);
                                  } else {
                                    newExpanded.add(milestone.id);
                                  }
                                  setExpandedMilestones(newExpanded);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-0 space-y-3">
                            {/* Deadline */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Prazo:</span>
                              <span className={cn(
                                "font-medium",
                                isOverdue ? "text-red-600" : "text-gray-900 dark:text-white"
                              )}>
                                {milestone.formatted_deadline}
                                {isOverdue && (
                                  <span className="ml-2 text-red-500">
                                    ({Math.abs(milestone.days_overdue || 0)} dias atrasado)
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* File Upload Section */}
                            {canUpload && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {milestone.milestone_type === 'script_submission' ? (
                                    <FileText className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <FileVideo className="w-4 h-4 text-purple-600" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {milestone.milestone_type === 'script_submission' ? 'Enviar Script' : 'Enviar Vídeo/Imagem'}
                                  </span>
                                </div>
                                
                                {milestone.file_path ? (
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                                      {milestone.file_name}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`/api/download/${milestone.file_path}`, '_blank')}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => {
                                      setSelectedMilestone(milestone);
                                      setShowUploadDialog(true);
                                    }}
                                    className="w-full"
                                    size="sm"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {milestone.milestone_type === 'script_submission' ? 'Enviar Script' : 'Enviar Vídeo/Imagem'}
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Approval Section */}
                            {canApprove && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">Aprovar ou Rejeitar</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      setSelectedMilestone(milestone);
                                      setShowApprovalDialog(true);
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    size="sm"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedMilestone(milestone);
                                      setShowApprovalDialog(true);
                                    }}
                                    variant="outline"
                                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                    size="sm"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Delay Justification */}
                            {canJustify && isOverdue && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-700">
                                    Atraso Detectado - Justificar para Evitar Penalidades
                                  </span>
                                </div>
                                <Button
                                  onClick={() => {
                                    setSelectedMilestone(milestone);
                                    setShowJustificationDialog(true);
                                  }}
                                  variant="outline"
                                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                                  size="sm"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Justificar Atraso
                                </Button>
                              </div>
                            )}

                            {/* Timeline Extension */}
                            {canExtend && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium">Estender Prazo</span>
                                </div>
                                <Button
                                  onClick={() => {
                                    setSelectedMilestone(milestone);
                                    setShowExtensionDialog(true);
                                  }}
                                  variant="outline"
                                  className="w-full"
                                  size="sm"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Solicitar Extensão
                                </Button>
                              </div>
                            )}

                            {/* Materials */}
                            {milestone.deliveryMaterials && milestone.deliveryMaterials.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium">Materiais de Entrega</span>
                                </div>
                                <div className="space-y-2">
                                  {milestone.deliveryMaterials.map((material) => (
                                    <div key={material.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          {material.file_name}
                                        </span>
                                        <Badge className={cn(
                                          "text-xs",
                                          material.status === 'approved' ? "bg-green-100 text-green-800" :
                                          material.status === 'rejected' ? "bg-red-100 text-red-800" :
                                          "bg-yellow-100 text-yellow-800"
                                        )}>
                                          {material.status}
                                        </Badge>
                                      </div>
                                      {material.comment && (
                                        <p className="text-xs text-gray-500 mt-1">{material.comment}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && selectedMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {selectedMilestone.milestone_type === 'script_submission' ? (
                <>
                  <FileText className="w-5 h-5 text-blue-600" />
                  Enviar Script
                </>
              ) : (
                <>
                  <FileVideo className="w-5 h-5 text-purple-600" />
                  Enviar Vídeo/Imagem
                </>
              )}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Arquivo
                </label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept={selectedMilestone.milestone_type === 'script_submission' ? '.pdf,.doc,.docx,.txt' : '.mp4,.avi,.mov,.jpg,.jpeg,.png'}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição (opcional)
                </label>
                <Textarea
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="Descreva o conteúdo enviado..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedFile(null);
                  setMaterialDescription('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleFileUpload(selectedMilestone.id)}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && selectedMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Aprovar Milestone
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicione um comentário sobre a aprovação..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalDialog(false);
                  setComment('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleMilestoneApproval(selectedMilestone.id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Justification Dialog */}
      {showJustificationDialog && selectedMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Justificar Atraso
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>⚠️ Aviso:</strong> Se você não justificar o atraso, poderá receber uma penalidade de 7 dias sem novos convites.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explique o motivo do atraso..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowJustificationDialog(false);
                  setJustification('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleJustifyDelay(selectedMilestone.id)}
                disabled={!justification.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Justificar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Extension Dialog */}
      {showExtensionDialog && selectedMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Estender Timeline
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dias para estender
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explique o motivo da extensão..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtensionDialog(false);
                  setExtensionDays(1);
                  setExtensionReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleExtendTimeline(selectedMilestone.id)}
                disabled={!extensionReason.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Estender
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 