import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchBrandProfile, updateBrandProfile, changePassword } from "../../store/slices/brandProfileSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "../ui/sonner";
import { Camera, Edit, Key, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Language mapping from codes to display names
const LANGUAGE_CODE_TO_NAME: { [key: string]: string } = {
  "pt": "Português",
  "en": "Inglês",
  "es": "Espanhol",
  "fr": "Francês",
  "de": "Alemão",
  "it": "Italiano",
  "ja": "Japonês",
  "zh": "Chinês (Mandarim)",
  "ko": "Coreano",
  "ru": "Russo",
  "ar": "Árabe",
  "hi": "Hindi",
  "nl": "Holandês",
  "sv": "Sueco",
  "no": "Norueguês",
  "da": "Dinamarquês",
  "fi": "Finlandês",
  "pl": "Polaco",
  "cs": "Tcheco",
  "hu": "Húngaro",
  "el": "Grego",
  "tr": "Turco",
  "he": "Hebraico",
  "th": "Tailandês",
  "vi": "Vietnamita",
  "id": "Indonésio",
  "ms": "Malaio",
  "tl": "Filipino",
  "other": "Outros"
};

// Brazilian states array
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

// Initial profile data
const initialProfile = {
  username: "",
  email: "",
  companyName: "",
  whatsappNumber: "",
  gender: "",
  state: "",
  avatar: "",
};

export default function BrandProfile() {
  const dispatch = useAppDispatch();
  
  // Get profile data from Redux store
  const { profile, isLoading, error, isUpdating, isChangingPassword } = useAppSelector((state) => state.brandProfile);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [fieldValues, setFieldValues] = useState(initialProfile);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  
  // Add a ref for the file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await dispatch(fetchBrandProfile()).unwrap();
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error("Erro ao carregar perfil");
      }
    };
    
    fetchProfile();
  }, [dispatch]);

  // Helper function to construct full avatar URL
  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath) {
      return null;
    }
    
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    if (avatarPath.startsWith('/storage/')) {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br';
      const fullUrl = `${baseUrl}${avatarPath}`;
      return fullUrl;
    }
    
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br';
    const fullUrl = `${baseUrl}/storage/avatars/${avatarPath}`;
    return fullUrl;
  };

  // Merge profile data and fallback to defaults
  const displayProfile = {
    username: profile?.name || initialProfile.username,
    email: profile?.email || initialProfile.email,
    companyName: profile?.company_name || initialProfile.companyName,
    whatsappNumber: profile?.whatsapp_number || initialProfile.whatsappNumber,
    gender: profile?.gender || initialProfile.gender,
    state: profile?.state || initialProfile.state,
    avatar: getAvatarUrl(profile?.avatar || profile?.avatar_url) || initialProfile.avatar,
    languages: profile?.languages || [],
  };

  // Update fieldValues when profile data changes
  useEffect(() => {
    setFieldValues(displayProfile);
  }, [profile]);

  // Update fieldValues when avatar is uploaded
  useEffect(() => {
    if (profile?.avatar_url || profile?.avatar) {
      setFieldValues(prev => ({
        ...prev,
        avatar: getAvatarUrl(profile.avatar || profile.avatar_url)
      }));
    }
  }, [profile?.avatar_url, profile?.avatar]);

  // Handlers for editing fields
  const handleEditModalOpen = () => {
    setFieldValues(displayProfile);
    setShowEditModal(true);
  };
  
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFieldValues({ ...fieldValues, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFieldValues({ ...fieldValues, [field]: value });
  };
  
  const handleSave = async () => {
    try {
      const updateData: any = {
        username: fieldValues.username,
        email: fieldValues.email,
        company_name: fieldValues.companyName,
        whatsapp_number: fieldValues.whatsappNumber,
        state: fieldValues.state,
        // Don't include avatar in regular profile update - it should only be sent when uploading a file
      };

      // Only include gender if it's not empty and is a valid value
      if (fieldValues.gender && fieldValues.gender !== '' && ['male', 'female', 'other'].includes(fieldValues.gender)) {
        updateData.gender = fieldValues.gender as 'male' | 'female' | 'other';
      }

      console.log('Brand Profile - handleSave data:', updateData);
      await dispatch(updateBrandProfile(updateData)).unwrap();
      setShowEditModal(false);
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao atualizar perfil";
      toast.error(errorMessage);
    }
  };
  
  const handleCancel = () => {
    setShowEditModal(false);
    setFieldValues(displayProfile);
  };

  // Password change handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      const passwordData = {
        old_password: passwords.old,
        new_password: passwords.new,
        new_password_confirmation: passwords.confirm,
      };

      await dispatch(changePassword(passwordData)).unwrap();
      setShowPasswordDialog(false);
      setPasswords({ old: "", new: "", confirm: "" });
      toast.success("Senha alterada com sucesso");
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Erro ao alterar senha");
    }
  };

  // Handle avatar file selection
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('Uploading avatar file:', file.name, file.type, file.size);
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error("Tipo de arquivo não suportado. Use JPG, PNG ou GIF.");
          return;
        }
        
        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          toast.error("Arquivo muito grande. Tamanho máximo: 2MB.");
          return;
        }
        
        // Update the profile with the new avatar file
        const updateData = {
          username: fieldValues.username,
          email: fieldValues.email,
          company_name: fieldValues.companyName,
          whatsapp_number: fieldValues.whatsappNumber,
          gender: fieldValues.gender as 'male' | 'female' | 'other',
          state: fieldValues.state,
          avatar: file, // Pass the file directly
        };

        const result = await dispatch(updateBrandProfile(updateData)).unwrap();
        console.log('Avatar upload result:', result);
        
        if (result && result.avatar_url) {
          toast.success("Foto de perfil atualizada com sucesso");
        } else {
          toast.error("Erro: Avatar não foi atualizado corretamente");
        }
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        const errorMessage = error?.message || error || "Erro ao fazer upload da foto de perfil";
        toast.error(errorMessage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[92vh] bg-white dark:bg-[#171717] py-10 w-full md:px-0 flex flex-col items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Carregando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[92vh] bg-white dark:bg-[#171717] py-10 w-full md:px-0 flex flex-col items-center justify-center">
        <div className="text-red-500">Erro ao carregar perfil: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[92vh] bg-white dark:bg-[#171717] py-10 w-full md:px-0">
      <div className="w-full px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Informações do Perfil
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Alterar Senha</span>
            </button>
            <button
              onClick={handleEditModalOpen}
              className="flex items-center space-x-2 text-pink-500 hover:text-pink-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Perfil</span>
            </button>
          </div>
        </div>

        {/* Profile Identity Section */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={displayProfile.avatar} alt="Profile" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-600">
                {displayProfile.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {isUpdating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {displayProfile.username}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {displayProfile.email}
            </p>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            DETALHES PESSOAIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* State */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ESTADO</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {displayProfile.state || "Não informado"}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">IDIOMAS FALADOS</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {Array.isArray(displayProfile.languages) && displayProfile.languages.length > 0
                    ? displayProfile.languages.map(lang => LANGUAGE_CODE_TO_NAME[lang] || lang).join(", ")
                    : "Não informado"}
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">NÚMERO DO WHATSAPP</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {displayProfile.whatsappNumber || "Não informado"}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Role */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">FUNÇÃO</div>
                <div className="text-gray-900 dark:text-white font-medium">creator</div>
              </div>

              {/* Gender */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">GÊNERO</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {displayProfile.gender || "Não informado"}
                </div>
              </div>

              {/* Company Name */}
              <div className="bg-gray-50 dark:bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">NOME DA EMPRESA</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {displayProfile.companyName || "Não informado"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-white dark:bg-background border-gray-200 dark:border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white text-xl">Editar Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={fieldValues.avatar || getAvatarUrl(profile?.avatar_url)} alt="Profile" />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-600">
                      {fieldValues.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdating}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Clique no ícone da câmera para alterar a foto
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Nome de Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  value={fieldValues.username}
                  onChange={handleFieldChange}
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={fieldValues.email}
                  onChange={handleFieldChange}
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700 dark:text-gray-300">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={fieldValues.companyName}
                  onChange={handleFieldChange}
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="text-gray-700 dark:text-gray-300">Número do WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  value={fieldValues.whatsappNumber}
                  onChange={handleFieldChange}
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">Gênero</Label>
                <Select
                  value={fieldValues.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-background border-gray-300 dark:border-gray-600">
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-700 dark:text-gray-300">Estado</Label>
                <Select
                  value={fieldValues.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-background border-gray-300 dark:border-gray-600 max-h-60">
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-background border-gray-300 dark:border-gray-600"
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#e91e63] text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="bg-white dark:bg-background border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Alterar Senha</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="oldPassword" className="text-gray-700 dark:text-gray-300">Senha Atual</Label>
                <Input
                  id="oldPassword"
                  name="old"
                  type="password"
                  value={passwords.old}
                  onChange={handlePasswordChange}
                  required
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">Nova Senha</Label>
                <Input
                  id="newPassword"
                  name="new"
                  type="password"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  required
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirm"
                  type="password"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  required
                  className="bg-white dark:bg-background text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordDialog(false)}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-background border-gray-300 dark:border-gray-600"
                  disabled={isChangingPassword}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#e91e63] text-white"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Alterando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

