import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { hiringApi, Contract } from "@/api/hiring";
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  User,
} from "lucide-react";
import ContractCard from "./ContractCard";
import PaymentModal from "./PaymentModal";
import ReviewModal from "./ReviewModal";
import DeliveryMaterials from "./DeliveryMaterials";

export default function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, activeTab, statusFilter, searchTerm]);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const response = await hiringApi.getContracts();
      setContracts(response.data.data);
    } catch (error) {
      console.error("Error loading contracts:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contratos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = [...contracts];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (contract) => contract.status === statusFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.other_user?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
  };

  const handleContractUpdated = () => {
    loadContracts();
  };

  const handleCompleteContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowPaymentModal(true);
  };

  const handleReviewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowReviewModal(true);
  };

  const handleRenewalOffer = (contract: Contract) => {
    // This will be handled by the parent component (ChatPage)
    // For now, we'll just show a toast message
    toast({
      title: "Oferta de Renovação",
      description: "Use o chat para enviar uma nova oferta de renovação.",
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      completed: contracts.filter((c) => c.status === "completed").length,
      cancelled: contracts.filter((c) => c.status === "cancelled").length,
      disputed: contracts.filter((c) => c.status === "disputed").length,
    };
    return counts;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "disputed":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando contratos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meus Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="disputed">Em Disputa</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadContracts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Todos
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ativos
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.active}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Concluídos
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.completed}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancelados
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.cancelled}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="disputed" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Disputas
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.disputed}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Materiais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4">
                {filteredContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum contrato encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm || statusFilter !== "all"
                        ? "Tente ajustar os filtros de busca"
                        : "Você ainda não tem contratos. Envie ofertas para começar!"}
                    </p>
                  </div>
                ) : (
                  filteredContracts.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onContractUpdated={handleContractUpdated}
                      onComplete={handleCompleteContract}
                      onReview={handleReviewContract}
                      onRenewalOffer={handleRenewalOffer}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <div className="grid gap-4">
                {filteredContracts.filter((c) => c.status === "active")
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum contrato ativo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você não tem contratos em andamento no momento.
                    </p>
                  </div>
                ) : (
                  filteredContracts
                    .filter((c) => c.status === "active")
                    .map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onContractUpdated={handleContractUpdated}
                        onComplete={handleCompleteContract}
                        onReview={handleReviewContract}
                        onRenewalOffer={handleRenewalOffer}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-4">
                {filteredContracts.filter((c) => c.status === "completed")
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum contrato concluído
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você ainda não concluiu nenhum contrato.
                    </p>
                  </div>
                ) : (
                  filteredContracts
                    .filter((c) => c.status === "completed")
                    .map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onContractUpdated={handleContractUpdated}
                        onComplete={handleCompleteContract}
                        onReview={handleReviewContract}
                        onRenewalOffer={handleRenewalOffer}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              <div className="grid gap-4">
                {filteredContracts.filter((c) => c.status === "cancelled")
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum contrato cancelado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você não tem contratos cancelados.
                    </p>
                  </div>
                ) : (
                  filteredContracts
                    .filter((c) => c.status === "cancelled")
                    .map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onContractUpdated={handleContractUpdated}
                        onComplete={handleCompleteContract}
                        onReview={handleReviewContract}
                        onRenewalOffer={handleRenewalOffer}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="disputed" className="mt-6">
              <div className="grid gap-4">
                {filteredContracts.filter((c) => c.status === "disputed")
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Nenhuma disputa
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você não tem contratos em disputa.
                    </p>
                  </div>
                ) : (
                  filteredContracts
                    .filter((c) => c.status === "disputed")
                    .map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onContractUpdated={handleContractUpdated}
                        onComplete={handleCompleteContract}
                        onReview={handleReviewContract}
                        onRenewalOffer={handleRenewalOffer}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="mt-6">
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Gerenciar Materiais de Entrega
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Selecione um contrato ativo para visualizar e gerenciar os materiais de entrega.
                  </p>
                  
                  <div className="grid gap-4 max-w-2xl mx-auto">
                    {filteredContracts
                      .filter((c) => c.status === "active")
                      .map((contract) => (
                        <div
                          key={contract.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            // This will be handled by the parent component
                            // For now, just show a message
                            toast({
                              title: "Funcionalidade em Desenvolvimento",
                              description: "A gestão de materiais de entrega será implementada em breve.",
                            });
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{contract.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Criador: {contract.other_user?.name || 'N/A'}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Gerenciar Materiais
                            </Button>
                          </div>
                        </div>
                      ))}
                    
                    {filteredContracts.filter((c) => c.status === "active").length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          Você não tem contratos ativos para gerenciar materiais.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedContract && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
          onPaymentProcessed={handleContractUpdated}
        />
      )}

      {/* Review Modal */}
      {selectedContract && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
          onReviewSubmitted={handleContractUpdated}
        />
      )}
    </div>
  );
}
