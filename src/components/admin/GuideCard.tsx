import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Edit3, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Step {
  id: number;
  title: string;
  description: string;
  video_path?: string;
  video_url?: string;
  video_mime?: string;
  order: number;
}

export interface Guide {
  id: number;
  title: string;
  description: string;
  audience: string;
  video_path?: string;
  video_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  steps?: Step[];
}

interface GuideCardProps {
  guide: Guide;
  onEdit: (guide: Guide) => void;
  onRemove: (guide: Guide) => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onEdit, onRemove }) => {
  const videoSrc = guide.video_url;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const sortedSteps = guide.steps?.sort((a, b) => a.order - b.order) || [];

  return (
    <Card id={`guide-${guide.id}`} className="relative">
      {/* Action icons */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(guide)}
          aria-label={`Edit ${guide.title}`}
          className="rounded-md p-1 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(guide)}
          aria-label={`Remove ${guide.title}`}
          className="rounded-md p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold leading-tight">{guide.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{guide.audience}</Badge>
              {guide.steps && guide.steps.length > 0 && (
                <Badge variant="secondary">{guide.steps.length} passos</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-muted-foreground">{guide.description}</p>
        </div>

        {/* Steps Section */}
        {sortedSteps.length > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setStepsExpanded(!stepsExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {stepsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {stepsExpanded ? "Ocultar" : "Mostrar"} {sortedSteps.length} passos
            </button>

            {stepsExpanded && (
              <div className="mt-4 space-y-4">
                {sortedSteps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Passo {index + 1}
                        </Badge>
                        <CardTitle className="text-base leading-tight">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        {step.video_url && (
                          <div>
                            <AspectRatio ratio={16 / 9}>
                              <div className="relative h-full w-full overflow-hidden rounded-md border border-border shadow-sm bg-muted/20">
                                <video
                                  className="h-full w-full object-cover"
                                  controls
                                  playsInline
                                  preload="metadata"
                                  controlsList="nodownload"
                                  disablePictureInPicture
                                >
                                  <source src={`${import.meta.env.VITE_BACKEND_URL}${step.video_url}`} />
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            </AspectRatio>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuideCard;