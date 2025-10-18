import React, { useRef, useState } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { DatePicker } from "../ui/date-picker";
import { UploadIcon, XIcon } from "lucide-react";

const BRAZILIAN_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

const NICHES = [
  "Moda e Beleza", "Tecnologia", "Saúde e Bem-estar", "Educação", "Entretenimento",
  "Esportes", "Gastronomia", "Viagem e Turismo", "Negócios e Empreendedorismo",
  "Arte e Cultura", "Música", "Jogos", "Fitness e Esportes", "Maternidade e Família",
  "Automotivo", "Imóveis", "Finanças", "Política", "Meio Ambiente", "Outros"
];

const LANGUAGES = [
  "Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Japonês",
  "Chinês", "Coreano", "Russo", "Árabe", "Hindi", "Holandês", "Sueco", "Norueguês",
  "Dinamarquês", "Finlandês", "Polonês", "Tcheco", "Húngaro", "Romeno", "Búlgaro",
  "Croata", "Sérvio", "Eslovaco", "Esloveno", "Grego", "Turco", "Hebraico", "Persa",
  "Urdu", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Punjabi", "Outros"
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase();

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
  languages: [] as string[],
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

  const handleLanguageToggle = (language: string) => {
    setProfile((p) => ({
      ...p,
      languages: p.languages.includes(language)
        ? p.languages.filter((l) => l !== language)
        : [...p.languages, language],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.gender) return setError("Gênero é obrigatório");
    if (!profile.birth_date) return setError("Data de nascimento é obrigatória");
    if (!profile.niche) return setError("Nicho é obrigatório");

    if (
      (profile.creator_type === "influencer" || profile.creator_type === "both") &&
      !profile.instagram_handle?.trim()
    ) {
      return setError("Instagram é obrigatório para influenciadores");
    }

    setError("");
    onSave(profile);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717] px-4 sm:px-8 py-8 overflow-y-auto">
      <form
        className="max-w-3xl mx-auto bg-background rounded-2xl shadow-md border border-gray-200 dark:border-neutral-700 p-6 sm:p-8 space-y-8"
        onSubmit={handleSave}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center">
          Editar Perfil
        </h2>

        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-3xl sm:text-4xl font-bold text-pink-600 dark:text-white">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow-md focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Enviar foto do perfil"
            >
              <UploadIcon className="w-4 h-4" />
            </button>

            {imagePreview && (
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                onClick={handleRemoveImage}
                aria-label="Remover foto do perfil"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            JPG ou PNG, máximo 2MB
          </p>
        </div>

        {/* Personal Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input name="name" placeholder="Nome completo" value={profile.name} onChange={handleChange} />
            <Input name="email" type="email" placeholder="Email" value={profile.email} onChange={handleChange} />
            <Select value={profile.state} onValueChange={(val) => setProfile((p) => ({ ...p, state: val }))}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input name="role" placeholder="Profissão" value={profile.role} onChange={handleChange} />
          </div>
        </div>

        {/* Creator Info */}
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Informações de Criador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select value={profile.gender || ""} onValueChange={(val) => setProfile((p) => ({ ...p, gender: val }))}>
              <SelectTrigger><SelectValue placeholder="Gênero" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="other">Não-binário</SelectItem>
              </SelectContent>
            </Select>
            <DatePicker
              value={profile.birth_date || ""}
              onChange={(date) => setProfile((p) => ({ ...p, birth_date: date }))}
              placeholder="Data de nascimento"
            />
            <Select value={profile.creator_type || ""} onValueChange={(val) => setProfile((p) => ({ ...p, creator_type: val }))}>
              <SelectTrigger><SelectValue placeholder="Tipo de criador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ugc">UGC</SelectItem>
                <SelectItem value="influencer">Influenciador</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={profile.niche || ""} onValueChange={(val) => setProfile((p) => ({ ...p, niche: val }))}>
              <SelectTrigger><SelectValue placeholder="Nicho" /></SelectTrigger>
              <SelectContent>
                {NICHES.map((niche) => (
                  <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Redes Sociais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input name="instagram_handle" placeholder="@Instagram" value={profile.instagram_handle || ""} onChange={handleChange} />
            <Input name="tiktok_handle" placeholder="@TikTok" value={profile.tiktok_handle || ""} onChange={handleChange} />
            <Input name="youtube_channel" placeholder="Canal do YouTube" value={profile.youtube_channel || ""} onChange={handleChange} />
            <Input name="facebook_page" placeholder="Página do Facebook" value={profile.facebook_page || ""} onChange={handleChange} />
            <Input name="twitter_handle" placeholder="@Twitter" value={profile.twitter_handle || ""} onChange={handleChange} />
          </div>
        </div>

        {/* Languages */}
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Idiomas
          </h3>
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !profile.languages.includes(value)) {
                setProfile((p) => ({
                  ...p,
                  languages: [...p.languages, value],
                }));
              }
            }}
          >
            <SelectTrigger><SelectValue placeholder="Adicionar idioma" /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter((l) => !profile.languages.includes(l)).map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {profile.languages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <div
                  key={lang}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons & Error */}
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-md flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-md"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
