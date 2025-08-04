import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import { useIsMobile } from "../../hooks/use-mobile";
import { useState } from "react";
import BrandSidebar from "../../components/brand/BrandSidebar";
import BrandDashboard from "../../components/brand/BrandDashboard";
import AllowedCampaigns from "../../components/brand/AllowedCampaigns";
import BrandProfile from "@/components/brand/BrandProfile";
import NotFound from "../NotFound";
import ChatPage from "./ChatPage";
import ViewCreators from "@/components/brand/ViewCreators";
import ViewApplication from "@/components/brand/ViewApplication";
import CreateCampaign from "@/components/brand/CreateCampaign";
import BrandPaymentMethods from "@/components/brand/BrandPaymentMethods";
import Notification from "@/components/Notification";

const Index = () => {
    const isMobile = useIsMobile();

    const [component, setComponent] = useState<string | { name: string; campaign: any }>("Minhas campanhas");

    const CreatorComponent = () => {
        if (typeof component === "string") {
            switch (component) {
                case "Minhas campanhas":
                    return <AllowedCampaigns setComponent={setComponent} />;
                case "Meu perfil":
                    return <BrandProfile />;
                case "Chat":
                    return <ChatPage setComponent={setComponent} />
                case "Nova campanha":
                    return <CreateCampaign />
                case "Pagamentos":
                    return <BrandPaymentMethods />
                case "Notificações":
                    return <Notification />
                default:
                    return <NotFound />;
            }
        } else if (typeof component === "object" && component.name === "Ver aplicação") {
            return <ViewApplication setComponent={setComponent} campaign={component.campaign} />;
        } else if (typeof component === "object" && component.name === "Ver criadores") {
            return <ViewCreators setComponent={setComponent} campaignId={component.campaign?.id} campaignTitle={component.campaign?.title} />;
        } else {
            return <NotFound />;
        }
    }

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-background text-foreground">
                {!isMobile && <BrandSidebar setComponent={setComponent} component={component} />}
                <div className="flex-1 flex flex-col min-w-0">
                    <ComponentNavbar title={typeof component === "string" ? component : component?.name || "Dashboard"} />
                    <main className={`flex-1 overflow-y-auto bg-muted/50 ${isMobile ? 'pb-20' : ''}`}>
                        <CreatorComponent />
                    </main>
                </div>
                {isMobile && <BrandSidebar setComponent={setComponent} component={component} />}
            </div>
        </ThemeProvider>
    );
};

export default Index;