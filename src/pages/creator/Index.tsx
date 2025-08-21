import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import Sidebar from "../../components/creator/Sidebar";
import Dashboard from "../../components/creator/Dashboard";
import { useIsMobile } from "../../hooks/use-mobile";
import { CreatorProfile } from "../../components/creator/CreatorProfile";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import GuideEmbedded from "@/components/GuideEmbedded";
import { Helmet } from "react-helmet-async";

function Index() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { hasPremium, loading: premiumLoading } = usePremiumContext();
    const { user } = useAppSelector((state) => state.auth);

    const [component, setComponent] = useState<string | null>("Painel");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Handle subscription route
    useEffect(() => {
        if (location.pathname === '/creator/subscription') {
            setComponent("Assinatura");
        } else if (location.pathname === '/creator' && !component) {
            // Set default component if on main creator page
            setComponent("Painel");
        }
    }, [location.pathname, component]);

    const CreatorComponent = () => {
        // Define which components require premium access
        const premiumRequiredComponents = ["Painel", "Detalhes do Projeto", "Minha Aplicação", "Chat", "Notificações"];
        const isPremiumRequired = premiumRequiredComponents.includes(component || "");
        
        // Check both PremiumContext and Redux user state for premium access
        const userHasPremium = hasPremium || user?.has_premium;
        
        // If premium is required and user doesn't have it, show premium guard
        if (isPremiumRequired && !userHasPremium && !premiumLoading) {
            return (
                <PremiumAccessGuard setComponent={setComponent}>
                    <div>This component requires premium</div>
                </PremiumAccessGuard>
            );
        }
        
        switch (component) {
            case "Painel":
                return (
                    <div>
                        <Dashboard setComponent={setComponent} setProjectId={setProjectId} />
                    </div>
                );
            case "Minha Conta":
                return <CreatorProfile />;
            case "Detalhes do Projeto":
                return <ProjectDetail setComponent={setComponent} projectId={projectId} />;
            case "Minha Aplicação":
                return <MyApplication setComponent={setComponent} />;
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
            case "Cadastro Bancário":
                return <BankRegistrationDemo />;
            case "Guia da Plataforma":
                return <GuideEmbedded audience="Creator" />;
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <Helmet>
                <title>{component ? `${component} - Nexa Creator` : 'Nexa Creator'}</title>
                <meta name="description" content="Painel do criador da plataforma Nexa - Gerencie suas campanhas, portfólio e aplicações" />
            </Helmet>
            <div className="flex h-screen bg-background text-foreground">
                {!isMobile && <Sidebar setComponent={setComponent} component={component} />}
                <div className="flex-1 flex flex-col min-w-0">
                    <ComponentNavbar title={component} />
                    <main className={`flex-1 overflow-y-auto bg-muted/50 ${isMobile ? 'md:pb-20' : ''} scrollbar-hide-mobile`}>
                        <CreatorComponent />
                    </main>
                </div>
                {isMobile && <Sidebar setComponent={setComponent} component={component} />}
            </div>
        </ThemeProvider>
    );
};

export default Index;