import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import Sidebar from "../../components/creator/Sidebar";
import Dashboard from "../../components/creator/Dashboard";
import { useIsMobile } from "../../hooks/use-mobile";
import { CreatorProfile } from "../../components/creator/CreatorProfile";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useComponentNavigation } from "../../hooks/useComponentNavigation";
import { usePostLoginNavigation } from "../../hooks/usePostLoginNavigation";
import NotFound from "../NotFound";
import ProjectDetail from "../../components/creator/ProjectDetail";
import MyApplication from "../../components/creator/MyApplication";
import Chat from "../../components/Chat";
import Portfolio from "../../components/creator/Portfolio";
import Notification from "@/components/Notification";
import Subscription from "@/components/creator/Subscription";
import TransactionHistory from "@/components/creator/TransactionHistory";
import BalanceAndWithdrawals from "@/components/creator/BalanceAndWithdrawals";
import PremiumAccessGuard from "../../components/PremiumAccessGuard";
import { usePremiumContext } from "../../contexts/PremiumContext";
import { useAppSelector } from "../../store/hooks";
import BankRegistrationDemo from "../BankRegistrationDemo";
import StripeConnectPage from "../creator/StripeConnectPage";
import GuideEmbedded from "@/components/GuideEmbedded";
import StudentVerify from "../auth/StudentVerify";
import { Helmet } from "react-helmet-async";
import PaymentMethods from "../PaymentMethods";
 

 

function Index() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { hasPremium, loading: premiumLoading } = usePremiumContext();
    const { user } = useAppSelector((state) => state.auth);

    const [projectId, setProjectId] = useState<number | null>(null);

    const { component, setComponent } = useComponentNavigation({
        defaultComponent: "Painel",
        additionalParams: projectId ? { projectId: projectId.toString() } : {}
    });

    // Handle post-login navigation to ensure proper browser history
    usePostLoginNavigation({
        dashboardPath: "/creator",
        defaultComponent: "Painel"
    });

    // Check if user is ONLY a student (not a creator) and not verified - show verification page
    // This runs after post-login navigation to ensure student verification takes priority
    useEffect(() => {
        // Only check if user is loaded and is a student
        if (user && user.role === 'student') {
            // If student_verified is explicitly false or undefined, show verification page
            // This should override any default component set by post-login navigation
            if (user.student_verified !== true && component !== "Verificação de Aluno") {
                setComponent("Verificação de Aluno");
            }
        }
    }, [user?.id, user?.role, user?.student_verified, component, setComponent]);

    // Handle subscription route - convert pathname route to query param route
    // IMPORTANT: Don't convert if there are checkout params (success/session_id) - let Subscription component handle it first
    useEffect(() => {
        if (location.pathname === '/creator/subscription') {
            const currentSearch = location.search;
            const urlParams = new URLSearchParams(currentSearch);
            const hasCheckoutParams = urlParams.has('success') || urlParams.has('session_id');
            
            // Only convert if not already using query params AND no checkout params
            // This allows Subscription component to process checkout first
            if (!currentSearch.includes('component=') && !hasCheckoutParams) {
                setComponent("Assinatura");
            }
        }
    }, [location.pathname, location.search, setComponent]);

    // Enhanced setComponent that also handles projectId
    const handleComponentChange = (newComponent: string, newProjectId?: number | null) => {
        setComponent(newComponent, { projectId: newProjectId?.toString() });
        if (newProjectId !== undefined) {
            setProjectId(newProjectId);
        }
    };

    const CreatorComponent = () => {
        // If user is ONLY a student (not a creator) and not verified, force verification page
        // Check if student_verified is explicitly not true (false or undefined)
        if (user && user.role === 'student' && user.student_verified !== true) {
            return <StudentVerify setComponent={handleComponentChange} />;
        }

        // Define which components require premium access
        const premiumRequiredComponents = ["Painel", "Detalhes do Projeto", "Minha Aplicação", "Chat", "Notificações"];
        const isPremiumRequired = premiumRequiredComponents.includes(component || "");
        
        // Use the premium context which includes proper student trial logic
        const userHasPremium = hasPremium;
        
        // If premium is required and user doesn't have it, show premium guard
        if (isPremiumRequired && !userHasPremium && !premiumLoading) {
            return (
                <PremiumAccessGuard setComponent={handleComponentChange}>
                    <div>This component requires premium</div>
                </PremiumAccessGuard>
            );
        }
        
        switch (component) {
            case "Painel":
                return (
                    <div>
                        <Dashboard setComponent={handleComponentChange} setProjectId={setProjectId} />
                    </div>
                );
            case "Minha Conta":
                return <CreatorProfile />;
            case "Detalhes do Projeto":
                return <ProjectDetail setComponent={handleComponentChange} projectId={projectId} />;
            case "Minha Aplicação":
                return <MyApplication setComponent={handleComponentChange} />;
            case "Chat":
                return <Chat />;
            case "Portfólio":
                return <Portfolio />;
            case "Saldo e Saques":
                return <BalanceAndWithdrawals />;
            case "Notificações":
                return <Notification />;
            case "Assinatura":
                return <Subscription />;
            case "Histórico de Pagamentos":
                return <TransactionHistory />;
            // case "Cadastro Bancário":
            //     return <BankRegistrationDemo />;
            case "Configuração Stripe":
                return <StripeConnectPage />;
            case "Verificação de Aluno":
                return (
                        <StudentVerify setComponent={handleComponentChange} />
                );
            case "Guia da Plataforma":
                return <GuideEmbedded audience="Creator" />;
            case "Pagamento":
                return <PaymentMethods />;
            default:
                return <NotFound />;
        }
    }

    // Show loading while checking premium status
    if (premiumLoading) {
        return (
            <ThemeProvider>
                <div className="flex h-screen bg-background text-foreground">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Verificando status premium...</p>
                        </div>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <Helmet>
                <title>{component ? `${component} - Nexa Creator` : 'Dashboard - Nexa Creator'}</title>
                <meta name="description" content="Painel do criador na plataforma Nexa - Gerencie seus projetos, portfólio e pagamentos" />
            </Helmet>
            <div className="flex h-screen bg-background text-foreground">
                {!isMobile && <Sidebar setComponent={handleComponentChange} component={component} />}
                <div className="flex-1 flex flex-col min-w-0">
                    <ComponentNavbar title={component || "Dashboard"} />
                    <main className={`flex-1 overflow-y-auto bg-muted/50`}>
                        <CreatorComponent />
                    </main>
                </div>
                {isMobile && <Sidebar setComponent={handleComponentChange} component={component} />}
            </div>
        </ThemeProvider>
    );
}

export default Index;