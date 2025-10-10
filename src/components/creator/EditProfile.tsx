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

const LANGUAGE_MAP: { [key: string]: string } = Object.fromEntries(
  LANGUAGES.map((lang) => [lang, lang])
);

const getLanguageDisplayName = (language: string): string =>
  LANGUAGE_MAP[language] || language;

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717] px-3 py-5 sm:px-6 overflow-y-auto">
      <form
        className="max-w-3xl mx-auto bg-background rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4 sm:p-6 space-y-6"
        onSubmit={handleSave}
      >
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center">
          Editar Perfil
        </h2>

        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-2xl sm:text-3xl font-bold text-purple-600 dark:text-white">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 sm:p-2 shadow-md focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Enviar foto do perfil"
            >
              <UploadIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {imagePreview && (
              <button
                type="button"
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-full p-1 focus:outline-none"
                onClick={handleRemoveImage}
                aria-label="Remover foto do perfil"
              >
                <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
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

          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              Foto do perfil
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              JPG ou PNG, máximo 2MB
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Name */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Digite seu nome completo"
              value={profile.name}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu email"
              value={profile.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          {/* State */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <Select
              value={profile.state}
              onValueChange={(val) => setProfile((p) => ({ ...p, state: val }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2">
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

          {/* Role */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profissão
            </label>
            <Input
              id="role"
              name="role"
              type="text"
              placeholder="Digite sua profissão"
              value={profile.role}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
            <span className="text-xs text-gray-400 mt-1">
              Isso ajuda as marcas a entenderem seu perfil.
            </span>
          </div>

          {/* Gender */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gênero <span className="text-red-500">*</span>
            </label>
            <Select
              value={profile.gender || ""}
              onValueChange={(val) => setProfile((p) => ({ ...p, gender: val }))}
              disabled={isLoading}
              required
            >
              <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2">
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="other">Não-binário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of birth */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Nascimento <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={profile.birth_date || ""}
              onChange={(date) => setProfile((p) => ({ ...p, birth_date: date }))}
              disabled={isLoading}
              placeholder="Selecione sua data de nascimento"
              className="w-full"
            />
          </div>

          {/* Creator Type */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Criador
            </label>
            <Select
              value={profile.creator_type || ""}
              onValueChange={(val) => setProfile((p) => ({ ...p, creator_type: val }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2">
                <SelectValue placeholder="Selecione o tipo de criador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ugc">UGC</SelectItem>
                <SelectItem value="influencer">Influenciador</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niche */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nicho <span className="text-red-500">*</span>
            </label>
            <Select
              value={profile.niche || ""}
              onValueChange={(val) => setProfile((p) => ({ ...p, niche: val }))}
              disabled={isLoading}
              required
            >
              <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2">
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
          </div>

          {/* Languages */}
          <div className="flex flex-col col-span-1 sm:col-span-2">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Idiomas
            </label>
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
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2">
                <SelectValue placeholder="Adicionar idioma" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter((l) => !profile.languages.includes(l)).map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
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
                    <span>{getLanguageDisplayName(lang)}</span>
                    <button
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      disabled={isLoading}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center mt-2">{error}</div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#E91E63] hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-md flex justify-center items-center gap-2 w-full sm:w-auto"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-neutral-700 px-6 py-2 rounded-md w-full sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
