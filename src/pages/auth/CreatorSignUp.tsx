import { useState, useEffect, useRef, useLayoutEffect } from "react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

import itiUtils from "intl-tel-input/build/js/utils.js?url";
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
import { Helmet } from "react-helmet-async";
import { loginSuccess } from "../../store/slices/authSlice";
import { AccountRestorationModal } from "../../components/AccountRestorationModal";

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


const E164_REGEX = /^\+?[1-9]\d{1,14}$/;

const CreatorSignUp = () => {
  const { theme } = useTheme();
  const systemTheme = useSystemTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
  const [authType, setAuthType] = useState("signin");
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [showRestorationModal, setShowRestorationModal] = useState(false);
  const [restorationData, setRestorationData] = useState<any>(null);
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loginType } = useParams<{ loginType: string }>();
  const { navigateToRoleDashboard, navigateToStudentVerification, navigateToSubscription } = useRoleNavigation();
  
  
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

  
  const whatsappInputRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<any>(null);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [phonePreviewE164, setPhonePreviewE164] = useState("");
  const [dialCode, setDialCode] = useState("+55");

  const formatBRProgressive = (digits: string): string => {
    
    const d = digits.replace(/\D/g, "");
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  };

  useLayoutEffect(() => {
    
    if (authType !== "signup") return;

    const onCountryChange = () => {
      try {
        const data = itiRef.current?.getSelectedCountryData?.();
        if (data?.dialCode) setDialCode(`+${data.dialCode}`);
      } catch {}
      setTimeout(() => {
        const e164 = itiRef.current?.getNumber?.() || "";
        setPhonePreviewE164(e164);
      }, 0);
    };

    const onInput = () => {
      const e164 = itiRef.current?.getNumber?.() || "";
      setPhonePreviewE164(e164);
      const inputEl = whatsappInputRef.current;
      const raw = inputEl?.value || "";

      
      const utils = (window as any)?.intlTelInputUtils;
      if (utils && itiRef.current?.getNumber) {
        try {
          const national = itiRef.current.getNumber(utils.numberFormat.NATIONAL) || raw;
          if (inputEl && national && national !== raw) {
            const wasEnd = inputEl.selectionStart === raw.length;
            inputEl.value = national;
            if (wasEnd) {
              const len = national.length;
              inputEl.setSelectionRange(len, len);
            }
          }
        } catch {}
      } else {
        
        try {
          const iso2 = itiRef.current?.getSelectedCountryData?.()?.iso2;
          if (iso2 === 'br' && inputEl) {
            const digits = raw.replace(/\D/g, "");
            const national = formatBRProgressive(digits);
            if (national && national !== raw) {
              const wasEnd = inputEl.selectionStart === raw.length;
              inputEl.value = national;
              if (wasEnd) {
                const len = national.length;
                inputEl.setSelectionRange(len, len);
              }
            }
          }
        } catch {}
      }

      const currentVal = inputEl?.value || raw;
      form.setValue("whatsapp", currentVal, { shouldValidate: false, shouldDirty: true });

      
      const digits = currentVal.replace(/\D/g, "");
      const valid = digits.length === 0
        ? true
        : (itiRef.current?.isValidNumber?.() ?? (digits.length >= 10));
      setIsPhoneValid(!!valid);
      if (raw && !valid) {
        form.setError("whatsapp", { type: "manual", message: "Insira um WhatsApp válido. Dica: use (11) 99999-9999 (o DDI é pela bandeira)" });
      } else {
        form.clearErrors("whatsapp");
      }
    };

    const ensureItiAndListeners = () => {
      const el = whatsappInputRef.current;
      if (!el) return;
      
      if (!el.parentElement?.classList.contains("iti")) {
        itiRef.current = intlTelInput(el, {
          initialCountry: "br",
          preferredCountries: ["br", "us", "gb", "pt"],
          nationalMode: true,
          allowDropdown: true,
          separateDialCode: true,
          autoPlaceholder: "aggressive",
          formatOnDisplay: true,
          utilsScript: itiUtils,
        });
        try {
          const data = itiRef.current?.getSelectedCountryData?.();
          if (data?.dialCode) setDialCode(`+${data.dialCode}`);
        } catch {}
      }
      
      if (!(el as any).dataset?.itiListenersAttached) {
        el.addEventListener("countrychange", onCountryChange);
        el.addEventListener("input", onInput);
        el.addEventListener("focus", ensureItiAndListeners);
        (el as any).dataset.itiListenersAttached = "1";
      }
    };

    
    ensureItiAndListeners();
    const t1 = setTimeout(ensureItiAndListeners, 0);
    const t2 = setTimeout(ensureItiAndListeners, 150);
    const t3 = setTimeout(ensureItiAndListeners, 350);
    const raf = requestAnimationFrame(ensureItiAndListeners);

    return () => {
      try {
        const el = whatsappInputRef.current;
        if (el && (el as any).dataset?.itiListenersAttached) {
          el.removeEventListener("countrychange", onCountryChange);
          el.removeEventListener("input", onInput);
          el.removeEventListener("focus", ensureItiAndListeners);
          delete (el as any).dataset.itiListenersAttached;
        }
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        cancelAnimationFrame(raf);
        itiRef.current?.destroy?.();
      } catch {}
    };
  }, [authType]);

  useEffect(() => {
    if (loginType === "login") setAuthType("signin");
  }, [loginType])

  
  useEffect(() => {
    if (role === "creator" && location.pathname === "/signup/creator") {
      setAuthType("signup");
    }
  }, [role, location.pathname])

  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      dispatch(clearError());
    };
  }, [dispatch]);

  
  useEffect(() => {
    
    dispatch(resetLoadingStates());
  }, [dispatch]);


  
  useEffect(() => {
    if (isAuthenticated && user) {
      
      const timeoutId = setTimeout(() => {
        
        if (user.isStudent && user.role === 'creator') {
          navigateToStudentVerification();
        } else if (isNewRegistration && user.role === 'creator') {
          
          const redirectTo = location.state?.redirectTo;
          if (redirectTo) {
            
            const pendingCheckoutSessionId = location.state?.pendingCheckoutSessionId || 
                                           localStorage.getItem('pending_checkout_session_id');
            if (pendingCheckoutSessionId) {
              
              localStorage.setItem('pending_checkout_session_id', pendingCheckoutSessionId);
              localStorage.setItem('pending_checkout_success', 'true');
            }
            navigate(redirectTo, { replace: true });
          } else {
            
            navigateToSubscription();
          }
        } else {
          
          const from = location.state?.from?.pathname;
          if (from) {
            
            const pendingCheckoutSessionId = location.state?.pendingCheckoutSessionId || 
                                           localStorage.getItem('pending_checkout_session_id');
            if (pendingCheckoutSessionId) {
              localStorage.setItem('pending_checkout_session_id', pendingCheckoutSessionId);
              localStorage.setItem('pending_checkout_success', 'true');
            }
            navigate(from, { replace: true });
          } else {
            navigateToRoleDashboard(user.role);
          }
        }
      }, 100); 

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, role, navigateToRoleDashboard, navigateToStudentVerification, navigateToSubscription, location, isNewRegistration, navigate]);

  
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [authType, dispatch]);

  
  const handleAuthTypeChange = (newAuthType: string) => {
    
    if (isSigningUp || isLoading) {
      dispatch(resetLoadingStates());
    }
    
    setAuthType(newAuthType);
    setIsNewRegistration(false); 
    form.reset({
      name: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
      isStudent: false,
    });
    
    
    dispatch(clearError());
  };

  
  const onSignUp = async (data: SignUpFormData) => {
    try {
      
      if (isSigningUp) {
        return;
      }

      
      const utils = (window as any)?.intlTelInputUtils;
      let e164 = itiRef.current?.getNumber
        ? (utils ? itiRef.current.getNumber(utils.numberFormat.E164) : itiRef.current.getNumber())
        : data.whatsapp;
      if (e164 && !String(e164).startsWith('+')) {
        e164 = `+${String(e164).replace(/[^\d]/g, '')}`;
      }
      let digitsE164 = String(e164 || '').replace(/\D/g, '');
      
      if (!e164 || !E164_REGEX.test(String(e164))) {
        try {
          const selected = itiRef.current?.getSelectedCountryData?.();
          const dialFromState = (dialCode || '+55').replace(/\D/g, '');
          const dial = selected?.dialCode || dialFromState || '55';
          const rawDigits = String(data.whatsapp || '').replace(/\D/g, '');
          const builtFallback = rawDigits ? `+${dial}${rawDigits}` : '';
          if (builtFallback) {
            e164 = builtFallback;
            digitsE164 = String(e164).replace(/\D/g, '');
          }
          
        } catch {}
      }
      if (!(isPhoneValid || digitsE164.length >= 11)) {
        toast.error("Insira um WhatsApp válido. Dica: use (11) 99999-9999 (o DDI é pela bandeira)");
        return;
      }

      const signupData = {
        name: data.name,
        email: data.email,
        whatsapp: e164 || data.whatsapp,
        password: data.password,
        password_confirmation: data.confirmPassword,
        isStudent: data.isStudent,
        role: (role as 'creator' | 'brand') || 'creator',
      };
      

      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000); 
      });

      const response = await Promise.race([
        dispatch(signupUser(signupData)).unwrap(),
        timeoutPromise
      ]) as any;
      
      
      if (!isMountedRef.current) return;
      
      if (response.user !== null) {
        toast.success("Conta criada com sucesso! Você foi automaticamente logado.");
        toast.message("Verify Email");
        setIsNewRegistration(true); 
        
        
        
        if (response.token) {
          
          dispatch(loginSuccess({
            user: response.user,
            token: response.token
          }));
        }
      }
      
    } catch (error: any) {
      
      if (!isMountedRef.current) return;
      
      
      dispatch(clearError());
      
      
      if (error.message === 'Request timeout - please try again') {
        toast.error("A solicitação demorou muito para responder. Tente novamente.");
      }
      
      else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retry_after || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const errorMessage = `Muitas tentativas de registro. Tente novamente em ${minutes} minuto(s).`;
        toast.error(errorMessage);
      } 
      
      else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      
      else if (error.response?.status >= 500) {
        toast.error("Erro interno do servidor. Tente novamente em alguns minutos.");
      }
      
      else if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors && typeof errors === 'object') {
          const parts: string[] = [];
          for (const key of Object.keys(errors)) {
            const msgs = errors[key];
            if (Array.isArray(msgs) && msgs.length > 0) {
              parts.push(`${key}: ${msgs[0]}`);
              
              try {
                if (key === 'email' || key === 'name' || key === 'password' || key === 'password_confirmation' || key === 'whatsapp') {
                  form.setError(key as any, { type: 'server', message: msgs[0] });
                }
              } catch {}
            }
          }
          if (parts.length > 0) {
            toast.error(parts.join(" | "));
          } else {
            const errorMessage = error.response?.data?.message || "Dados inválidos. Verifique os campos e tente novamente.";
            toast.error(errorMessage);
          }
        } else {
          const errorMessage = error.response?.data?.message || "Dados inválidos. Verifique os campos e tente novamente.";
          toast.error(errorMessage);
        }
      }
      
      else if (error?.type === 'account_removed_restorable') {
        setRestorationData(error);
        setShowRestorationModal(true);
        return;
      }
      
      else {
        const errorMessage = error.response?.data?.message || error.message || "Erro ao criar conta. Tente novamente.";
        toast.error(errorMessage);
      }
      
    }
  };

  
  const onSignIn = async (data: SignInFormData) => {
    try {
      const loginData = {
        email: data.email,
        password: data.password,
      };

      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000); 
      });

      const response = await Promise.race([
        dispatch(loginUser(loginData)).unwrap(),
        timeoutPromise
      ]) as any;
      
      
      if (!isMountedRef.current) return;
      
      if (response.user !== null) {
        toast.success("Você fez login com sucesso.");
        
      }
    } catch (error: any) {
      if (error === 'account_removed_restorable' || error?.type === 'account_removed_restorable') {
        setRestorationData(error);
        setShowRestorationModal(true);
        return;
      }
      
      if (!isMountedRef.current) return;
      
      
      if (error.message === 'Request timeout - please try again') {
        toast.error("A solicitação demorou muito para responder. Tente novamente.");
      }
      
      else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retry_after || 60;
        const minutes = Math.ceil(retryAfter / 60);
        const errorMessage = `Muitas tentativas de login. Tente novamente em ${minutes} minuto(s).`;
        toast.error(errorMessage);
      } 
      
      else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      
      else if (error.response?.status >= 500) {
        toast.error("Erro interno do servidor. Tente novamente em alguns minutos.");
      }
      
      else if (error.response?.status === 422) {
        
        let errorMessage = error.response?.data?.message;
        
        if (!errorMessage && error.response?.data?.errors) {
          
          const errors = error.response.data.errors;
          if (errors.email && Array.isArray(errors.email)) {
            errorMessage = errors.email[0];
          } else if (errors.email) {
            errorMessage = errors.email;
          } else {
            
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey) {
              const firstError = errors[firstErrorKey];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            }
          }
        }
        
        
        if (errorMessage && errorMessage.includes('bloqueada')) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage || "Dados inválidos. Verifique os campos e tente novamente.");
        }
      }
      
      else {
        let errorMessage = error.response?.data?.message || error.message;
        
        
        if (typeof error === 'string') {
          errorMessage = error;
        }
        
        
        if (errorMessage && errorMessage.includes('bloqueada')) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage || "Erro ao fazer login. Tente novamente.");
        }
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

          {}
          {error && (
            <Alert className="w-full border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <AlertDescription className="text-red-600 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {}
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
                    rules={{
                      validate: (value) => {
                        if (!value) return true;
                        const raw = String(value);
                        const digits = raw.replace(/\D/g, "");
                        const utils = (window as any)?.intlTelInputUtils;
                        const e164Try = itiRef.current?.getNumber
                          ? (utils ? itiRef.current.getNumber(utils.numberFormat.E164) : itiRef.current.getNumber())
                          : raw;
                        const digitsE164 = String(e164Try || "").replace(/\D/g, "");
                        const pluginValid = itiRef.current?.isValidNumber ? itiRef.current.isValidNumber() : false;
                        const fallbackValid = digits.length >= 10 || digitsE164.length >= 11 || E164_REGEX.test(String(e164Try || ""));
                        return (isPhoneValid || pluginValid || fallbackValid) || "Insira um WhatsApp válido. Dica: use (11) 99999-9999 (o DDI é pela bandeira)";
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            type="tel"
                            {...field}
                            
                            ref={(el) => {
                              whatsappInputRef.current = el;
                              
                              if (typeof field.ref === 'function') field.ref(el);
                              else (field as any).ref = el;
                            }}
                            disabled={isSigningUp}
                          />
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
      {}
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
        }}
      />
    </>
  );
};

export default CreatorSignUp;