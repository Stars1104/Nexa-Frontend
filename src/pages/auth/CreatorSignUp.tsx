import { useState, useEffect } from "react";
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
import { clearError } from "../../store/slices/authSlice";
import { toast } from "sonner";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";
import GoogleOAuthButton from "../../components/GoogleOAuthButton";
import { Helmet } from "react-helmet-async";

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
  const [authType, setAuthType] = useState("signup");
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loginType } = useParams<{ loginType: string }>();
  const { navigateToRoleDashboard, navigateToStudentVerification, navigateToSubscription } = useRoleNavigation();
  
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

  // Effect to handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
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
    if (error) {
      dispatch(clearError());
    }
  };

  // Sign up Function
  const onSignUp = async (data: SignUpFormData) => {
    try {
      const signupData = {
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        password: data.password,
        password_confirmation: data.confirmPassword,
        isStudent: data.isStudent,
        role: (role as 'creator' | 'brand') || 'creator',
      };

      const response = await dispatch(signupUser(signupData)).unwrap();
      if (response.user !== null) {
        toast.success("Conta criada com sucesso!");
        setIsNewRegistration(true); // Set flag for new registration
      }
      // Navigation will be handled by useEffect after successful signup
    } catch (error: any) {
      // Display specific error message in toast
      const errorMessage = error || "Erro ao criar conta. Tente novamente.";
      toast.error(errorMessage);
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

      const response = await dispatch(loginUser(loginData)).unwrap();
      if (response.user !== null) {
        toast.success("Você fez login com sucesso.");
        // Navigation will be handled by useEffect after successful login
      }
    } catch (error: any) {
      // Display specific error message in toast
      const errorMessage = error || "Erro ao fazer login. Tente novamente.";
      toast.error(errorMessage);
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
              className={`flex-1 py-2 rounded-full text-base font-semibold transition-colors ${authType === "signup" ? "bg-[#E91E63] text-white" : "bg-background text-foreground"}`}
              onClick={() => handleAuthTypeChange("signup")}
              type="button"
              disabled={isSigningUp || isLoading}
            >
              Cadastrar
            </button>
            <button
              className={`flex-1 py-2 rounded-full border-border text-base font-semibold transition-colors ${authType === "signin" ? "bg-[#E91E63] text-white" : "bg-background text-foreground"}`}
              onClick={() => handleAuthTypeChange("signin")}
              type="button"
              disabled={isSigningUp || isLoading}
            >
              Entrar
            </button>
          </div>

          {authType === "signup" ? (
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
                        message: "Nome deve ter menos de 15 caracteres"
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} disabled={isSigningUp} />
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
                            Sou um estudante e quero verificar meu status
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#E91E63] hover:bg-pink-600 text-white mt-2 rounded-full"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? "Criando conta..." : "Criar conta"}
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
          ) : (
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
                    className="w-full bg-[#E91E63] hover:bg-pink-600 text-white mt-2 rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
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
          )}
        </div>
      </div>
    </>
  );
};

export default CreatorSignUp;