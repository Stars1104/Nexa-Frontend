import React, { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import GuideCard, {Guide} from "./GuideCard";
import { Button } from "../ui/button";
import GuideCreateDialog from "./GuideCreateDialog";
import GuideEditDialog from "./GuideEditDialog";
import { GetAdminGuides, RemoveGuide } from "@/api/admin/guide";

const NexaGuide: React.FC = () => {
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch guides on component mount
  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const data = await GetAdminGuides();
      setGuides(data.data || data); // Handle both paginated and non-paginated responses
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch guides");
      toast({
        title: "Error",
        description: "Failed to fetch guides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const guideTypes = useMemo(() => Array.from(new Set(guides.map(g => g.audience))).sort(), [guides]);

  const filteredGuides = useMemo(
    () =>
      guides.filter((g) =>
        (brandFilter ? g.audience === brandFilter : true)
      ),
    [guides, brandFilter]
  );

  const handleEdit = (guide: Guide) => {
    setSelectedGuide(guide);
    setIsEditOpen(true);
  };

  const handleRemove = async (guide: Guide) => {
    try {
      await RemoveGuide(guide.id);
      toast({ 
        title: "Guide removed", 
        description: `"${guide.title}" has been removed successfully` 
      });
      // Refresh the guides list
      fetchGuides();
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to remove guide",
        variant: "destructive"
      });
    }
  };

  const handleBrandChange = (val: string) => setBrandFilter(val === "__all__" ? "" : val);

  const handleGuideCreated = () => {
    // Refresh the guides list after creating a new guide
    fetchGuides();
  };

  const handleGuideUpdated = () => {
    // Refresh the guides list after updating a guide
    fetchGuides();
  };

  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filteredGuides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${canonical}#guide-${g.id}`,
      name: g.title,
    })),
  };

  if (loading) {
    return (
      <main className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading guides...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchGuides} variant="outline">Retry</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full p-6">
      <Helmet>
        <title>Guia Nexa – Guias de Marca e Criadores</title>
        <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
        {canonical && <link rel="canonical" href={canonical} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Guia Nexa</h1>
      </header>

      {/* Filters */}
      <section aria-label="Filters" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-end">
          <div className="space-y-2 w-full">
            <Label htmlFor="brandSelect">Guide Type</Label>
            <Select value={brandFilter} onValueChange={handleBrandChange}>
              <SelectTrigger id="brandSelect" className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="__all__">All Types</SelectItem>
                {guideTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex justify-end">
            <Button onClick={() => setIsCreateOpen(true)} className="bg-[#E91E63] text-white">Novo Guia Adicionar</Button>
          </div>
        </div>
      </section>

      {/* Guides List */}
      <section aria-label="Guides" className="space-y-6">
        {filteredGuides.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            onEdit={handleEdit}
            onRemove={handleRemove}
          />)
        )}
        {filteredGuides.length === 0 && (
          <p className="text-center text-muted-foreground">
            {guides.length === 0 ? "No guides found. Create your first guide!" : "No guides match your filters."}
          </p>
        )}
      </section>

      {/* Create Guide Dialog */}
      <GuideCreateDialog 
        isOpen={isCreateOpen} 
        onClose={setIsCreateOpen}
        onSuccess={handleGuideCreated}
      />

      {/* Edit Guide Dialog */}
      {selectedGuide && (
        <GuideEditDialog
          isOpen={isEditOpen}
          onClose={setIsEditOpen}
          guide={selectedGuide}
          onSuccess={handleGuideUpdated}
        />
      )}
    </main>
  );
};

export default NexaGuide;