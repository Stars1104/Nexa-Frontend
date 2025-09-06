import { ThemeProvider } from "../../components/ThemeProvider";
import ComponentNavbar from "../../components/ComponentNavbar";
import { useIsMobile } from "../../hooks/use-mobile";
import { useAdvancedComponentNavigation } from "../../hooks/useAdvancedComponentNavigation";
import { usePostLoginNavigation } from "../../hooks/usePostLoginNavigation";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
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
import CreatorProfile from "@/components/brand/CreatorProfile";
import GuideEmbedded from "@/components/GuideEmbedded";
import { Helmet } from "react-helmet-async";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

function Index() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const { component, setComponent } = useAdvancedComponentNavigation({
    defaultComponent: "Minhas campanhas",
  });

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  // Handle post-login navigation to ensure proper browser history
  usePostLoginNavigation({
    dashboardPath: "/brand",
    defaultComponent: "Minhas campanhas",
  });

  const CreatorComponent = () => {
    if (typeof component === "string") {
      switch (component) {
        case "Minhas campanhas":
          return <AllowedCampaigns setComponent={setComponent} />;
        case "Meu perfil":
          return <BrandProfile />;
        case "Chat":
          return <ChatPage setComponent={setComponent} />;
        case "Nova campanha":
          return <CreateCampaign />;
        case "Pagamentos":
          return (
            <Elements stripe={stripePromise}>
              <BrandPaymentMethods />
            </Elements>
          );
        case "Notificações":
          return <Notification />;
        case "Perfil do Criador":
          return <CreatorProfile setComponent={setComponent} />;
        case "Guia da Plataforma":
          return <GuideEmbedded audience="Brand" />;
        default:
          return <NotFound />;
      }
    } else if (
      typeof component === "object" &&
      component.name === "Ver aplicação"
    ) {
      return (
        <ViewApplication
          setComponent={setComponent}
          campaign={component.campaign}
        />
      );
    } else if (
      typeof component === "object" &&
      component.name === "Ver criadores"
    ) {
      return (
        <ViewCreators
          setComponent={setComponent}
          campaignId={component.campaign?.id}
          campaignTitle={component.campaign?.title}
        />
      );
    } else if (
      typeof component === "object" &&
      component.name === "Perfil do Criador"
    ) {
      return (
        <CreatorProfile
          setComponent={setComponent}
          creatorId={(component as any).creatorId}
        />
      );
    } else if (typeof component === "object" && component.name === "Chat") {
      return (
        <ChatPage
          setComponent={setComponent}
          campaignId={component.campaign?.id}
          creatorId={component.creatorId}
        />
      );
    } else {
      return <NotFound />;
    }
  };

  return (
    <ThemeProvider>
      <Helmet>
        <title>
          {typeof component === "string"
            ? `${component} - Nexa Brand`
            : `${component?.name || "Dashboard"} - Nexa Brand`}
        </title>
        <meta
          name="description"
          content="Painel da marca na plataforma Nexa - Gerencie suas campanhas, criadores e pagamentos"
        />
      </Helmet>
      <div className="flex h-screen bg-background text-foreground">
        {!isMobile && (
          <BrandSidebar setComponent={setComponent} component={component} />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <ComponentNavbar
            title={
              typeof component === "string"
                ? component
                : component?.name || "Dashboard"
            }
          />
          <main className={`flex-1 overflow-y-auto bg-muted/50`}>
            <CreatorComponent />
          </main>
        </div>
        {isMobile && (
          <BrandSidebar setComponent={setComponent} component={component} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default Index;
