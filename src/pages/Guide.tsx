import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/landing/Footer";
import { GetGuide } from "@/api/admin/guide";
import { Button } from "@/components/ui/button";
import { Loader2, Play, AlertCircle, BookOpen, Users, Target, TrendingUp, Image, ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  video_path?: string;
  video_url?: string;
  video_mime?: string;
  screenshots?: string[];
  screenshot_urls?: string[];
  order: number;
}

interface Guide {
  id: number;
  title: string;
  description: string;
  audience: string;
  video_path?: string;
  video_url?: string;
  screenshots?: string[];
  screenshot_urls?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
  steps?: Step[];
}

function usePageSEO() {
  useEffect(() => {
    const title = "Nexa Creator Playbook – Guides for Brands & Creators";
    const description = "Step-by-step Nexa guides for brands and creators with video walkthroughs and best-practice settings.";
    
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Nexa Platform Guides",
      "description": description,
      "itemListElement": [
        {
          "@type": "HowTo",
          "name": "Nexa Guide for Brands",
          "description": "Complete guide for brands to create and manage successful campaigns on Nexa platform"
        },
        {
          "@type": "HowTo", 
          "name": "Nexa Guide for Creators",
          "description": "Complete guide for creators to maximize success and deliver high-quality content on Nexa platform"
        }
      ]
    };
    
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, []);
}

const MediaSlot = ({ step, label }: { step: Step; label: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [mediaType, setMediaType] = useState<'video' | 'screenshots'>('video');

  const hasVideo = !!step.video_url;
  const hasScreenshots = !!step.screenshot_urls && step.screenshot_urls.length > 0;

  // Default to screenshots if available, otherwise video
  useEffect(() => {
    if (hasScreenshots) {
      setMediaType('screenshots');
    } else if (hasVideo) {
      setMediaType('video');
    }
  }, [hasScreenshots, hasVideo]);

  const nextScreenshot = () => {
    if (step.screenshot_urls && currentScreenshot < step.screenshot_urls.length - 1) {
      setCurrentScreenshot(currentScreenshot + 1);
    }
  };

  const prevScreenshot = () => {
    if (currentScreenshot > 0) {
      setCurrentScreenshot(currentScreenshot - 1);
    }
  };

  if (!hasVideo && !hasScreenshots) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] bg-muted rounded-lg">
        <div className="text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No media available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-3">
      {/* Media Type Toggle */}
      {hasVideo && hasScreenshots && (
        <div className="flex gap-2 justify-center">
          <Button
            variant={mediaType === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMediaType('video')}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Video
          </Button>
          <Button
            variant={mediaType === 'screenshots' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMediaType('screenshots')}
            className="flex items-center gap-2"
          >
            <Image className="h-4 w-4" />
            Screenshots
          </Button>
        </div>
      )}

      <AspectRatio ratio={16 / 9} className="h-full">
        <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
          {mediaType === 'video' && hasVideo ? (
            <>
              {!isPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={() => setIsPlaying(true)}
                    size="lg"
                    className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </Button>
                </div>
              ) : (
                <video
                  src={step.video_url}
                  controls
                  className="w-full h-full object-cover"
                  onError={() => setError("Failed to load video")}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </>
          ) : hasScreenshots && step.screenshot_urls ? (
            <>
              <img
                src={step.screenshot_urls[currentScreenshot]}
                alt={`${step.title} - Screenshot ${currentScreenshot + 1}`}
                className="w-full h-full object-contain"
                onError={() => setError("Failed to load screenshot")}
              />
              
              {/* Screenshot Navigation */}
              {step.screenshot_urls.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
                    onClick={prevScreenshot}
                    disabled={currentScreenshot === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
                    onClick={nextScreenshot}
                    disabled={currentScreenshot === step.screenshot_urls.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Screenshot Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {currentScreenshot + 1} / {step.screenshot_urls.length}
                  </div>
                </>
              )}
            </>
          ) : null}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
        </div>
      </AspectRatio>
    </div>
  );
};

function StepList({ steps, role }: { steps: Step[]; role: "Brand" | "Creator" }) {
  const sortedSteps = steps.sort((a, b) => a.order - b.order);

  return (
    <section aria-label={`${role} steps`} className="space-y-6">
      {sortedSteps.map((step, idx) => (
        <article
          key={step.id}
          className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6"
        >
          <div className="md:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {`Step ${idx + 1}`}
                  </Badge>
                  <CardTitle className="leading-tight text-lg">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <MediaSlot step={step} label={`${role} – Step ${idx + 1}`} />
          </div>
        </article>
      ))}
    </section>
  );
}

function GuideHeader({ guide, role }: { guide: Guide; role: "Brand" | "Creator" }) {
  const icon = role === "Brand" ? <Target className="h-6 w-6" /> : <Users className="h-6 w-6" />;
  
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="flex items-center justify-center gap-3">
        {icon}
        <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
      </div>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        {guide.description}
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>Follow these steps to maximize your success on Nexa</span>
      </div>
    </div>
  );
}

