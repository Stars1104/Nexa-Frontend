import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCreatorApplications } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";
import { toast } from "../ui/sonner";
import { Skeleton } from "../ui/skeleton";

const statusStyles = {
  approved:
    "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
};

const statusLabels = {
  approved: "Aprovado",
  pending: "Aguardando aprovação",
  rejected: "Rejeitado",
};

interface MyApplicationProps {
  setComponent: (component: string) => void;
}

const MyApplication: React.FC<MyApplicationProps> = ({ setComponent }) => {
  const dispatch = useAppDispatch();
  const { creatorApplications, isLoading, error } = useAppSelector(
    (state) => state.campaign
  );

  // Ensure creatorApplications is always an array
  const safeCreatorApplications = Array.isArray(creatorApplications)
    ? creatorApplications
    : [];

  // Fetch creator applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        await dispatch(fetchCreatorApplications()).unwrap();
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast.error("Erro ao carregar aplicações");
      }
    };

    fetchApplications();
  }, [dispatch]);

  // Clear error on component unmount
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const handleComponent = (component: string) => {
    setComponent(component);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-neutral-900 min-h-[92vh]">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Minhas Aplicações
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : safeCreatorApplications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Você ainda não se candidatou a nenhuma campanha.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Explore as campanhas disponíveis e comece a se candidatar!
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <table className="min-w-full text-sm bg-background">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-300">
                    <th className="px-6 py-4 font-semibold">Campanha</th>
                    <th className="px-6 py-4 font-semibold">Marca</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold">Prazo</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {safeCreatorApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-t border-gray-100 dark:border-neutral-700"
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {app.campaign?.title || `Campanha #${app.campaign_id}`}
                      </td>
                      <td className="px-6 py-4 text-indigo-500 dark:text-indigo-300 whitespace-nowrap">
                        {app.campaign?.brand?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.proposed_budget
                          ? `R$${app.proposed_budget}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.estimated_delivery_days
                          ? `${app.estimated_delivery_days} dias`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusStyles[app.status]
                          }`}
                        >
                          {statusLabels[app.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.status === "approved" ? (
                          <button
                            className="text-pink-500 hover:underline font-medium"
                            onClick={() => handleComponent("Chat")}
                          >
                            Acessar Chat
                          </button>
                        ) : (
                          <button
                            className="text-gray-700 dark:text-gray-200 hover:underline font-medium"
                            onClick={() =>
                              handleComponent("Detalhes do Projeto")
                            }
                          >
                            Ver campanha
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {safeCreatorApplications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Campanha
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {app.campaign?.title || `Campanha #${app.campaign_id}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Marca
                  </span>
                  <span className="text-indigo-500 dark:text-indigo-300 font-medium">
                    {app.campaign?.brand?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Valor
                  </span>
                  <span>
                    {app.proposed_budget ? `R$${app.proposed_budget}` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Prazo
                  </span>
                  <span>
                    {app.estimated_delivery_days
                      ? `${app.estimated_delivery_days} dias`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Status
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusStyles[app.status]
                    }`}
                  >
                    {statusLabels[app.status]}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Ações
                  </span>
                  {app.status === "approved" ? (
                    <button
                      className="text-pink-500 hover:underline font-medium"
                      onClick={() => handleComponent("Chat")}
                    >
                      Acessar Chat
                    </button>
                  ) : (
                    <button
                      className="text-gray-700 dark:text-gray-200 hover:underline font-medium"
                      onClick={() => handleComponent("Detalhes do Projeto")}
                    >
                      Ver campanha
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyApplication;
