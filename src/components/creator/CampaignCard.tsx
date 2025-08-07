import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Eye, Clock, MapPin, DollarSign, Calendar, Users, Heart, User, Star } from "lucide-react";

interface CampaignCardProps {
    campaign: any;
    userApplication?: any;
    onViewDetails: (campaignId: number) => void;
    onApply?: (campaignId: number) => void;
    onToggleFavorite?: (campaignId: number) => void;
}

const statesColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
    "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
];

const CampaignCard: React.FC<CampaignCardProps> = ({
    campaign,
    userApplication,
    onViewDetails,
    onToggleFavorite
}) => {
    // Format budget for display
    const formatBudget = (budget: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(budget);
    };

    // Calculate days until deadline
    const getDaysUntilDeadline = (deadline: string) => {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get deadline status
    const getDeadlineStatus = (deadline: string) => {
        const days = getDaysUntilDeadline(deadline);
        if (days < 0) return { status: 'expired', text: 'Expirado', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' };
        if (days <= 3) return { status: 'urgent', text: `${days} dias`, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200' };
        if (days <= 7) return { status: 'soon', text: `${days} dias`, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200' };
        return { status: 'normal', text: `${days} dias`, color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200' };
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const deadlineStatus = getDeadlineStatus(campaign.deadline);
    
    // Determine badge and button based on application status
    let badge = null;
    let button = null;
    
    if (userApplication) {
        if (userApplication.status === 'approved') {
            badge = <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">Aprovado</Badge>;
            button = (
                <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onViewDetails(campaign.id)}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                </Button>
            );
        } else if (userApplication.status === 'rejected') {
            badge = <Badge variant="destructive">Rejeitado</Badge>;
            button = (
                <Button variant="outline" className="w-full" disabled>
                    Rejeitado
                </Button>
            );
        } else {
            badge = <Badge variant="secondary">Aplicado</Badge>;
            button = (
                <Button 
                    className="w-full bg-[#E91E63] hover:bg-[#E91E63]/80 text-white"
                    onClick={() => onViewDetails(campaign.id)}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                </Button>
            );
        }
    } else {
        button = (
            <Button 
                className="w-full bg-[#E91E63] hover:bg-[#E91E63]/80 text-white"
                onClick={() => onViewDetails(campaign.id)}
            >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
            </Button>
        );
    }

    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-tight">
                                    {campaign.title}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{campaign.brand?.name || 'Marca não informada'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onToggleFavorite && campaign.is_favorited && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 h-auto text-red-500"
                                onClick={() => onToggleFavorite(campaign.id)}
                            >
                                <Heart className="h-4 w-4 fill-current" />
                            </Button>
                        )}
                        {badge}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pb-3 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-3">
                    {campaign.description.length > 100 ? campaign.description.substring(0, 100) + '...' : campaign.description}
                </p>
                
                {/* Category and Deadline */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                        {campaign.category || campaign.type || 'Geral'}
                    </Badge>
                    <Badge 
                        variant="outline" 
                        className={`text-xs ${deadlineStatus.color}`}
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        {deadlineStatus.text}
                    </Badge>
                </div>

                {/* States badges */}
                {Array.isArray(campaign.target_states) && campaign.target_states.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {campaign.target_states.map((uf: string, i: number) => (
                            <Badge
                                key={uf}
                                variant="secondary"
                                className={`text-xs ${statesColors[i % statesColors.length]}`}
                            >
                                <MapPin className="h-3 w-3 mr-1" />
                                {uf}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Additional campaign info */}
                <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Prazo: {formatDate(campaign.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span className={campaign.bids && campaign.bids.length > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                            {campaign.bids && campaign.bids.length > 0 
                                ? `${campaign.bids.length} aplicação${campaign.bids.length !== 1 ? 'ões' : ''}`
                                : 'Nenhuma aplicação ainda'
                            }
                        </span>
                        {campaign.bids && campaign.bids.length > 0 && (
                            <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                    campaign.bids.length <= 3 ? 'text-green-600 bg-green-50 border-green-200' :
                                    campaign.bids.length <= 7 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                                    'text-red-600 bg-red-50 border-red-200'
                                }`}
                            >
                                {campaign.bids.length <= 3 ? 'Baixa' : 
                                 campaign.bids.length <= 7 ? 'Média' : 'Alta'} competição
                            </Badge>
                        )}
                    </div>
                    
                </div>
            </CardContent>
            
            <Separator />
            
            <CardFooter className="pt-3 flex-shrink-0">
                <div className="w-full flex flex-col sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-lg">{formatBudget(campaign.budget)}</span>
                    </div>
                    {button}
                    {/* Contribute Button - Add to Favorites */}
                    <Button  className="bg-green-600 hover:bg-green-700 text-white text-xs w-full"
                            onClick={() => {
                                onToggleFavorite && onToggleFavorite(campaign.id);
                            }}
                        >
                            Contribuir
                        </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default CampaignCard; 