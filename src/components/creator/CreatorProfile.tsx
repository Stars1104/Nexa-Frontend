import React, { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../../store/thunks/userThunks";
import { clearProfile } from "../../store/slices/userSlice";
import { updateUserPassword } from "../../store/thunks/authThunks";
import { Crown, Key, AlertTriangle, DollarSign, Wallet, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { useSafeToast } from "../../hooks/useSafeToast";
import EditProfile from "./EditProfile";
import UpdatePasswordModal from "../ui/UpdatePasswordModal";
import Reviews from "../Reviews";
import WithdrawalModal from "./WithdrawalModal";
import { hiringApi, CreatorBalance as CreatorBalanceType } from "@/api/hiring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAvatarUrl } from "@/lib/utils";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Fallback profile data if no user data is available
const defaultProfile = {
  name: "Usuário",
  email: "usuario@exemplo.com",
  state: "Não especificado",
  role: "Influenciador",
  gender: "Não especificado",
  categories: ["Geral"],
  image: null,
  balance: 0,
  age: null,
  creator_type: null,
  birth_date: null,
  instagram_handle: null,
  tiktok_handle: null,
  youtube_channel: null,
  facebook_page: null,
  twitter_handle: null,
  niche: "Não informado",
};

export const CreatorProfile = () => {
  const dispatch = useAppDispatch();
  const safeToast = useSafeToast();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [balance, setBalance] = useState<CreatorBalanceType | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Get profile data from Redux store
  const { profile, isLoading, error } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  // Load balance data
  const loadBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await hiringApi.getCreatorBalance();
      setBalance(response.data);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do saldo",
        variant: "destructive",
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Clear any cached profile data first
        dispatch(clearProfile());
        await dispatch(fetchUserProfile()).unwrap();
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        // Don't show error toast for authentication errors as they're handled by the interceptor
        if (
          !error?.message?.includes("401") &&
          !error?.message?.includes("Unauthorized")
        ) {
          safeToast.error("Erro ao carregar perfil");
        }
      }
    };

    // Only fetch if user is authenticated
    if (user?.id) {
      fetchProfile();
      loadBalance();
    }
  }, [dispatch, user?.id]);

  // Merge user data with profile data and fallback to defaults
  const displayProfile = {
    name: profile?.name || user?.name || defaultProfile.name,
    email: profile?.email || user?.email || defaultProfile.email,
    state: profile?.location || profile?.state || defaultProfile.state,
    role: profile?.role || user?.role || defaultProfile.role,
    gender: profile?.gender || defaultProfile.gender,
    categories: profile?.categories || defaultProfile.categories,
    image: profile?.avatar || profile?.avatar_url || null,
    has_premium: profile?.has_premium || user?.has_premium || false,
    balance: profile?.balance || user?.balance || defaultProfile.balance,
    age: profile?.age || user?.age || defaultProfile.age,
    creator_type: profile?.creator_type || user?.creator_type || defaultProfile.creator_type,
    birth_date: profile?.birth_date || user?.birth_date || null,
    instagram_handle: profile?.instagram_handle || user?.instagram_handle || defaultProfile.instagram_handle,
    tiktok_handle: profile?.tiktok_handle || user?.tiktok_handle || defaultProfile.tiktok_handle,
    youtube_channel: profile?.youtube_channel || user?.youtube_channel || defaultProfile.youtube_channel,
    facebook_page: profile?.facebook_page || user?.facebook_page || defaultProfile.facebook_page,
    twitter_handle: profile?.twitter_handle || user?.twitter_handle || defaultProfile.twitter_handle,
    niche: profile?.niche || user?.niche || profile?.industry || user?.industry || "Não informado",
  };

  const handleSaveProfile = useCallback(
    async (updatedProfile: any) => {
      setIsUpdating(true);

      try {
        // Map form data to API format, matching backend expectations
        const profileData: any = {
          name: updatedProfile.name,
          email: updatedProfile.email,
          state: updatedProfile.state, // Send state directly instead of mapping to location
          role: updatedProfile.role,
          gender: updatedProfile.gender,
          birth_date: updatedProfile.birth_date,
          creator_type: updatedProfile.creator_type,
          instagram_handle: updatedProfile.instagram_handle,
          tiktok_handle: updatedProfile.tiktok_handle,
          youtube_channel: updatedProfile.youtube_channel,
          facebook_page: updatedProfile.facebook_page,
          twitter_handle: updatedProfile.twitter_handle,
          niche: updatedProfile.niche,
          industry: updatedProfile.niche, // Send niche value to both fields for compatibility
        };

        // Avatar: backend expects 'avatar' (file), not 'avatar_url'
        if (updatedProfile.image instanceof File) {
          profileData.avatar = updatedProfile.image;
        }


        // Update profile
        await dispatch(updateUserProfile(profileData)).unwrap();

        // Refetch the latest profile from backend
        await dispatch(fetchUserProfile()).unwrap();

        // Exit edit mode first, then show success message
        setEditMode(false);

        // Use safe toast with longer delay to ensure all React updates are complete
        safeToast.success("Perfil atualizado com sucesso!", 300);
      } catch (error: any) {
        console.error("Profile update failed:", error);
        safeToast.error(error?.message || error || "Falha ao atualizar perfil");
      } finally {
        setIsUpdating(false);
      }
    },
    [dispatch, isUpdating]
  );

  const handleUpdatePassword = useCallback(
    async (passwordData: { currentPassword: string; newPassword: string }) => {
      if (!user?.id) {
        safeToast.error("Usuário não autenticado");
        return;
      }

      setIsPasswordLoading(true);
      try {
        const passwordUpdateData = {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          userId: user.id,
        };
        await dispatch(updateUserPassword(passwordUpdateData)).unwrap();
        setShowPasswordModal(false);

        // Use safe toast with longer delay to ensure the modal has finished closing
        safeToast.success("Senha atualizada com sucesso!", 300);
      } catch (error: any) {
        console.error("Password update failed:", error);
        safeToast.error(error?.message || error || "Falha ao atualizar senha");
    } finally {
      setIsPasswordLoading(false);
    }
  },
  [dispatch, user?.id]
);

