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
import { GuideCreate } from "@/api/admin/guide";
import { Plus, Trash2, GripVertical } from "lucide-react";

/**
 * Validation schemas
 */

const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const stepSchema = z.object({
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
});

const guideSchema = z.object({
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres").max(255, "O título não pode ter mais de 255 caracteres"),
  audience: z.enum(["Brand", "Creator"]),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export type GuideFormValues = z.infer<typeof guideSchema>;
export type StepFormValues = z.infer<typeof stepSchema>;

interface GuideProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSuccess?: () => void;
}

const defaultStep: StepFormValues = {
  title: "",
  description: "",
  videoFile: undefined,
  screenshots: undefined,
};

const defaultValues: Partial<GuideFormValues> = {
  title: "",
  audience: "Brand",
  description: "",
};

const GuideCreateDialog: React.FC<GuideProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<StepFormValues[]>([defaultStep]);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSteps([defaultStep]);
    }
  }, [isOpen, form]);

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
          description: "Você precisa estar logado para criar um guia.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate steps before submission
      if (!validateSteps()) {
        return;
      }

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

      // Debug: Log steps array that will be sent

      // Call the API function with FormData
      const result = await GuideCreate(fd);

      // Only show success toast if we get a successful response
      if (result) {
        toast({
          title: "Guia criado com sucesso!",
          description: "O guia foi salvo no sistema.",
        });

        form.reset(); // resets to defaults
        setSteps([defaultStep]);
        onClose(false);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }

    } catch (error: any) {
      console.error("Guide Create Error:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      
      let errorMessage = "Tente novamente.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Não autorizado. Verifique se você está logado.";
      } else if (error?.response?.status === 422) {
        errorMessage = "Dados inválidos. Verifique os campos do formulário.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Erro do servidor. Tente novamente mais tarde.";
      }
      
      toast({
        title: "Erro ao criar guia",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Guia</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ---- Guia Details ---- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Detalhes do guia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="ex.: Guia Nexa para Marcas de Vestuário" {...field} />
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
                      <FormLabel>Público</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Selecionar público">
                            <SelectValue placeholder="Selecione o público" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Brand">Marca</SelectItem>
                          <SelectItem value="Creator">Criador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o guia em detalhes..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ---- Steps Management ---- */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Passos do Guia</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Passo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Passo {index + 1}</span>
                      </div>
                      {steps.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Título do Passo</label>
                          <Input
                            placeholder="ex.: Definir Objetivo da Campanha"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descrição</label>
                          <Textarea
                            placeholder="Explicar o que este passo faz e por que é importante"
                            value={step.description}
                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Vídeo do Passo (opcional)</label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              updateStep(index, 'videoFile', file || undefined);
                            }}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Tamanho máximo: 80MB. MP4 recomendado.
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Screenshots do Passo (opcional)</label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.currentTarget.files || []);
                              updateStep(index, 'screenshots', files.length > 0 ? files : undefined);
                            }}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Múltiplas imagens permitidas. Máximo 10MB cada. PNG/JPG recomendado.
                          </p>
                          {step.screenshots && step.screenshots.length > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              {step.screenshots.length} screenshot(s) selecionado(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <DialogFooter className="flex items-center gap-3">
              <Button type="submit">Salvar Guia</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSteps([defaultStep]);
                }}
              >
                Redefinir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GuideCreateDialog;