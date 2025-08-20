import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deliveryMaterialsApi, DeliveryMaterial, DeliveryMaterialStatistics } from '@/api/deliveryMaterials';
import {
  FileText,
  Image,
  Video,
  File,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageCircle,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';

interface DeliveryMaterialsProps {
  contractId: number;
  contractTitle: string;
}

export default function DeliveryMaterials({ contractId, contractTitle }: DeliveryMaterialsProps) {
  const [materials, setMaterials] = useState<DeliveryMaterial[]>([]);
  const [statistics, setStatistics] = useState<DeliveryMaterialStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<DeliveryMaterial | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveryMaterials();
    loadStatistics();
  }, [contractId]);

  const loadDeliveryMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryMaterialsApi.getDeliveryMaterials(contractId);
      setMaterials(data);
    } catch (error: any) {
      console.error('Error loading delivery materials:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar materiais de entrega',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await deliveryMaterialsApi.getStatistics(contractId);
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedMaterial) return;

    try {
      setIsProcessing(true);
      await deliveryMaterialsApi.approveDeliveryMaterial(selectedMaterial.id, { comment });
      
      toast({
        title: 'Sucesso',
        description: 'Material aprovado com sucesso!',
      });
      
      setShowApprovalDialog(false);
      setComment('');
      setSelectedMaterial(null);
      loadDeliveryMaterials();
      loadStatistics();
    } catch (error: any) {
      console.error('Error approving material:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao aprovar material',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMaterial || !rejectionReason.trim()) return;

    try {
      setIsProcessing(true);
      await deliveryMaterialsApi.rejectDeliveryMaterial(selectedMaterial.id, {
        rejection_reason: rejectionReason.trim(),
        comment: comment.trim() || undefined,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Material rejeitado com sucesso!',
      });
      
      setShowRejectionDialog(false);
      setRejectionReason('');
      setComment('');
      setSelectedMaterial(null);
      loadDeliveryMaterials();
      loadStatistics();
    } catch (error: any) {
      console.error('Error rejecting material:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao rejeitar material',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (material: DeliveryMaterial) => {
    try {
      const blob = await deliveryMaterialsApi.downloadDeliveryMaterial(material.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading material:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao baixar material',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
          <span>Carregando materiais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Estatísticas dos Materiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.total_materials}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending_materials}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.approved_materials}</div>
                <div className="text-sm text-gray-600">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statistics.rejected_materials}</div>
                <div className="text-sm text-gray-600">Rejeitados</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Por Tipo de Mídia:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-600" />
                  <span>Imagens: {statistics.by_media_type.images}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  <span>Vídeos: {statistics.by_media_type.videos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span>Documentos: {statistics.by_media_type.documents}</span>
                </div>
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-gray-600" />
                  <span>Outros: {statistics.by_media_type.other}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Materiais de Entrega - {contractTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhum material enviado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                O criador ainda não enviou materiais para este contrato.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className={`border rounded-lg p-4 ${
                    material.status === 'pending'
                      ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                      : material.status === 'approved'
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {getMediaTypeIcon(material.media_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {material.title || material.file_name}
                          </h4>
                          <Badge className={getStatusColor(material.status)}>
                            {getStatusText(material.status)}
                          </Badge>
                        </div>
                        
                        {material.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {material.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{material.creator?.name || 'Criador'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(material.submitted_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <File className="h-4 w-4" />
                            <span>{formatFileSize(material.file_size)}</span>
                          </div>
                          {material.milestone && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{material.milestone.title}</span>
                            </div>
                          )}
                        </div>
                        
                        {material.status === 'rejected' && material.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm">
                            <strong>Motivo da rejeição:</strong> {material.rejection_reason}
                          </div>
                        )}
                        
                        {material.comment && (
                          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-sm">
                            <strong>Comentário:</strong> {material.comment}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMaterial(material);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {material.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => {
                              setSelectedMaterial(material);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedMaterial(material);
                              setShowRejectionDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Material</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar este material? Esta ação enviará uma notificação ao criador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione um comentário sobre o material..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Aprovando...' : 'Aprovar Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Material</DialogTitle>
            <DialogDescription>
              Por favor, forneça um motivo para a rejeição. Esta ação enviará uma notificação ao criador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="rejection-comment">Comentário Adicional (opcional)</Label>
              <Textarea
                id="rejection-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione comentários adicionais..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectionDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              variant="destructive"
            >
              {isProcessing ? 'Rejeitando...' : 'Rejeitar Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Material</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Arquivo</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.file_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Tipo de Mídia</Label>
                  <div className="flex items-center gap-2">
                    {getMediaTypeIcon(selectedMaterial.media_type)}
                    <span className="text-sm text-gray-600 capitalize">{selectedMaterial.media_type}</span>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Tamanho</Label>
                  <p className="text-sm text-gray-600">{formatFileSize(selectedMaterial.file_size)}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedMaterial.status)}>
                    {getStatusText(selectedMaterial.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Criador</Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedMaterial.creator?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedMaterial.creator?.name}</span>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Data de Envio</Label>
                  <p className="text-sm text-gray-600">{formatDate(selectedMaterial.submitted_at)}</p>
                </div>
              </div>
              
              {selectedMaterial.title && (
                <div>
                  <Label className="font-medium">Título</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.title}</p>
                </div>
              )}
              
              {selectedMaterial.description && (
                <div>
                  <Label className="font-medium">Descrição</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.description}</p>
                </div>
              )}
              
              {selectedMaterial.milestone && (
                <div>
                  <Label className="font-medium">Milestone</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.milestone.title}</p>
                </div>
              )}
              
              {selectedMaterial.status === 'rejected' && selectedMaterial.rejection_reason && (
                <div>
                  <Label className="font-medium">Motivo da Rejeição</Label>
                  <p className="text-sm text-red-600">{selectedMaterial.rejection_reason}</p>
                </div>
              )}
              
              {selectedMaterial.comment && (
                <div>
                  <Label className="font-medium">Comentário</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.comment}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedMaterial)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo
                </Button>
                
                {selectedMaterial.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowApprovalDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowRejectionDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 