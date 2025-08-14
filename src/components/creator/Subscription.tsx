import { Button } from "../ui/button";
import { CheckCircle2, Calendar, Lightbulb, Crown, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import SubscriptionModal from "./SubscriptionModal";
import { paymentApi, SubscriptionStatus } from "../../api/payment";
import { useToast } from "../../hooks/use-toast";

const benefits = [
    "Aplicações ilimitadas em campanhas",
    "Acesso a todas as campanhas exclusivas",
    "Prioridade na aprovação de campanhas",
    "Suporte premium via chat",
    "Ferramentas avançadas de criação de conteúdo",
];

export default function Subscription() {
    const { toast } = useToast();
    const [showCoupon, setShowCoupon] = useState(false);
    const [open, setOpen] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    useEffect(() => {
        loadSubscriptionStatus();
    }, []);

    // Refresh subscription status when modal closes
    useEffect(() => {
        if (!open) {
            // Small delay to ensure backend has processed the payment
            const timer = setTimeout(() => {
                loadSubscriptionStatus();
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [open]);

    const loadSubscriptionStatus = async () => {
        try {
            setLoading(true);
            const status = await paymentApi.getSubscriptionStatus();
            
            // Check if subscription just became active
            const wasActive = subscriptionStatus?.is_premium_active;
            const isNowActive = status.is_premium_active;
            
            setSubscriptionStatus(status);
    
            // Show success message if subscription just became active
            if (!wasActive && isNowActive) {
                toast({
                    title: "🎉 Premium Ativado!",
                    description: "Sua assinatura premium foi ativada com sucesso!",
                });
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível carregar o status da assinatura.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusBadge = () => {
        if (!subscriptionStatus) return null;

        if (subscriptionStatus.is_premium_active) {
            return (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Premium Ativo
                </div>
            );
        }

        if (subscriptionStatus.has_premium && subscriptionStatus.days_remaining <= 0) {
            return (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Expirado
                </div>
            );
        }

        return (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                Gratuito
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-[#f6f6f6] dark:bg-[#18181b] flex flex-col items-center py-6 px-2 sm:px-6">
            <div className="w-full flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assinatura Nexa UGC</h1>
                        <p className="text-muted-foreground text-base">Garanta seu acesso completo à plataforma</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSubscriptionStatus}
                        disabled={loading || paymentProcessing}
                        className="w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Carregando...
                            </>
                        ) : (
                            'Atualizar Status'
                        )}
                    </Button>
                </div>

                {/* Testimonial/Info */}
                <div className="rounded-xl border border-[#f3eaff] dark:border-[#3a2a4d] bg-[#faf6ff] dark:bg-[#23182e] px-6 py-4 flex items-center gap-3 shadow-sm">
                    <div className="rounded-full bg-[#f3eaff] dark:bg-[#3a2a4d] p-2 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-purple-400 dark:text-purple-200" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-foreground">Diz Sarah:</div>
                        <div className="text-sm text-muted-foreground mt-0.5">"Com o Plano PRO, você aumenta suas chances e participa das melhores campanhas!"</div>
                    </div>
                </div>

                {/* Current Plan */}
                <div className="rounded-xl border bg-background shadow-sm flex flex-col px-6 py-5 gap-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Carregando status da assinatura...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-200" />
                            </div>
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <div>
                                    <div className="font-semibold text-base text-foreground flex items-center gap-2">
                                        Status da Assinatura
                                        {getStatusBadge()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {subscriptionStatus?.is_premium_active 
                                            ? `Sua assinatura premium é válida até:`
                                            : subscriptionStatus?.has_premium && subscriptionStatus.days_remaining <= 0
                                            ? "Sua assinatura premium expirou em:"
                                            : "Você está usando o plano gratuito"
                                        }
                                    </div>
                                </div>
                                <div className="text-base text-foreground font-medium sm:text-right">
                                    {subscriptionStatus?.premium_expires_at 
                                        ? formatDate(subscriptionStatus.premium_expires_at)
                                        : "N/A"
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {subscriptionStatus?.is_premium_active && subscriptionStatus.days_remaining > 0 && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-800 dark:text-green-200">
                                    <strong>{subscriptionStatus.days_remaining}</strong> dias restantes na sua assinatura premium
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Available Plans */}
                <div className="flex flex-col gap-4">
                    <div className="font-bold text-lg text-foreground">Planos Disponíveis</div>
                    <div className="rounded-xl border bg-background shadow-sm px-6 py-6 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <div className="font-bold text-xl text-foreground mb-0.5">PRO Creator</div>
                                <div className="text-sm text-muted-foreground mb-2">O plano ideal para criadores que querem se destacar</div>
                            </div>
                            <div className="flex flex-col items-end min-w-[110px]">
                                <span className="text-2xl font-bold text-foreground leading-none">R$ 29,99</span>
                                <span className="text-xs text-muted-foreground leading-none">/ mês</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="font-semibold text-sm mb-1 text-foreground">Benefícios incluídos:</div>
                            <ul className="flex flex-col gap-2">
                                {benefits.map((b) => (
                                    <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-pink-500 dark:text-pink-300" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                            <div className="flex-1 flex items-center">
                                {!showCoupon ? (
                                    <button
                                        className="text-pink-500 text-sm hover:underline"
                                        onClick={() => setShowCoupon(true)}
                                        type="button"
                                    >
                                        Eu tenho um cupom de desconto
                                    </button>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Digite seu cupom"
                                        className="border rounded-md px-3 py-2 text-sm bg-background text-foreground outline-none w-full sm:w-56"
                                    />
                                )}
                            </div>
                            <Button 
                                onClick={() => setOpen(true)} 
                                className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-8 py-2 text-base w-full sm:w-auto mt-2 sm:mt-0"
                                disabled={subscriptionStatus?.is_premium_active || paymentProcessing}
                            >
                                {paymentProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processando...
                                    </>
                                ) : subscriptionStatus?.is_premium_active ? 'Assinatura Ativa' : 'Assinar agora'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <SubscriptionModal 
              open={open} 
              onOpenChange={(newOpen) => {
                setOpen(newOpen);
                if (!newOpen) {
                  setPaymentProcessing(false);
                }
              }}
              onSuccess={() => {
                // Refresh subscription status after successful payment
                setPaymentProcessing(true);
                loadSubscriptionStatus().finally(() => {
                  setPaymentProcessing(false);
                });
                
                // Dispatch event to notify other components about premium status update
                window.dispatchEvent(new CustomEvent('premium-status-updated'));
                
                toast({
                  title: "Success!",
                  description: "Your premium subscription has been activated successfully!",
                });
              }}
            />
        </div>
    );
}
