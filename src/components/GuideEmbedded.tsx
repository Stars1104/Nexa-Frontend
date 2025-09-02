import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { GetGuide } from '../api/admin/guide';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen, Target, Users, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

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

interface GuideEmbeddedProps {
  audience: 'Brand' | 'Creator';
}

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
                    {`Passo ${idx + 1}`}
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
            <video
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
            >
                <source src={`${import.meta.env.VITE_BACKEND_URL}${step.video_url}`} />
                Seu navegador não suporta a tag de vídeo.
            </video>
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
        <span>Siga estes passos para maximizar seu sucesso na Nexa</span>
      </div>
    </div>
  );
}

export default function GuideEmbedded({ audience }: GuideEmbeddedProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const data = await GetGuide();
        setGuides(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Falha ao carregar guias");
        console.error("Error fetching guides:", err);
        toast({
          title: "Erro",
          description: "Falha ao carregar guias da plataforma",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [toast]);

  const guide = guides.find(g => g.audience === audience);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Carregando guias...</h2>
            <p className="text-muted-foreground">Preparando conteúdo exclusivo para você</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-destructive">Erro ao carregar guias</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Guias da Plataforma Nexa
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Domine a plataforma Nexa com nossos guias abrangentes passo a passo projetados especificamente para {audience === 'Brand' ? 'marcas' : 'criadores'}.
        </p>
      </div>

      <section aria-labelledby={`${audience.toLowerCase()}-heading`} className="space-y-8">
        <h2 id={`${audience.toLowerCase()}-heading`} className="sr-only">
          Guia para {audience === 'Brand' ? 'Marcas' : 'Criadores'}
        </h2>
        {guide && guide.steps && guide.steps.length > 0 ? (
          <>
            <GuideHeader guide={guide} role={audience} />
            <StepList steps={guide.steps} role={audience} />
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Guia para {audience === 'Brand' ? 'marcas' : 'criadores'} em desenvolvimento
            </h3>
            <p className="text-muted-foreground mb-4">
              Nossa equipe está trabalhando para criar um guia completo e detalhado para {audience === 'Brand' ? 'marcas' : 'criadores'}.
            </p>
            <p className="text-sm text-muted-foreground">
              {audience === 'Brand' 
                ? 'Em breve você terá acesso a todas as informações necessárias para criar campanhas de sucesso.'
                : 'Em breve você terá acesso a todas as informações necessárias para maximizar seu sucesso na plataforma.'
              }
            </p>
          </div>
        )}
      </section>
    </div>
  );
} 