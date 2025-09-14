import React, { useRef, useState } from "react";
import { Input } from "../ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "../ui/select";
import { DatePicker } from "../ui/date-picker";
import { cn } from "@/lib/utils";
import { UploadIcon, XIcon } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

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

const NICHES = [
  "Moda e Beleza",
  "Tecnologia",
  "Saúde e Bem-estar",
  "Educação",
  "Entretenimento",
  "Esportes",
  "Gastronomia",
  "Viagem e Turismo",
  "Negócios e Empreendedorismo",
  "Arte e Cultura",
  "Música",
  "Jogos",
  "Fitness e Esportes",
  "Maternidade e Família",
  "Automotivo",
  "Imóveis",
  "Finanças",
  "Política",
  "Meio Ambiente",
  "Outros"
];



const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const defaultProfile = {
    name: "Andrii Kerrn",
    email: "andriikerrn@gmail.com",
    state: "São Paulo",
    role: "UGC e Influenciador",
    gender: "none",
    categories: ["Moda", "Estilo de Vida", "Beleza"],
    image: null as File | null,
    birth_date: null as string | null,
    creator_type: null as string | null,
    instagram_handle: null as string | null,
    tiktok_handle: null as string | null,
    youtube_channel: null as string | null,
    facebook_page: null as string | null,
    twitter_handle: null as string | null,
    niche: null as string | null,
};