const handleRefreshProfile = useCallback(async () => {
  try {
    dispatch(clearProfile());
    await dispatch(fetchUserProfile()).unwrap();
    safeToast.success("Perfil atualizado!");
  } catch (error: any) {
    console.error("Profile refresh failed:", error);
    safeToast.error("Falha ao atualizar perfil");
  }
}, [dispatch]);

  const handleWithdrawalCreated = () => {
    setShowWithdrawalModal(false);
    loadBalance();
  };

  // Handle edit mode toggle
  const handleEditModeToggle = useCallback(() => {
    if (isUpdating) {
      return;
    }
    setEditMode(!editMode);
  }, [editMode, isUpdating]);

  // Handle password modal toggle
  const handlePasswordModalToggle = useCallback(() => {
    if (isUpdating) {
      return;
    }
    setShowPasswordModal(!showPasswordModal);
  }, [showPasswordModal, isUpdating]);

  if (editMode) {
    return (
      <EditProfile
        initialProfile={{
          name: displayProfile.name,
          email: displayProfile.email,
          state: displayProfile.state,
          role: displayProfile.role,
          gender: displayProfile.gender,
          categories: displayProfile.categories,
          image: displayProfile.image,
          birth_date: displayProfile.birth_date,
          creator_type: displayProfile.creator_type,
          instagram_handle: displayProfile.instagram_handle,
          tiktok_handle: displayProfile.tiktok_handle,
          youtube_channel: displayProfile.youtube_channel,
          facebook_page: displayProfile.facebook_page,
          twitter_handle: displayProfile.twitter_handle,
          niche: displayProfile.niche,
        }}
        onCancel={() => setEditMode(false)}
        onSave={handleSaveProfile}
        isLoading={isLoading || isUpdating}
      />
    );
  }

  // Don't render if user is not authenticated
  if (!user?.id) {
    return (
      <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Por favor, faça login para ver seu perfil
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Carregando perfil...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] flex items-center justify-center">
        <div className="text-red-500">Erro ao carregar perfil: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] p-6">
      <div className="w-full">
        {/* Premium Subscription Alert */}
        {!displayProfile.has_premium && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Assine o Premium
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Desbloqueie recursos premium e melhore sua experiência como
                  criador
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200">
                Fazer Upgrade
              </button>
            </div>
          </div>
        )}

        <div className="bg-background rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
          <div className="flex justify-between items-start mb-6">
            <span className="font-semibold text-base text-gray-900 dark:text-white">
              Informações do Perfil
            </span>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePasswordModalToggle}
                disabled={isUpdating}
              >
                <Key className="w-4 h-4" />
                Alterar Senha
              </button>
              <button
                className="flex items-center gap-1 text-pink-500 hover:text-pink-600 text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEditModeToggle}
                disabled={isUpdating}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="inline-block"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"
                  />
                </svg>
                Editar Perfil
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 items-start">
            {/* Avatar and name */}
            <div className="flex gap-4 items-center min-w-[120px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-400 flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-white mb-2 overflow-hidden">
                  {displayProfile.image ? (
                    <img
                      src={getAvatarUrl(displayProfile.image)}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = getInitials(displayProfile.name);
                        }
                      }}
                    />
                  ) : (
                    getInitials(displayProfile.name)
                  )}
                </div>
                {/* Premium Icon */}
                {displayProfile.has_premium && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {displayProfile.name}
                  </span>
                  {displayProfile.has_premium && (
                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  {displayProfile.email}
                </div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="w-full">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Detalhes Pessoais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Estado
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.state}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Função
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.role}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Gênero
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.gender === 'female' ? 'Feminino' :
                     displayProfile.gender === 'male' ? 'Masculino' :
                     displayProfile.gender === 'other' ? 'Não-binário' :
                     displayProfile.gender === 'prefer_not_to_say' ? 'Prefiro não informar' :
                     displayProfile.gender || 'Não especificado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Data de Nascimento
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.birth_date ? 
                      new Date(displayProfile.birth_date).toLocaleDateString('pt-BR') : 
                      'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Tipo de Criador
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.creator_type ? 
                      (displayProfile.creator_type === 'ugc' ? 'UGC (Conteúdo do Usuário)' :
                       displayProfile.creator_type === 'influencer' ? 'Influenciador' :
                       displayProfile.creator_type === 'both' ? 'UGC e Influenciador' :
                       displayProfile.creator_type) : 
                      'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    Indústria
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.niche || 'Não informado'}
                  </div>
                </div>

              </div>
            </div>
            
            {/* Social Media Information - Always show for all creators */}
            <div className="w-full">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Redes Sociais
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {displayProfile.creator_type === 'influencer' || displayProfile.creator_type === 'both' 
                  ? 'Suas redes sociais ajudam as marcas a conhecerem melhor seu alcance e engajamento'
                  : 'Adicione suas redes sociais para aumentar suas chances de ser selecionado para campanhas'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    INSTAGRAM
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.instagram_handle || 'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    TIKTOK
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.tiktok_handle || 'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    YOUTUBE
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.youtube_channel || 'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    FACEBOOK
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.facebook_page || 'Não informado'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">
                    TWITTER
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {displayProfile.twitter_handle || 'Não informado'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {user?.id && (
        <div className="mt-8">
          <Reviews
            userId={user.id}
            userType="creator"
            showStats={true}
            maxReviews={5}
          />
        </div>
      )}

      {/* Balance and Withdrawal Section */}
      {user?.id && (
        <div className="mt-8">
          <div className="bg-background rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Saldo e Saques
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie seu saldo e solicite saques dos seus ganhos
                </p>
              </div>
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                className="flex items-center gap-2"
                disabled={!balance || balance.balance.available_balance <= 0 || balanceLoading}
              >
                <Wallet className="h-4 w-4" />
                Solicitar Saque
              </Button>
            </div>

            {balanceLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : balance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance.balance.formatted_available_balance}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Disponível para saque
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance.earnings.formatted_this_month}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este mês
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {balance.withdrawals.pending_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aguardando processamento
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Não foi possível carregar os dados do saldo
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      <UpdatePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleUpdatePassword}
        isLoading={isPasswordLoading}
      />

      {/* Withdrawal Modal */}
      {balance && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          balance={balance}
          onWithdrawalCreated={handleWithdrawalCreated}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
