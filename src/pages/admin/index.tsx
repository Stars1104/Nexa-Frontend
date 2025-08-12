import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import { useIsMobile } from "../../hooks/use-mobile";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/sonner";
import { toggleAdminRole } from "../../store/slices/authSlice";
import NotFound from "../NotFound";
import AdminSidebar from "@/components/admin/Sidebar";
import Dashboard from "@/components/admin/Dashboard";
import PendingCampaign from "@/components/admin/PendingCampaign";
import CampaignList from "@/components/admin/CampaignList";
import UserList from "@/components/admin/UserList";
import WithdrawalVerification from "@/components/admin/WithdrawalVerification";
import Setting from "@/components/admin/Setting";
import Notification from "@/components/Notification";
import NexaGuide from "@/components/admin/Guidelist";
import GuideTest from "@/components/GuideTest";

const AdminIndex = () => {
    const isMobile = useIsMobile();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [component, setComponent] = useState<string | null>("Painel");
    const [accessDenied, setAccessDenied] = useState(false);

    // Check if user has admin role
    useEffect(() => {
        if (user && user.role !== 'admin') {
            setAccessDenied(true);
            toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
        }
    }, [user]);

    const handleToggleAdminRole = () => {
        dispatch(toggleAdminRole());
        setAccessDenied(false);
        toast.success("Função de administrador ativada para testes.");
    };

    const CreatorComponent = () => {
        switch (component) {
            case "Painel":
                return <Dashboard />;
            case "Campanhas Pendentes":
                return <PendingCampaign />;
            case "Todas as Campanhas":
                return <CampaignList />;
            case "Usuários":
                return <UserList />;
            case "Verificação de Saques":
                return <WithdrawalVerification />;
            // case "Configurações de Regras":
            //     return <Setting />;
            case "Guia para":
                return <NexaGuide />;
            case "Guide Test":
                return <GuideTest />;
            case "Notificações":
                return <Notification />
            default:
                return <NotFound />;
        }
    }

    // Show access denied message if user doesn't have admin role
    if (accessDenied || (user && user.role !== 'admin')) {
        return (
            <ThemeProvider>
                <div className="flex h-screen bg-background text-foreground items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Alert className="max-w-md border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                            <AlertTitle className="text-red-800 dark:text-red-200">Acesso Negado</AlertTitle>
                            <AlertDescription className="text-red-700 dark:text-red-300">
                                Você não tem permissão para acessar o painel administrativo. Apenas administradores podem acessar esta área.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={handleToggleAdminRole}
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                            Ativar Função de Admin (Teste)
                        </Button>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-background text-foreground">
                {!isMobile && <AdminSidebar setComponent={setComponent} component={component} />}
                <div className="flex-1 flex flex-col min-w-0">
                    <ComponentNavbar title={component || "Dashboard"} />
                    <main className={`flex-1 overflow-y-auto bg-muted/50 ${isMobile ? 'pb-20' : ''}`}>
                        <CreatorComponent />
                    </main>
                </div>
                {isMobile && <AdminSidebar setComponent={setComponent} component={component} />}
            </div>
        </ThemeProvider>
    );
};

export default AdminIndex;