export const EditProfile: React.FC<{
    initialProfile?: typeof defaultProfile;
    onCancel: () => void;
    onSave: (profile: typeof defaultProfile) => void;
    isLoading?: boolean;
}> = ({ initialProfile = defaultProfile, onCancel, onSave, isLoading = false }) => {
    const [profile, setProfile] = useState({ ...initialProfile });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Apenas arquivos JPG e PNG são permitidos.");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            setError("Tamanho máximo do arquivo é 2MB.");
            return;
        }
        setProfile((p) => ({ ...p, image: file }));
        setImagePreview(URL.createObjectURL(file));
        setError("");
    };

    const handleRemoveImage = () => {
        setProfile((p) => ({ ...p, image: null }));
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setProfile((p) => ({ ...p, [name]: value }));
    };



    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!profile.gender) {
            setError("Gênero é obrigatório");
            return;
        }
        
        if (!profile.birth_date) {
            setError("Data de nascimento é obrigatória");
            return;
        }
        
        if (!profile.niche) {
            setError("Nicho é obrigatório");
            return;
        }
        
        // Validate Instagram for influencers and both types
        if ((profile.creator_type === 'influencer' || profile.creator_type === 'both') && !profile.instagram_handle?.trim()) {
            setError("Instagram é obrigatório para influenciadores");
            return;
        }
        
        setError("");
        
        onSave(profile);
    };

    return (
        <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] p-6">
            <form
                className="w-full bg-background rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mt-6"
                onSubmit={handleSave}
            >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Editar Perfil</h2>
                {/* Foto do perfil */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative w-24 h-24">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" className="object-cover w-full h-full rounded-full" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-3xl font-bold text-purple-600 dark:text-white">
                                    {getInitials(profile.name)}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow-md focus:outline-none"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Enviar foto do perfil"
                        >
                            <UploadIcon className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-full p-1 focus:outline-none"
                            onClick={handleRemoveImage}
                            aria-label="Remover foto do perfil"
                        >
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">Foto do perfil</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">JPG ou PNG, máximo 2MB</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Digite seu nome completo"
                            value={profile.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="name"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Digite seu email"
                            value={profile.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                        <Select
                            value={profile.state}
                            onValueChange={val => setProfile(p => ({ ...p, state: val }))}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Selecione seu estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {BRAZILIAN_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Profissão</label>
                        <Input
                            id="role"
                            name="role"
                            type="text"
                            placeholder="Digite sua profissão"
                            value={profile.role}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="role"
                        />
                        <span className="text-xs text-gray-400 mt-1">Isso ajuda as marcas a entenderem seu perfil.</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Gênero <span className="text-red-500">*</span></label>
                        <Select
                            value={profile.gender || ''}
                            onValueChange={val => setProfile(p => ({ ...p, gender: val }))}
                            disabled={isLoading}
                            required
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="female">Feminino</SelectItem>
                                <SelectItem value="male">Masculino</SelectItem>
                                <SelectItem value="other">Não-binário</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-gray-400 mt-1">Campo obrigatório</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento <span className="text-red-500">*</span></label>
                        <DatePicker
                            value={profile.birth_date || ''}
                            onChange={(date) => setProfile(p => ({ ...p, birth_date: date }))}
                            disabled={isLoading}
                            min="1900-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            placeholder="Selecione sua data de nascimento"
                            className="w-full"
                        />
                        <span className="text-xs text-gray-400 mt-1">Campo obrigatório - Isso ajuda as marcas a encontrar campanhas adequadas para sua idade</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Criador <span className="text-xs text-gray-400">(Opcional)</span></label>
                        <Select
                            value={profile.creator_type || ''}
                            onValueChange={val => setProfile(p => ({ ...p, creator_type: val }))}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Selecione o tipo de criador" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ugc">UGC (Conteúdo do Usuário)</SelectItem>
                                <SelectItem value="influencer">Influenciador</SelectItem>
                                <SelectItem value="both">Ambos os Tipos</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-gray-400 mt-1">Isso ajuda as marcas a encontrar campanhas adequadas para seu perfil</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Nicho <span className="text-red-500">*</span></label>
                        <Select
                            value={profile.niche || ''}
                            onValueChange={val => setProfile(p => ({ ...p, niche: val }))}
                            disabled={isLoading}
                            required
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Selecione seu nicho" />
                            </SelectTrigger>
                            <SelectContent>
                                {NICHES.map((niche) => (
                                    <SelectItem key={niche} value={niche}>
                                        {niche}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-gray-400 mt-1">Campo obrigatório - Sua área de atuação principal</span>
                    </div>
                    
                    {/* Social Media Fields - Show for all creator types */}
                    {profile.creator_type && (
                        <>
                            <div className="col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Redes Sociais</h3>
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instagram {(profile.creator_type === 'influencer' || profile.creator_type === 'both') ? 
                                        <span className="text-xs text-red-500">(Obrigatório)</span> : 
                                        <span className="text-xs text-gray-400">(Opcional)</span>
                                    }
                                </label>
                                <Input
                                    id="instagram_handle"
                                    name="instagram_handle"
                                    type="text"
                                    placeholder="@seu_usuario"
                                    value={profile.instagram_handle || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required={profile.creator_type === 'influencer' || profile.creator_type === 'both'}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">TikTok <span className="text-xs text-gray-400">(Opcional)</span></label>
                                <Input
                                    id="tiktok_handle"
                                    name="tiktok_handle"
                                    type="text"
                                    placeholder="@seu_usuario"
                                    value={profile.tiktok_handle || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube <span className="text-xs text-gray-400">(Opcional)</span></label>
                                <Input
                                    id="youtube_channel"
                                    name="youtube_channel"
                                    type="text"
                                    placeholder="Nome do canal"
                                    value={profile.youtube_channel || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook <span className="text-xs text-gray-400">(Opcional)</span></label>
                                <Input
                                    id="facebook_page"
                                    name="facebook_page"
                                    type="text"
                                    placeholder="Nome da página"
                                    value={profile.facebook_page || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter <span className="text-xs text-gray-400">(Opcional)</span></label>
                                <Input
                                    id="twitter_handle"
                                    name="twitter_handle"
                                    type="text"
                                    placeholder="@seu_usuario"
                                    value={profile.twitter_handle || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </>
                    )}
                </div>
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#E91E63] hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-md flex items-center gap-2"
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isLoading ? "Saving..." : "Save changes"}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        className="bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md focus:outline-none"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile; 