import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import Sidebar from "../../components/creator/Sidebar";
import Dashboard from "../../components/creator/Dashboard";
import { useIsMobile } from "../../hooks/use-mobile";
import { CreatorProfile } from "../../components/creator/CreatorProfile";
import { useState } from "react";
import NotFound from "../NotFound";
import ProjectDetail from "../../components/creator/ProjectDetail";
import MyApplication from "../../components/creator/MyApplication";
import Chat from "../../components/Chat";
import Portfolio from "../../components/creator/Portfolio";
import Notification from "@/components/Notification";
import Subscription from "@/components/creator/Subscription";

const Index = () => {
    const isMobile = useIsMobile();

    const [component, setComponent] = useState<string | null>("Painel");
    const [projectId, setProjectId] = useState<number | null>(null);

    const CreatorComponent = () => {
        switch (component) {
            case "Painel":
                return <Dashboard setComponent={setComponent} setProjectId={setProjectId} />;
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
            case "Notificações":
                return <Notification />
            case "Subscrição":
                return <Subscription />
            default:
                return <NotFound />;
        }
    }

    return (
        <ThemeProvider>
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