import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { GetGuide } from "@/api/admin/guide";
import { 
  BookOpen, 
  Users, 
  Target, 
  MessageSquare, 
  UserPlus, 
  PlusCircle, 
  CheckCircle,
  ChevronRight,
  Home,
  Image,
  Play,
  Menu
} from "lucide-react";

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

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  guides: Guide[];
}

function DocumentationSidebar({ sections, activeSection, onSectionChange }: {
  sections: DocSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}) {
  return (
    <div className="hidden md:block fixed top-[80px] left-0 w-80 bg-muted/30 border-r h-[calc(100vh-80px)] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Documentação
        </h2>
        
        <nav className="space-y-2">
          <Button
            variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSectionChange('overview')}
          >
            <Home className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
          
          {sections.map((section) => (
            <div key={section.id}>
              <Button
                variant={activeSection === section.id ? 'secondary' : 'ghost'}
                className="w-full justify-start font-medium"
                onClick={() => onSectionChange(section.id)}
              >
                {section.icon}
                {section.title}
              </Button>
              
              {activeSection === section.id && section.guides.length > 0 && (
                <div className="ml-6 mt-2 space-y-1">
                  {section.guides.map((guide) => (
                    <Button
                      key={guide.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onSectionChange(`guide-${guide.id}`)}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {guide.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

function MobileSidebar({ sections, activeSection, onSectionChange }: {
  sections: DocSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden fixed top-[88px] left-1/2 -translate-x-1/2 w-full max-w-4xl z-40 px-4">
      <Button variant="outline" className="w-full justify-center gap-2" onClick={() => setOpen(!open)}>
        <Menu className="h-4 w-4" />
        Navegação da Documentação
      </Button>
      {open && (
        <div className="mt-2 rounded-md border bg-background shadow-sm p-4 space-y-2">
          <Button
            variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => { setOpen(false); onSectionChange('overview'); }}
          >
            <Home className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <Button
                variant={activeSection === section.id ? 'secondary' : 'ghost'}
                className="w-full justify-start font-medium"
                onClick={() => { setOpen(false); onSectionChange(section.id); }}
              >
                {section.icon}
                {section.title}
              </Button>
              {activeSection === section.id && section.guides.length > 0 && (
                <div className="ml-4">
                  {section.guides.map((guide) => (
                    <Button
                      key={guide.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setOpen(false); onSectionChange(`guide-${guide.id}`); }}
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {guide.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-[112px] px-4 md:px-0">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Documentação da Plataforma Nexa
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Guias completos para marcas e criadores maximizarem o sucesso na plataforma Nexa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Para Marcas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aprenda a criar campanhas eficazes, gerenciar criadores e maximizar o ROI.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Registro e configuração
              </li>
              <li className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                Criação de campanhas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                Aprovação de criadores
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                Comunicação efetiva
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Para Criadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Descubra como otimizar seu perfil, candidatar-se a campanhas e entregar conteúdo de qualidade.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Registro e perfil
              </li>
              <li className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                Candidatura a campanhas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                Criação de conteúdo
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                Comunicação profissional
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuideContent({ guide }: { guide: Guide }) {
  const [currentScreenshot, setCurrentScreenshot] = useState<{[stepId: number]: number}>({});

  const nextScreenshot = (stepId: number, maxIndex: number) => {
    setCurrentScreenshot(prev => ({
      ...prev,
      [stepId]: Math.min((prev[stepId] || 0) + 1, maxIndex - 1)
    }));
  };

  const prevScreenshot = (stepId: number) => {
    setCurrentScreenshot(prev => ({
      ...prev,
      [stepId]: Math.max((prev[stepId] || 0) - 1, 0)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-[112px] px-4 md:px-0">
      <div className="space-y-4">
        <Badge variant="secondary" className="mb-2">
          {guide.audience === 'Brand' ? 'Para Marcas' : 'Para Criadores'}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{guide.title}</h1>
        <p className="text-xl text-muted-foreground">{guide.description}</p>
      </div>

      <Separator />

      {guide.steps && guide.steps.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Passos</h2>
          
          {guide.steps
            .sort((a, b) => a.order - b.order)
            .map((step, idx) => (
              <div key={step.id} className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Media Content */}
                    <div className="space-y-4">
                      {/* Screenshots */}
                      {step.screenshot_urls && step.screenshot_urls.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Screenshots
                          </h4>
                          <div className="relative">
                            <img
                              src={step.screenshot_urls[currentScreenshot[step.id] || 0]}
                              alt={`${step.title} - Screenshot ${(currentScreenshot[step.id] || 0) + 1}`}
                              className="w-full md:max-w-2xl rounded-lg border shadow-sm"
                            />
                            
                            {step.screenshot_urls.length > 1 && (
                              <div className="flex items-center justify-between mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => prevScreenshot(step.id)}
                                  disabled={(currentScreenshot[step.id] || 0) === 0}
                                >
                                  Anterior
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {(currentScreenshot[step.id] || 0) + 1} de {step.screenshot_urls.length}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => nextScreenshot(step.id, step.screenshot_urls!.length)}
                                  disabled={(currentScreenshot[step.id] || 0) === step.screenshot_urls.length - 1}
                                >
                                  Próximo
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Video */}
                      {step.video_url && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Vídeo Tutorial
                          </h4>
                          <video
                            src={step.video_url}
                            controls
                            className="w-full md:max-w-2xl rounded-lg border shadow-sm"
                          >
                            Seu navegador não suporta vídeos.
                          </video>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {idx < guide.steps.length - 1 && <Separator className="my-8" />}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function Documentation() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(section || 'overview');

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

  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    navigate(`/docs/${sectionId}`, { replace: true });
  };

  // Organize guides by topic
  const sections: DocSection[] = [
    {
      id: 'brand-registration',
      title: 'Registro de Marca',
      icon: <UserPlus className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Brand' && g.title.toLowerCase().includes('registro'))
    },
    {
      id: 'brand-campaigns',
      title: 'Criação de Campanhas',
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Brand' && g.title.toLowerCase().includes('campanha'))
    },
    {
      id: 'brand-approval',
      title: 'Aprovação de Criadores',
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Brand' && g.title.toLowerCase().includes('aprovar'))
    },
    {
      id: 'brand-chat',
      title: 'Comunicação (Marcas)',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Brand' && g.title.toLowerCase().includes('comunicação'))
    },
    {
      id: 'creator-registration',
      title: 'Registro de Criador',
      icon: <UserPlus className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Creator' && g.title.toLowerCase().includes('registro'))
    },
    {
      id: 'creator-campaigns',
      title: 'Candidatura a Campanhas',
      icon: <Target className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Creator' && g.title.toLowerCase().includes('candidatar'))
    },
    {
      id: 'creator-content',
      title: 'Criação de Conteúdo',
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Creator' && g.title.toLowerCase().includes('conteúdo'))
    },
    {
      id: 'creator-chat',
      title: 'Comunicação (Criadores)',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      guides: guides.filter(g => g.audience === 'Creator' && g.title.toLowerCase().includes('comunicação'))
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p>Carregando documentação...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }

    if (activeSection === 'overview') {
      return <OverviewContent />;
    }

    // Check if it's a specific guide
    if (activeSection.startsWith('guide-')) {
      const guideId = parseInt(activeSection.replace('guide-', ''));
      const guide = guides.find(g => g.id === guideId);
      if (guide) {
        return <GuideContent guide={guide} />;
      }
    }

    // Check if it's a section with guides
    const section = sections.find(s => s.id === activeSection);
    if (section && section.guides.length > 0) {
      return (
        <div className="max-w-4xl mx-auto space-y-8 mt-[112px] px-4 md:px-0">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              {section.icon}
              {section.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {section.guides.length} guia(s) disponível(is) nesta categoria.
            </p>
          </div>

          <div className="space-y-6">
            {section.guides.map((guide) => (
              <Card key={guide.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSectionChange(`guide-${guide.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {guide.title}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{guide.description}</p>
                  {guide.steps && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {guide.steps.length} passos
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-semibold">Seção não encontrada</h1>
        <p className="text-muted-foreground">A seção solicitada não existe ou não possui conteúdo.</p>
        <Button onClick={() => handleSectionChange('overview')} variant="outline">
          Voltar à visão geral
        </Button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <MobileSidebar sections={sections} activeSection={activeSection} onSectionChange={handleSectionChange} />
      <div className="flex min-h-screen">
        <DocumentationSidebar 
          sections={sections} 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange} 
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto md:ml-96">
          {renderContent()}
        </main>
      </div>
    </>
  );
} 