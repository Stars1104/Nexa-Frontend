import { Button } from "../ui/button";
import { CheckCircle2, Calendar, Lightbulb, Crown, AlertCircle, Loader2, Star, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import SubscriptionModal from "./SubscriptionModal";
import { paymentApi, SubscriptionStatus, SubscriptionPlan } from "../../api/payment";
import { useToast } from "../../hooks/use-toast";
import { dispatchPremiumStatusUpdate } from "../../utils/browserUtils";
import { useAppSelector } from "../../store/hooks";
import { apiClient } from "../../services/apiClient";

const benefits = [
    "Aplicações ilimitadas em campanhas",
    "Acesso a todas as campanhas exclusivas",
    "Prioridade na aprovação de campanhas",
    "Suporte premium via chat",
    "Ferramentas avançadas de criação de conteúdo",
];

export default function Subscription() {
    const { toast } = useToast();
    const { user } = useAppSelector((state) => state.auth);
    const [showCoupon, setShowCoupon] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(true);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [studentStatus, setStudentStatus] = useState<any>(null);
    const [studentLoading, setStudentLoading] = useState(false);

    useEffect(() => {
        // Load subscription plans first (public endpoint)
        loadSubscriptionPlans();
        // Load subscription status only if user is authenticated
        const token = localStorage.getItem('token');
        if (token) {
             if (user?.role ==="student") {
                loadStudentStatus();
            }
            loadSubscriptionStatus();
            // Load student status if user is a student
        }
    }, [user?.role]);

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
        // Check if user is authenticated before making API call
        const token = localStorage.getItem('token');
        if (!token) {
            setSubscriptionStatus(null);
            setLoading(false);
            return;
        }

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
        } catch (error: any) {
            // Handle 401 errors specifically - user is not authenticated
            if (error.response?.status === 401) {
                setSubscriptionStatus(null);
            } else {
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar o status da assinatura.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadStudentStatus = async () => {
        try {
            setStudentLoading(true);
            const response = await apiClient.get('/student/status');
            setStudentStatus(response.data);
        } catch (error: any) {
            console.error('Error loading student status:', error);
            if (error.response?.status !== 401) {
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar o status de aluno.",
                    variant: "destructive",
                });
            }
        } finally {
            setStudentLoading(false);
        }
    };

    const loadSubscriptionPlans = async () => {
        try {
            setPlansLoading(true);
            const plans = await paymentApi.getSubscriptionPlans();
            
            // Ensure plans is an array and has the expected structure
            if (Array.isArray(plans) && plans.length > 0) {
                // Validate and sanitize plan data
                const validatedPlans = plans.map(plan => ({
                    id: plan.id || 0,
                    name: plan.name || 'Plano',
                    description: plan.description || 'Descrição não disponível',
                    price: typeof plan.price === 'number' ? plan.price : parseFloat(plan.price) || 0,
                    duration_months: typeof plan.duration_months === 'number' ? plan.duration_months : parseInt(plan.duration_months) || 1,
                    monthly_price: typeof plan.monthly_price === 'number' ? plan.monthly_price : parseFloat(plan.monthly_price) || 0,
                    savings_percentage: typeof plan.savings_percentage === 'number' ? plan.savings_percentage : null,
                    features: Array.isArray(plan.features) ? plan.features : [],
                    sort_order: typeof plan.sort_order === 'number' ? plan.sort_order : parseInt(plan.sort_order) || 0
                }));
                
                setSubscriptionPlans(validatedPlans);
                
                // Set default selected plan to monthly plan
                setSelectedPlan(validatedPlans[0]);
            } else {
                setSubscriptionPlans([]);
                setSelectedPlan(null);
            }
        } catch (error) {
            console.error('Erro ao carregar planos de assinatura:', error);
            setSubscriptionPlans([]);
            setSelectedPlan(null);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os planos de assinatura.",
                variant: "destructive",
            });
        } finally {
            setPlansLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const calculateTrialDaysRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const getStatusBadge = () => {
        if (!subscriptionStatus) return null;
        // Check if user is a student with active trial
        if (user?.role === "student" && (subscriptionStatus.is_on_trial || studentStatus?.is_on_trial)) {
            const daysRemaining = (studentStatus?.student_expires_at 
                    ? calculateTrialDaysRemaining(studentStatus.student_expires_at)
                    : 0);
            
            return (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                    <GraduationCap className="w-3 h-3" />
                    aluno - {daysRemaining} dias restantes
                </div>
            );
        }

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
                                        {user?.role ==="student" && (subscriptionStatus?.is_on_trial || studentStatus?.is_on_trial)
                                            ? `Seu acesso gratuito de aluno é válido até:`
                                            : subscriptionStatus?.is_premium_active 
                                            ? `Sua assinatura premium é válida até:`
                                            : subscriptionStatus?.has_premium && subscriptionStatus.days_remaining <= 0
                                            ? "Sua assinatura premium expirou em:"
                                            : "Você está usando o plano gratuito"
                                        }
                                    </div>
                                </div>
                                <div className="text-base text-foreground font-medium sm:text-right">
                                    {user?.role ==="student" && (subscriptionStatus?.free_trial_expires_at || studentStatus?.free_trial_expires_at)
                                        ? formatDate(subscriptionStatus?.free_trial_expires_at || studentStatus?.free_trial_expires_at)
                                        : subscriptionStatus?.premium_expires_at 
                                        ? formatDate(subscriptionStatus.premium_expires_at)
                                        : "Não disponível"
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {user?.role ==="student" && studentStatus?.is_on_trial && studentStatus?.free_trial_expires_at && !subscriptionStatus?.is_premium_active && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>{calculateTrialDaysRemaining(studentStatus.student_expires_at)}</strong> dias restantes no seu acesso gratuito de aluno
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {subscriptionStatus?.is_premium_active && subscriptionStatus.days_remaining > 0 && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-800 dark:text-green-200">
                                    <strong>{calculateTrialDaysRemaining(studentStatus.student_expires_at)}</strong> dias restantes na sua assinatura premium
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Available Plans */}
                <div className="flex flex-col gap-4">
                    <div className="font-bold text-lg text-foreground">Planos Disponíveis</div>
                    
                    {plansLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Carregando planos...</span>
                        </div>
                    ) : !subscriptionPlans || subscriptionPlans.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <div className="font-medium mb-1">Nenhum plano disponível</div>
                            <div className="text-sm">Não foi possível carregar os planos de assinatura</div>
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-background shadow-sm p-6">
                            {/* Plan Selection Bar */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                {subscriptionPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`flex-1 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                            selectedPlan?.id === plan.id
                                                ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20 ring-2 ring-pink-500/20'
                                                : 'border-border hover:border-pink-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                        onClick={() => setSelectedPlan(plan)}
                                    >
                                        <div className="text-center">
                                            <div className="font-bold text-lg text-foreground mb-1">
                                                {plan.name || 'Plano'}
                                            </div>
                                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                                                R$ {typeof plan.price === 'number' ? plan.price.toFixed(2).replace('.', ',') : '0,00'}
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                {plan.duration_months === 1 
                                                    ? 'por mês' 
                                                    : `por ${plan.duration_months || 1} meses`
                                                }
                                            </div>
                                            {plan.savings_percentage && typeof plan.savings_percentage === 'number' && (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                                                    <Star className="w-3 h-3" />
                                                    {plan.savings_percentage}% OFF
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Selected Plan Details */}
                            {selectedPlan && (
                                <div className="border-t pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                        <div>
                                            <div className="font-bold text-xl text-foreground mb-2">
                                                {selectedPlan.name} - Detalhes
                                            </div>
                                                                                    <div className="text-sm text-muted-foreground">
                                            {selectedPlan.description || 'Descrição não disponível'}
                                        </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-foreground">
                                                R$ {typeof selectedPlan.price === 'number' ? selectedPlan.price.toFixed(2).replace('.', ',') : '0,00'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {selectedPlan.duration_months === 1 
                                                    ? 'por mês' 
                                                    : `por ${selectedPlan.duration_months || 1} meses (R$ ${typeof selectedPlan.monthly_price === 'number' ? selectedPlan.monthly_price.toFixed(2).replace('.', ',') : '0,00'}/mês)`
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="mb-6">
                                        <div className="font-semibold text-sm mb-3 text-foreground">
                                            Benefícios incluídos:
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedPlan.features && Array.isArray(selectedPlan.features) ? (
                                                selectedPlan.features.map((feature, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                                                        <CheckCircle2 className="w-4 h-4 text-pink-500 dark:text-pink-300 flex-shrink-0" />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-muted-foreground text-sm">
                                                    Nenhum benefício listado para este plano
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subscribe Button */}
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setOpen(true)}
                                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 text-lg w-full sm:w-auto"
                                            disabled={subscriptionStatus?.is_premium_active || paymentProcessing}
                                        >
                                            {subscriptionStatus?.is_premium_active 
                                                ? 'Assinatura Ativa' 
                                                : `Assinar ${selectedPlan.name || 'Plano'} por R$ ${typeof selectedPlan.price === 'number' ? selectedPlan.price.toFixed(2).replace('.', ',') : '0,00'}`
                                            }
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Plan Selection Instructions */}
                            {!selectedPlan && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <div className="font-medium mb-1">Selecione um plano</div>
                                    <div className="text-sm">Clique em um dos planos acima para ver os detalhes e assinar</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Coupon Section */}
                    {!plansLoading && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                            <div className="flex items-center">
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
                        </div>
                    )}
                </div>
            </div>
            <SubscriptionModal 
              open={open} 
              selectedPlan={selectedPlan}
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
                dispatchPremiumStatusUpdate();
                
                                toast({
                    title: "Sucesso!",
                    description: "Sua assinatura premium foi ativada com sucesso!",
                });
              }}
            />
        </div>
    );
}
