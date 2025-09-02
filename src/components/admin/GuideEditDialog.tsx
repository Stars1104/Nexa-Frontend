import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UpdateGuide } from "@/api/admin/guide";
import { Plus, Trash2, GripVertical, Play, Image } from "lucide-react";
import { Label } from "@/components/ui/label";

/**
 * Validation schemas
 */

const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const stepSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres").max(255, "O título não pode ter mais de 255 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  videoFile: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_VIDEO_BYTES, {
      message: "O vídeo deve ter no máximo 80MB",
    })
    .refine((file) => !file || file.type.startsWith("video/"), {
      message: "Apenas arquivos de vídeo são permitidos",
    }),
  screenshots: z
    .array(z.instanceof(File))
    .optional()
    .refine((files) => !files || files.every(file => file.size <= MAX_IMAGE_BYTES), {
      message: "Cada screenshot deve ter no máximo 10MB",
    })
    .refine((files) => !files || files.every(file => file.type.startsWith("image/")), {
      message: "Apenas arquivos de imagem são permitidos",
    }),
  video_url: z.string().optional(),
  video_path: z.string().optional(),
  screenshot_urls: z.array(z.string()).optional(),
});

const guideSchema = z.object({
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres").max(255, "O título não pode ter mais de 255 caracteres"),
  audience: z.enum(["Brand", "Creator"]),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export type GuideFormValues = z.infer<typeof guideSchema>;
export type StepFormValues = z.infer<typeof stepSchema>;

interface GuideEditDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  guide: any;
  onSuccess?: () => void;
}

const defaultStep: StepFormValues = {
  title: "",
  description: "",
  videoFile: undefined,
  screenshots: undefined,
};

const GuideEditDialog: React.FC<GuideEditDialogProps> = ({ isOpen, onClose, guide, onSuccess }) => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<StepFormValues[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen && guide) {
      // Reset form with guide data
      form.reset({
        title: guide.title,
        audience: guide.audience as "Brand" | "Creator",
        description: guide.description,
      });

      // Set steps with existing data
      if (guide.steps && guide.steps.length > 0) {
        const sortedSteps = [...guide.steps].sort((a: any, b: any) => a.order - b.order);
        setSteps(sortedSteps.map((step: any) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          video_url: step.video_url,
          video_path: step.video_path,
          screenshot_urls: step.screenshot_urls,
          videoFile: undefined,
          screenshots: undefined,
        })));
      } else {
        setSteps([defaultStep]);
      }
    }
  }, [isOpen, guide, form]);

  const addStep = () => {
    setSteps([...steps, { ...defaultStep }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
    }
  };

  const updateStep = (index: number, field: keyof StepFormValues, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const validateSteps = (): boolean => {
    // Validate steps manually
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.title || step.title.length < 2) {
        toast({
          title: "Erro de validação",
          description: `Passo ${i + 1}: O título deve ter pelo menos 2 caracteres`,
          variant: "destructive",
        });
        return false;
      }
      if (!step.description || step.description.length < 10) {
        toast({
          title: "Erro de validação",
          description: `Passo ${i + 1}: A descrição deve ter pelo menos 10 caracteres`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (values: GuideFormValues) => {
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para editar um guia.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate steps before submission
      if (!validateSteps()) {
        return;
      }

      setLoading(true);

      // Build FormData because your backend expects multipart/form-data with file
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("audience", values.audience);
      fd.append("description", values.description);

      steps.forEach((step, index) => {
        fd.append(`steps[${index}][title]`, step.title);
        fd.append(`steps[${index}][description]`, step.description);
        if (step.videoFile && step.videoFile instanceof File && step.videoFile.size > 0) {
          fd.append(`steps[${index}][videoFile]`, step.videoFile);
        }
      });

      // Call the API function with FormData
      const result = await UpdateGuide(guide.id, {
        title: values.title,
        audience: values.audience,
        description: values.description,
        steps: steps,
      });

      // Show success toast
      toast({
        title: "Guia atualizado com sucesso!",
        description: "O guia foi atualizado no sistema.",
      });

      onClose(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error("Guide Update Error:", error);
      toast({
        title: "Erro ao atualizar guia",
        description: error.message || "Ocorreu um erro ao atualizar o guia. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Guia: {guide?.title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Guide Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Guia</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título do guia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público-Alvo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o público-alvo" />
                        </SelectTrigger>
                      </FormControl>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Guia</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a descrição do guia"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Steps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Passos do Guia</h3>
                <Button
                  type="button"
                  onClick={addStep}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Passo
                </Button>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Passo {index + 1}</CardTitle>
                        {steps.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeStep(index)}
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Título do Passo</Label>
                          <Input
                            placeholder="Digite o título do passo"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Vídeo do Passo (opcional)</Label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateStep(index, 'videoFile', file);
                              }
                            }}
                          />
                          {step.video_url && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Play className="h-4 w-4" />
                              Vídeo atual: {step.video_url.split('/').pop()}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Screenshots do Passo (opcional)</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              updateStep(index, 'screenshots', files.length > 0 ? files : undefined);
                            }}
                          />
                          {step.screenshot_urls && step.screenshot_urls.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Image className="h-4 w-4" />
                              {step.screenshot_urls.length} screenshot(s) atual(is)
                            </div>
                          )}
                          {step.screenshots && step.screenshots.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Image className="h-4 w-4" />
                              {step.screenshots.length} novo(s) screenshot(s) selecionado(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Descrição do Passo</Label>
                        <Textarea
                          placeholder="Digite a descrição do passo"
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar Guia"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GuideEditDialog; 