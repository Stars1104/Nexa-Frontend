import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Star,
  User
} from 'lucide-react';

interface Offer {
  id: number;
  title: string;
  description: string;
  budget: string;
  estimated_days: number;
  requirements: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  days_until_expiry: number;
  is_expiring_soon: boolean;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  other_user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface OfferCardProps {
  offer: Offer;
  onOfferUpdated: () => void;
}

export default function OfferCard({ offer, onOfferUpdated }: OfferCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = () => {
    switch (offer.status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aceita</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirada</Badge>;
      default:
        return <Badge variant="secondary">{offer.status}</Badge>;
    }
  };

  const getStatusColor = () => {
    switch (offer.status) {
      case 'pending':
        return offer.is_expiring_soon ? 'text-orange-600' : 'text-blue-600';
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'expired':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleAccept = async () => {
    if (!offer.can_be_accepted) {
      toast({
        title: "Erro",
        description: "Esta oferta não pode ser aceita",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiClient.post(`/offers/${offer.id}/accept`);

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Oferta aceita com sucesso! Contrato criado.",
        });
        onOfferUpdated();
      } else {
        throw new Error(response.data.message || 'Erro ao aceitar oferta');
      }
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || 'Erro ao aceitar oferta',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!offer.can_be_accepted) {
      toast({
        title: "Erro",
        description: "Esta oferta não pode ser rejeitada",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiClient.post(`/offers/${offer.id}/reject`, {
        reason: rejectionReason.trim() || undefined,
      });

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Oferta rejeitada com sucesso",
        });
        setShowRejectDialog(false);
        setRejectionReason('');
        onOfferUpdated();
      } else {
        throw new Error(response.data.message || 'Erro ao rejeitar oferta');
      }
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || 'Erro ao rejeitar oferta',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${
        offer.is_expiring_soon && offer.status === 'pending' ? 'border-orange-200 bg-orange-50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={offer.other_user.avatar_url} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{offer.title}</CardTitle>
                <p className="text-sm text-gray-600">de {offer.other_user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {offer.is_expiring_soon && offer.status === 'pending' && (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700">{offer.description}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Orçamento</p>
                <p className="font-semibold">{offer.budget}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Prazo</p>
                <p className="font-semibold">{offer.estimated_days} dias</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Expira em</p>
                <p className={`font-semibold ${getStatusColor()}`}>
                  {offer.days_until_expiry} dias
                </p>
              </div>
            </div>
          </div>

          {offer.requirements && offer.requirements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
              <ul className="space-y-1">
                {offer.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Star className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {offer.status === 'pending' && offer.can_be_accepted && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processando...' : 'Aceitar Oferta'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {offer.status === 'accepted' && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Oferta aceita em {formatDate(offer.accepted_at!)}
              </p>
            </div>
          )}

          {offer.status === 'rejected' && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                <XCircle className="h-4 w-4 inline mr-2" />
                Oferta rejeitada em {formatDate(offer.rejected_at!)}
                {offer.rejection_reason && (
                  <span className="block mt-1">
                    <strong>Motivo:</strong> {offer.rejection_reason}
                  </span>
                )}
              </p>
            </div>
          )}

          {offer.status === 'expired' && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 text-sm">
                <Clock className="h-4 w-4 inline mr-2" />
                Oferta expirada
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            Recebida em {formatDate(offer.created_at)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Oferta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar esta oferta? Você pode adicionar um motivo opcional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo da rejeição (opcional)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique por que você está rejeitando esta oferta..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Rejeitar Oferta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 