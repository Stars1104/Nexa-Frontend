import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Briefcase, FileText, CreditCard } from "lucide-react";
import ContractList from "./ContractList";
import BrandPaymentMethods from "./BrandPaymentMethods";

const campaigns = {
  ongoing: [
    {
      id: 1,
      image: "/placeholder.svg",
      title: "Beauty Product Launch",
      subtitle: "Natural beauty",
      tags: ["Photo", "Video"],
      term: "15/12/2023",
      creators: "12/5 creators",
      actions: ["Ver Aplicações", "Chat"],
    },
    {
      id: 2,
      image: "/placeholder.svg",
      title: "Summer Campaign 2024",
      subtitle: "Fashion Brazil",
      tags: ["Review", "Video"],
      term: "20/12/2023",
      creators: "8/3 creators",
      actions: ["Ver Aplicações", "Chat"],
    },
    {
      id: 3,
      image: "/placeholder.svg",
      title: "Summer Campaign 2024",
      subtitle: "Fashion Brazil",
      tags: ["Review", "Video", "Photo"],
      term: "20/12/2023",
      creators: "8/3 creators",
      actions: ["Ver Aplicações", "Chat"],
    },
  ],
  previous: [
    {
      id: 4,
      image: "/placeholder.svg",
      title: "Fitness App Disclosure",
      subtitle: "FitLife",
      tags: ["Photo", "Video", "Review"],
      term: "20/11/2023",
      creators: "8 creators",
      actions: ["Ver Conversas"],
    },
  ],
};

const tagColors: Record<string, string> = {
  Photo:
    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200",
  Video: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200",
  Review: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200",
};

interface BrandDashboardProps {
  setComponent?: (component: string) => void;
}

const BrandDashboard: React.FC<BrandDashboardProps> = ({ setComponent }) => {
  return (
    <div className="p-6 md:p-10 dark:bg-[#171717] min-h-[92vh]">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
        Bem-vindo, Awesome Brand <span>👋</span>
      </h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        Gerencie suas campanhas e conecte-se com criadores incríveis!
      </p>

      {/* Tabs for Campaigns, Contracts, and Payment Methods */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Ongoing Campaigns */}
          <h2 className="text-lg md:text-xl font-semibold mb-3">
            Campanhas em andamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {campaigns.ongoing.map((c) => (
              <div
                key={c.id}
                className="bg-background rounded-xl shadow-sm border border-mute p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.image}
                    alt="campaign"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                  <div>
                    <div className="font-semibold text-base md:text-lg text-black dark:text-white">
                      {c.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${tagColors[tag]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                      />
                    </svg>
                    Prazo: {c.term}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m14-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                      />
                    </svg>
                    {c.creators}
                  </span>
                </div>
                <div className="flex gap-3 mt-2 md:flex-row flex-col">
                  <button
                    className="flex-1 border-2 border-[#E91E63] text-[#E91E63] rounded-lg py-2 transition hover:bg-[#E91E63] hover:text-white"
                    onClick={() => setComponent("Ver aplicação")}
                  >
                    <svg
                      className="inline mr-2"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M2 12C3.6 7 7.8 4 12 4s8.4 3 10 8c-1.6 5-5.8 8-10 8s-8.4-3-10-8Z"
                      />
                    </svg>
                    Ver aplicativos
                  </button>
                  <button
                    className="flex-1 bg-[#E91E63] text-white font-medium rounded-lg py-2 transition hover:bg-[#E91E63]"
                    onClick={() => setComponent("Chat")}
                  >
                    <svg
                      className="inline mr-2"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
                      />
                    </svg>
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Previous Campaigns */}
          <h2 className="text-lg md:text-xl font-semibold mb-3">
            Campanhas anteriores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {campaigns.previous.map((c) => (
              <div
                key={c.id}
                className="bg-background rounded-xl shadow-sm border border-mute p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.image}
                    alt="campaign"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                  <div>
                    <div className="font-semibold text-base md:text-lg text-black dark:text-white">
                      {c.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${tagColors[tag]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                      />
                    </svg>
                    Prazo: {c.term}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m14-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                      />
                    </svg>
                    {c.creators}
                  </span>
                </div>
                <div className="mt-2">
                  <button
                    className="w-full bg-[#E91E63] text-white font-medium rounded-lg py-2 transition flex items-center justify-center"
                    onClick={() => setComponent("Chat")}
                  >
                    <svg
                      className="inline mr-2"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
                      />
                    </svg>
                    Ver conversas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <ContractList />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <BrandPaymentMethods />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandDashboard;
