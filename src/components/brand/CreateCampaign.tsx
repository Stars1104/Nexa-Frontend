import React, { useRef, useState, useCallback, useEffect } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { toast } from "../ui/sonner";
import { useIsMobile } from "../../hooks/use-mobile";
import { cn } from "../../lib/utils";
import { Calendar as CalendarIcon, UploadCloud, X, PlusCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { createCampaign } from "../../store/thunks/campaignThunks";
import { clearError } from "../../store/slices/campaignSlice";

// Campaign types
const CAMPAIGN_TYPES = [
  "Vídeo", "Foto", "Review", "Unboxing", "Tutorial", "Story", "Reels", "Post"
];

// Brazilian states
const BRAZILIAN_STATES = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins"
];

// Example states and requirements (should come from API in real app)
const REQUIREMENTS = [
  "Instagram", "TikTok", "YouTube", "+10k seguidores", "Portfólio", "Vídeo", "Foto"
];

export default function CreateCampaign() {
  const dispatch = useDispatch<AppDispatch>();
  const { isCreating, error } = useSelector((state: RootState) => state.campaign);
  
  // Form reset function - memoized to prevent unnecessary re-renders
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setBudget("");
    setDeadline(undefined);
    setSelectedStates([]);
    setFile(null);
    setImagePreview(null);
    setCreatorReq("");
    setCampaignType("");
    setAttachments([]);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
    };
  }, []);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [creatorReq, setCreatorReq] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Safe toast function with error handling
  const safeToast = useCallback((type: 'error' | 'success', message: string) => {
    try {
      if (type === 'error') {
        toast.error(message);
      } else {
        toast.success(message);
      }
    } catch (err) {
      console.error('Toast error:', err);
    }
  }, []);

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.startsWith("image")) {
        safeToast('error', "Apenas arquivos de imagem são permitidos.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        safeToast('error', "Arquivo muito grande. Máx: 10MB");
        return;
      }
      setFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!f.type.startsWith("image")) {
        safeToast('error', "Apenas arquivos de imagem são permitidos.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        safeToast('error', "Arquivo muito grande. Máx: 10MB");
        return;
      }
      setFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // State multi-select
  const removeState = (state: string) => {
    setSelectedStates((prev) => prev.filter((s) => s.toLowerCase() !== state.toLowerCase()));
  };

  // Handle state selection
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    if (selectedState && !selectedStates.includes(selectedState)) {
      setSelectedStates(prev => [...prev, selectedState]);
    }
  };

  // Attachment handlers
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!title.trim()) {
      safeToast('error', "Título da campanha é obrigatório.");
      return false;
    }
    if (!description.trim()) {
      safeToast('error', "Descrição da campanha é obrigatória.");
      return false;
    }
    if (!budget.trim()) {
      safeToast('error', "Orçamento é obrigatório.");
      return false;
    }
    if (!deadline) {
      safeToast('error', "Prazo final é obrigatório.");
      return false;
    }
    if (selectedStates.length === 0) {
      safeToast('error', "Selecione pelo menos um estado.");
      return false;
    }
    if (!campaignType) {
      safeToast('error', "Tipo de campanha é obrigatório.");
      return false;
    }
    return true;
  };

  // Form submit - memoized to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (error) {
      dispatch(clearError());
    }

    try {
      const campaignData = {
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim(),
        deadline: deadline!,
        states: selectedStates,
        creatorRequirements: creatorReq.trim(),
        type: campaignType,
        logo: file,
        attachments: attachments,
      };

      const result = await dispatch(createCampaign(campaignData));
      
      if (createCampaign.fulfilled.match(result)) {
        // Use a more stable approach to prevent DOM manipulation issues
        setIsSubmitted(true);
        safeToast('success', "Campanha criada com sucesso! Aguarde a aprovação do administrador.");
        
        // Reset form with a slight delay to prevent rapid state changes
        setTimeout(() => {
          resetForm();
        }, 100);
        
        // Reset success state after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        safeToast('error', result.payload || "Erro ao criar campanha.");
      }
    } catch (err) {
      safeToast('error', "Erro inesperado ao criar campanha.");
    }
  }, [title, description, budget, deadline, selectedStates, creatorReq, campaignType, file, attachments, error, dispatch, validateForm, safeToast, resetForm]);

  // Show success message if submitted
  if (isSubmitted) {
    return (
      <div key="success-message" className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Campanha Criada!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sua campanha foi enviada para aprovação. Você receberá uma notificação quando ela for aprovada pelo administrador.
          </p>
          <Button
            key="create-new-campaign-btn"
            onClick={() => setIsSubmitted(false)}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Criar Nova Campanha
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div key="campaign-form" className="min-h-[92vh] dark:bg-[#171717] flex flex-col items-center py-4 px-2 sm:px-10">
      <form
        onSubmit={handleSubmit}
        className="w-full"
        autoComplete="off"
        style={{ position: "relative" }}
      >
                   <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-sm p-4 md:p-8 w-full">
           <h2 className="font-bold text-lg md:text-xl mb-6">Criar Nova Campanha</h2>

           {/* Título */}
           <div className="mb-5">
             <label htmlFor="title" className="block text-xs font-medium text-zinc-500 mb-1">Título da Campanha *</label>
             <Input
               id="title"
               value={title}
               onChange={e => setTitle(e.target.value)}
               placeholder="Campanha Verão 2024"
               className="rounded-lg border-zinc-200 dark:border-zinc-700 bg-background text-zinc-900 dark:text-zinc-100 text-sm"
               required
             />
           </div>

           {/* Descrição */}
           <div className="mb-5">
             <label htmlFor="description" className="block text-xs font-medium text-zinc-500 mb-1">Descrição da Campanha *</label>
             <Textarea
               id="description"
               value={description}
               onChange={e => setDescription(e.target.value)}
               placeholder="Queremos conteúdo autêntico sobre moda verão"
               className="rounded-lg border-zinc-200 dark:border-zinc-700 bg-background text-zinc-900 dark:text-zinc-100 text-sm min-h-[90px]"
               required
             />
           </div>

            {/* Orçamento */}
           <div className="mb-5">
             <label htmlFor="budget" className="block text-xs font-medium text-zinc-500 mb-1">Orçamento (R$) *</label>
             <Input
               id="budget"
               type="text"
               value={budget}
               onChange={e => setBudget(e.target.value)}
               placeholder="R$ 800,00"
               className="rounded-lg border-zinc-200 dark:border-zinc-700 bg-background text-zinc-900 dark:text-zinc-100 text-sm"
               required
             />
           </div>

           {/* Tipo de Campanha */}
           <div className="mb-5">
             <label htmlFor="type" className="block text-xs font-medium text-zinc-500 mb-1">Tipo de Campanha *</label>
             <select
               id="type"
               value={campaignType}
               onChange={e => setCampaignType(e.target.value)}
               className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-background text-zinc-900 dark:text-zinc-100 text-sm"
               required
             >
               <option value="">Selecione o tipo</option>
               {CAMPAIGN_TYPES.map(type => (
                 <option key={type} value={type}>{type}</option>
               ))}
             </select>
           </div>

                     {/* Prazo Final */}
           <div className="mb-5">
             <label className="block text-xs font-medium text-zinc-500 mb-1">Prazo Final *</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    readOnly
                    value={deadline ? deadline.toLocaleDateString("pt-BR") : ""}
                    placeholder="Clique para selecionar a data"
                    className="rounded-lg border-zinc-200 dark:border-zinc-700 bg-background text-zinc-900 dark:text-zinc-100 text-sm pr-10 cursor-pointer"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => {
                    setDeadline(date);
                  }}
                  fromDate={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

                     {/* Estados */}
           <div className="mb-5">
             <label className="block text-xs font-medium text-zinc-500 mb-1">Em quais estados a campanha será divulgada? *</label>
             <span className="block text-xs text-zinc-400 mb-2">Selecione um ou mais estados. Apenas criadores desses estados verão esta campanha.</span>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedStates.map(state => (
                <span
                  key={state}
                  className="flex items-center bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-xs font-medium gap-1"
                >
                  {state}
                  <button
                    type="button"
                    className="ml-1 text-pink-400 hover:text-pink-700"
                    onClick={() => removeState(state)}
                    aria-label={`Remover ${state}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <select
              value=""
              onChange={handleStateChange}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-background text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">Selecione um estado para adicionar</option>
              {BRAZILIAN_STATES.filter(state => !selectedStates.includes(state)).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <span className="text-xs text-zinc-400">Selecione estados da lista para adicionar à campanha</span>
          </div>

          {/* Referência visual (upload) */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-500 mb-1">Logo da Campanha (upload imagem)</label>
            <div
              className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background border-zinc-200 dark:border-zinc-700 min-h-[90px]",
                dragActive && "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              tabIndex={0}
              role="button"
              aria-label="Upload de arquivo"
            >
              <UploadCloud className="w-8 h-8 mb-2 text-zinc-300" />
              <span className="text-xs text-zinc-400">Clique para fazer upload ou arraste o arquivo</span>
              <span className="text-[10px] text-zinc-300 mt-1">Apenas imagens (.JPG, .PNG, máx. 10MB)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                tabIndex={-1}
              />
            </div>
            {imagePreview && (
              <div className="flex flex-col items-center mt-4">
                <img
                  src={imagePreview}
                  alt="Logo Preview"
                  className="rounded-lg max-h-40 object-contain border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow"
                  style={{ maxWidth: 220 }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="mt-2"
                  onClick={() => { setFile(null); setImagePreview(null); }}
                >
                  Remover
                </Button>
              </div>
            )}
          </div>

            {/* Requisitos para Criadores */}
           <div className="mb-5">
             <label className="block text-xs font-medium text-zinc-500 mb-1">Requisitos para Criadores</label>
             <Input
               placeholder="Ex: +10k seguidores, Instagram ativo, etc."
               value={creatorReq}
               onChange={e => setCreatorReq(e.target.value)}
               className="rounded-lg border-zinc-200 dark:border-zinc-700 bg-background text-zinc-900 dark:text-zinc-100 text-sm"
             />
           </div>

           {/* Anexos */}
           <div className="mb-5">
             <label className="block text-xs font-medium text-zinc-500 mb-1">Anexos (opcional)</label>
             <div
               className={cn(
                 "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background border-zinc-200 dark:border-zinc-700 min-h-[90px]"
               )}
               onClick={handleAttachmentClick}
               role="button"
               aria-label="Upload de anexos"
             >
               <UploadCloud className="w-8 h-8 mb-2 text-zinc-300" />
               <span className="text-xs text-zinc-400">Clique para fazer upload de anexos</span>
               <span className="text-[10px] text-zinc-300 mt-1">Documentos, PDFs, imagens (máx. 10MB cada)</span>
               <input
                 ref={attachmentInputRef}
                 type="file"
                 multiple
                 accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                 className="hidden"
                 onChange={handleAttachmentChange}
               />
             </div>
             {attachments.length > 0 && (
               <div className="mt-4 space-y-2">
                 {attachments.map((attachment, index) => (
                   <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded flex items-center justify-center">
                         <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                           {attachment.name.split('.').pop()?.toUpperCase()}
                         </span>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                           {attachment.name}
                         </p>
                         <p className="text-xs text-zinc-500 dark:text-zinc-400">
                           {(attachment.size / 1024 / 1024).toFixed(2)} MB
                         </p>
                       </div>
                     </div>
                     <Button
                       type="button"
                       size="sm"
                       variant="destructive"
                       onClick={() => removeAttachment(index)}
                       className="p-1 h-8 w-8"
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
           </div>
           <div className="w-full flex justify-end items-center pt-6">
           <Button
             type="submit"
             disabled={isCreating}
             className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-base py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
             style={{ minWidth: 180 }}
           >
             {isCreating ? (
               <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 Criando...
               </>
             ) : (
               <>
                 <PlusCircle className="w-5 h-5 mr-1" />
                 Criar Campanha
               </>
             )}
           </Button>
           </div>
        </div>
        {/* Fixed submit button bottom right */}
      </form>
    </div>
  );
}