export default function Guides() {
  usePageSEO();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultTab = useMemo(() => "brands", []);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const data = await GetGuide();
        setGuides(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch guides");
        console.error("Error fetching guides:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const brandGuides = guides.filter(g => g.audience === 'Brand');
  const creatorGuides = guides.filter(g => g.audience === 'Creator');

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen mt-[88px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Carregando guias...</h2>
              <p className="text-muted-foreground">Preparando conteúdo exclusivo para você</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-destructive">Erro ao carregar guias</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="w-full mx-auto max-w-7xl px-4 py-8 pb-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Nexa Platform Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Master the Nexa platform with our comprehensive step-by-step guides designed specifically for brands and creators.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Guia para Marcas
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guia para Criadores
            </TabsTrigger>
          </TabsList>

          <Separator className="my-8" />

          <TabsContent value="brands" asChild>
            <section aria-labelledby="brands-heading" className="space-y-8">
              <h2 id="brands-heading" className="sr-only">
                Guide for Brands
              </h2>
              {brandGuides && brandGuides.length > 0 ? (
                <div className="space-y-12">
                  {brandGuides.map((guide) => (
                    <div key={guide.id} className="space-y-8">
                      <GuideHeader guide={guide} role="Brand" />
                      {guide.steps && guide.steps.length > 0 && (
                        <StepList steps={guide.steps} role="Brand" />
                      )}
                      {guide.id !== brandGuides[brandGuides.length - 1].id && (
                        <Separator className="my-12" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Guias para marcas em desenvolvimento</h3>
                  <p className="text-muted-foreground mb-4">
                    Nossa equipe está trabalhando para criar guias completos e detalhados para marcas.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Em breve você terá acesso a todas as informações necessárias para criar campanhas de sucesso.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="creators" asChild>
            <section aria-labelledby="creators-heading" className="space-y-8">
              <h2 id="creators-heading" className="sr-only">
                Guide for Creators
              </h2>
              {creatorGuides && creatorGuides.length > 0 ? (
                <div className="space-y-12">
                  {creatorGuides.map((guide) => (
                    <div key={guide.id} className="space-y-8">
                      <GuideHeader guide={guide} role="Creator" />
                      {guide.steps && guide.steps.length > 0 && (
                        <StepList steps={guide.steps} role="Creator" />
                      )}
                      {guide.id !== creatorGuides[creatorGuides.length - 1].id && (
                        <Separator className="my-12" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Guias para criadores em desenvolvimento</h3>
                  <p className="text-muted-foreground mb-4">
                    Nossa equipe está trabalhando para criar guias completos e detalhados para criadores.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Em breve você terá acesso a todas as informações necessárias para maximizar seu sucesso na plataforma.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Footer/>
    </>
  );
}