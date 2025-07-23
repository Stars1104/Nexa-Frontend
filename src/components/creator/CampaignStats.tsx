import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, Users, Star, DollarSign, Calendar, Target, Award } from "lucide-react";

interface CampaignStatsProps {
    totalCampaigns: number;
    myApplications: number;
    activeOpportunities: number;
    totalEarnings?: number;
    averageBudget?: number;
    successRate?: number;
}

const CampaignStats: React.FC<CampaignStatsProps> = ({
    totalCampaigns,
    myApplications,
    activeOpportunities,
    totalEarnings = 0,
    averageBudget = 0,
    successRate = 0
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    };

    const stats = [
        { 
            label: "CAMPANHAS DISPONÍVEIS", 
            value: totalCampaigns,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950",
            description: "Oportunidades ativas"
        },
        { 
            label: "MINHAS APLICAÇÕES", 
            value: myApplications,
            icon: <Users className="h-4 w-4" />,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-950",
            description: "Candidaturas enviadas"
        },
        { 
            label: "OPORTUNIDADES ATIVAS", 
            value: activeOpportunities,
            icon: <Star className="h-4 w-4" />,
            color: "text-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950",
            description: "Com prazo válido"
        },
        { 
            label: "GANHOS TOTAIS", 
            value: formatCurrency(totalEarnings),
            icon: <DollarSign className="h-4 w-4" />,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-950",
            description: "Valor total ganho"
        },
        { 
            label: "ORÇAMENTO MÉDIO", 
            value: formatCurrency(averageBudget),
            icon: <Target className="h-4 w-4" />,
            color: "text-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-950",
            description: "Por campanha"
        },
        { 
            label: "TAXA DE SUCESSO", 
            value: `${successRate}%`,
            icon: <Award className="h-4 w-4" />,
            color: "text-pink-600",
            bgColor: "bg-pink-50 dark:bg-pink-950",
            description: "Aplicações aprovadas"
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {stat.label}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-1">
                            <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
                                {stat.value}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default CampaignStats; 