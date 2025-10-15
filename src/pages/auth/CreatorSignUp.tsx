import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Alert, AlertDescription } from "../../components/ui/alert";
import LightLogo from "../../assets/light-logo.png";
import DarkLogo from "../../assets/dark-logo.png";
import { useTheme } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useSystemTheme } from "../../hooks/use-system-theme";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { RootState, AppDispatch } from "../../store";
import { signupUser, loginUser } from "../../store/thunks/authThunks";
import { clearError, resetLoadingStates } from "../../store/slices/authSlice";
import { toast } from "sonner";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";
import GoogleOAuthButton from "../../components/GoogleOAuthButton";
import { AccountRestorationModal } from "../../components/AccountRestorationModal";
import { Helmet } from "react-helmet-async";
import { loginSuccess } from "../../store/slices/authSlice";
import {phone} from 'phone'

interface SignUpFormData {
  name: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
  isStudent: boolean;
}

interface SignInFormData {
  email: string;
  password: string;
}

const CreatorSignUp = () => {
  const { theme } = useTheme();
  const systemTheme = useSystemTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
  const [authType, setAuthType] = useState("signin");
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [showRestorationModal, setShowRestorationModal] = useState(false);
  const [whatsapp, setWhatsapp] = useState("")
  const [restorationData, setRestorationData] = useState<any>(null);
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loginType } = useParams<{ loginType: string }>();
  const { navigateToRoleDashboard, navigateToStudentVerification, navigateToSubscription } = useRoleNavigation();
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  const { isSigningUp, isLoading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const form = useForm<SignUpFormData>({
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
      isStudent: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (loginType === "login") setAuthType("signin");
  }, [loginType])

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear any pending states when component unmounts
      dispatch(clearError());
    };
  }, [dispatch]);

  // Reset loading states when component mounts
  useEffect(() => {
    // Always reset loading states when component mounts to prevent stuck states
    dispatch(resetLoadingStates());
  }, [dispatch]);


  // Effect to handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      // Prevent multiple navigation calls
      const timeoutId = setTimeout(() => {
        // Handle student verification flow
        if (user.isStudent && user.role === 'creator') {
          navigateToStudentVerification();
        } else if (isNewRegistration && user.role === 'creator') {
          // Redirect new Creator registrations to subscription page
          navigateToSubscription();
        } else {
          // Check if there's a redirect location from ProtectedRoute
          const from = location.state?.from?.pathname;
          if (from) {
            navigate(from, { replace: true });
          } else {
            navigateToRoleDashboard(user.role);
          }
        }
      }, 100); // Small delay to prevent race conditions

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, role, navigateToRoleDashboard, navigateToStudentVerification, navigateToSubscription, location, isNewRegistration]);

  // Clear error when switching auth types
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [authType, dispatch]);

  // Reset form when switching auth types
  const handleAuthTypeChange = (newAuthType: string) => {
    // Always allow switching - reset any stuck states first
    if (isSigningUp || isLoading) {
      dispatch(resetLoadingStates());
    }
    
    setAuthType(newAuthType);
    setIsNewRegistration(false); // Reset new registration flag
    form.reset({
      name: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
      isStudent: false,
    });
    
    // Clear any errors and reset states
    dispatch(clearError());
  };

  // Sign up Function
  const onSignUp = async (data: SignUpFormData) => {
    try {
      // Prevent multiple submissions
      if (isSigningUp) {
        return;
      }
      const signupData = {
        name: data.name,
        email: data.email,
        whatsapp:data.whatsapp ,
        password: data.password,
        password_confirmation: data.confirmPassword,
        isStudent: data.isStudent,
        role: (role as 'creator' | 'brand') || 'creator',
      };

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000); // 30 second timeout
      });

      const response = await Promise.race([
        dispatch(signupUser(signupData)).unwrap(),
        timeoutPromise
      ]) as any;
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      if (response.user !== null) {
        toast.success("Conta criada com sucesso! Você foi automaticamente logado.");
        setIsNewRegistration(true); // Set flag for new registration
        
        // For new users, automatically log them in after successful registration
        // This prevents the need for a separate login call
        if (response.token) {
          // Dispatch login success directly
          dispatch(loginSuccess({
            user: response.user,
            token: response.token
          }));
        }
      }
      // Navigation will be handled by useEffect after successful signup
    } catch (error: any) {
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Reset signing up state on error
      dispatch(clearError());
      
      // Handle timeout errors
      if (error.message === 'Request timeout - please try again') {
        toast.error("A solicitação demorou muito para responder. Tente novamente.");
      }
      // Handle rate limiting errors specifically
      else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retry_after || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const errorMessage = `Muitas tentativas de registro. Tente novamente em ${minutes} minuto(s).`;
        toast.error(errorMessage);
      } 
      // Handle network errors
      else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      // Handle server errors
      else if (error.response?.status >= 500) {
        toast.error("Erro interno do servidor. Tente novamente em alguns minutos.");
      }
      // Handle validation errors
      else if (error.response?.status === 422) {
        const errorMessage = error.response?.data?.message || "Dados inválidos. Verifique os campos e tente novamente.";
        toast.error(errorMessage);
      }
      // Handle account restoration case
      else if (error.type === 'account_removed_restorable') {
        setRestorationData(error);
        return;
      }
      // Handle other errors
      else {
        const errorMessage = error.response?.data?.message || error.message || "Erro ao criar conta. Tente novamente.";
        toast.error(errorMessage);
      }
      toast.error('Sign up error:', error);
      console.error('Sign up error:', error);
    }
  };

  // Sign in Function
  const onSignIn = async (data: SignInFormData) => {
    try {
      const loginData = {
        email: data.email,
        password: data.password,
      };

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000); // 30 second timeout
      });

      const response = await Promise.race([
        dispatch(loginUser(loginData)).unwrap(),
        timeoutPromise
      ]) as any;
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      if (response.user !== null) {
        toast.success("Você fez login com sucesso.");
        // Navigation will be handled by useEffect after successful login
      }
    } catch (error: any) {
      if(error === "account_removed_restorable"){
          setShowRestorationModal(true)
      }
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Handle timeout errors
      if (error.message === 'Request timeout - please try again') {
        toast.error("A solicitação demorou muito para responder. Tente novamente.");
      }
      // Handle rate limiting errors specifically
      else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retry_after || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const errorMessage = `Muitas tentativas de login. Tente novamente em ${minutes} minuto(s).`;
        toast.error(errorMessage);
      } 
      // Handle network errors
      else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      // Handle server errors
      else if (error.response?.status >= 500) {
        toast.error("Erro interno do servidor. Tente novamente em alguns minutos.");
      }
      // Handle validation errors
      else if (error.response?.status === 422) {
        const errorMessage = error.response?.data?.message || "Dados inválidos. Verifique os campos e tente novamente.";
        toast.error(errorMessage);
      }
      // Handle account restoration case
      else if ( error.type === 'account_removed_restorable') {
        setRestorationData(error);
        setShowRestorationModal(true);
        return;
      }
      // Handle other errors
      else {
        const errorMessage = error.response?.data?.message || error.message || "Erro ao fazer login. Tente novamente.";
        toast.error(errorMessage);
      }
      console.error('Sign in error:', error);
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
  };

  return (

    <>
      <Helmet>
          <title>Nexa - Entrar</title>
          <meta name="description" content="Browse Nexa guides filtered by brand and creator. Watch embedded videos and manage guides." />
          {canonical && <link rel="canonical" href={canonical} />}
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-[#171717] transition-colors duration-300 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="bg-background rounded-2xl shadow-lg p-6 md:p-10 w-full max-w-lg flex flex-col items-center gap-6 border border-border relative">
          <img
            src={isDarkMode ? LightLogo : DarkLogo}
            alt="Nexa logo"
            className="w-28 mb-2 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-1">
            {authType === "signup" ? "Registrar" : "Entrar"}
          </h1>
          <p className="text-muted-foreground text-center text-base mb-2">
            {authType === "signup" ? "Crie sua conta para começar" : "Entre na sua conta"}
          </p>

          {/* Error Alert */}
          {error && (
            <Alert className="w-full border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <AlertDescription className="text-red-600 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Account type toggle */}
          <div className="flex w-full mb-2 border border-[#E2E2E2] p-1 rounded-full">
            <button
              className={`flex-1 py-2 rounded-full text-base font-semibold transition-colors ${authType === "signin" ? "bg-[#E91E63] text-white" : "bg-background text-foreground"} ${(isSigningUp || isLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAuthTypeChange("signin")}
              type="button"
              disabled={isSigningUp || isLoading}
            >
              {isLoading && authType === "signin" ? "Entrando..." : "Entrar"}
            </button>
            <button
              className={`flex-1 py-2 rounded-full border-border text-base font-semibold transition-colors ${authType === "signup" ? "bg-[#E91E63] text-white" : "bg-background text-foreground"} ${(isSigningUp || isLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleAuthTypeChange("signup")}
              type="button"
              disabled={isSigningUp || isLoading}
            >
              {isSigningUp && authType === "signup" ? "Criando..." : "Cadastrar"}
            </button>
          </div>

          {authType === "signin" ? (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSignIn)} className="w-full flex flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: "E-mail é obrigatório",
                      pattern: {
                        value: /@/,
                        message: "E-mail deve conter o símbolo @"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" type="email" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{
                      required: "Senha é obrigatória"
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite sua senha" type="password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox disabled={isLoading} />
                      <span className="text-muted-foreground text-sm">Lembrar-me</span>
                    </div>
                    <span 
                      className="font-bold text-[#E91E63] dark:text-[#E91E63] hover:underline cursor-pointer text-sm" 
                      onClick={() => navigate("/forgot-password")}
                    >
                      Esqueceu a senha?
                    </span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#E91E63] hover:bg-pink-600 text-white mt-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Entrando...
                      </div>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="flex items-center w-full gap-2 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <GoogleOAuthButton
                role={role as 'creator' | 'brand'}
                disabled={isLoading}
                className="py-2 text-base font-medium rounded-full"
              >
                Continuar com o Google
              </GoogleOAuthButton>
              <div className="text-center w-full mt-2 flex justify-center gap-2">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <div 
                  onClick={() => handleAuthTypeChange("signup")} 
                  className="font-semibold text-pink-500 hover:underline cursor-pointer"
                >
                  Criar conta
                </div>
              </div>
            </>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSignUp)} className="w-full flex flex-col gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{
                      required: "Nome é obrigatório",
                      minLength: {
                        value: 5,
                        message: "Nome deve ter pelo menos 5 caracteres"
                      },
                      maxLength: {
                        value: 30,
                        message: "Nome deve ter menos de 30 caracteres"
                      },
                      pattern: {
                        value: /\s/,
                        message: "Nome deve conter pelo menos um espaço"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} disabled={isSigningUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: "E-mail é obrigatório",
                      pattern: {
                        value: /@/,
                        message: "E-mail deve conter o símbolo @"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" type="email" {...field} disabled={isSigningUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                     rules={{
                        required: "Número de WhatsApp é obrigatório",
                        pattern: {
                                    value:  /^\+(\(?\d{1,4}\)?)[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{0,4}$/,
                                  message: "Insira um número válido (ex: +(351) 912-5678, +(351) 912 56783, +351912345678)"
                                }}}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="+(351) 912-5678"  type="tel" inputMode="tel" {...field} disabled={isSigningUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{
                      required: "Senha é obrigatória",
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/,
                        message: "Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input placeholder="Crie uma senha segura" type="password" {...field} disabled={isSigningUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>                                   
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    rules={{
                      required: "Por favor, confirme sua senha",
                      validate: (value) => {
                        const password = form.getValues("password");
                        return value === password || "Senhas não coincidem";
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input placeholder="Repita a senha" type="password" {...field} disabled={isSigningUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {role === "creator" && (
                    <FormField
                      control={form.control}
                      name="isStudent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              disabled={isSigningUp}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Sou um aluno e quero verificar meu status
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#E91E63] hover:bg-pink-600 text-white mt-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Criando conta...
                      </div>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="flex items-center w-full gap-2 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <GoogleOAuthButton
                role={role as 'creator' | 'brand'}
                isStudent={form.watch('isStudent')}
                disabled={isSigningUp}
                className="py-2 text-base font-medium rounded-full"
              >
                Continuar com o Google
              </GoogleOAuthButton>
              <div className="text-center w-full mt-2 flex justify-center gap-2">
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <div 
                  onClick={() => handleAuthTypeChange("signin")} 
                  className="font-semibold text-pink-500 hover:underline cursor-pointer"
                >
                  Entrar
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Restoration Modal */}
      <AccountRestorationModal
        isOpen={showRestorationModal}
        onClose={() => {
          setShowRestorationModal(false);
          setRestorationData(null);
        }}
        email={restorationData?.can_restore ? form.getValues('email') : undefined}
        onSuccess={() => {
          setShowRestorationModal(false);
          setRestorationData(null);
          // Navigation will be handled by the modal
        }}
      />
    </>
  );
};

export default CreatorSignUp;