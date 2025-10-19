import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoleNavigation } from '../../hooks/useRoleNavigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, CreditCard, User, Building2, AlertCircle } from 'lucide-react';

const initialState = {
  fullName: '',
  purchaseEmail: '',
  cpf: '',
  courseName: '',
};

const stripeVerificationState = {
  accountType: 'individual', // 'individual' or 'business'
  businessName: '',
  businessType: '',
  country: 'BR',
  email: '',
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
  },
  dob: {
    day: '',
    month: '',
    year: '',
  },
  idNumber: '',
  verificationStatus: 'pending', // 'pending', 'verified', 'failed'
};

interface StudentVerifyProps {
  setComponent?: (component: string) => void;
}

export default function StudentVerify({ setComponent }: StudentVerifyProps = {}) {
  const [form, setForm] = useState(initialState);
  const [stripeForm, setStripeForm] = useState(stripeVerificationState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStripeSubmitting, setIsStripeSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('student');
  const { navigateToRoleDashboard } = useRoleNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're inside the Creator dashboard
  const isInsideCreatorDashboard = location.pathname === '/creator' && setComponent;
  
  // Check if user is already verified as a student
  useEffect(() => {
    if (user?.student_verified) {
      toast.success('Você já está verificado como aluno!');
      if (isInsideCreatorDashboard) {
        // If inside Creator dashboard, just show success message
        return;
      } else {
        // If on standalone page, redirect to dashboard
        setTimeout(() => {
          navigateToRoleDashboard('creator');
        }, 2000);
      }
    }
  }, [user, navigateToRoleDashboard, isInsideCreatorDashboard]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleStripeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setStripeForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setStripeForm({ ...stripeForm, [name]: value });
    }
    
    // Clear error when user starts typing
    if (stripeError) setStripeError(null);
  };

  const handleSkip = () => {
    toast.info('Pulando verificação de aluno. Você pode verificar seu status posteriormente no dashboard.');
    if (isInsideCreatorDashboard) {
      // If inside Creator dashboard, navigate to main dashboard
      setComponent?.('Painel');
    } else {
      // If on standalone page, redirect to dashboard
      navigateToRoleDashboard('creator');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Check if user is already verified
    if (user?.student_verified) {
      toast.info('Você já está verificado como aluno!');
      if (isInsideCreatorDashboard) {
        setComponent?.('Painel');
      } else {
        navigateToRoleDashboard('creator');
      }
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      const requiredFields = ['fullName', 'purchaseEmail', 'cpf', 'courseName'];
      const missingFields = requiredFields.filter(field => !form[field as keyof typeof form].trim());
      
      if (missingFields.length > 0) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.purchaseEmail)) {
        setError('Por favor, insira um e-mail de compra válido.');
        return;
      }

      // Validate CPF format (basic validation)
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
      if (!cpfRegex.test(form.cpf.replace(/\D/g, ''))) {
        setError('Por favor, insira um CPF válido.');
        return;
      }


      // Prepare submission data
      const submissionData = {
        full_name: form.fullName,
        purchase_email: form.purchaseEmail,
        cpf: form.cpf.replace(/\D/g, ''), // Remove non-digits
        course_name: form.courseName,
      };

      // Call API to submit student verification
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api/student/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao verificar status de aluno');
      }

      if (result.success) {
        toast.success('Verificação de aluno enviada com sucesso! Você receberá acesso gratuito por 1 mês.');
        
        // Update user state to reflect student verification
        if (user) {
          dispatch({
            type: 'auth/updateUser',
            payload: {
              student_verified: true,
              student_expires_at: result.student_expires_at,
              free_trial_expires_at: result.free_trial_expires_at,
            }
          });
        }

        // Navigate to creator dashboard
        if (isInsideCreatorDashboard) {
          setComponent?.('Painel');
        } else {
          navigateToRoleDashboard('creator');
        }
      } else {
        throw new Error(result.message || 'Falha na verificação');
      }

    } catch (err: any) {
      console.error('Student verification error:', err);
      setError(err.message || 'Erro ao verificar status de aluno. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isStripeSubmitting) return;
    
    setIsStripeSubmitting(true);
    setStripeError(null);

    try {
      // Validate required fields
      const requiredFields = ['email', 'phone', 'address.line1', 'address.city', 'address.state', 'address.postal_code'];
      const missingFields = requiredFields.filter(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], stripeForm);
        return !value || !value.trim();
      });
      
      if (missingFields.length > 0) {
        setStripeError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stripeForm.email)) {
        setStripeError('Por favor, insira um e-mail válido.');
        return;
      }

      // Validate phone format (Brazilian phone)
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(stripeForm.phone)) {
        setStripeError('Por favor, insira um telefone válido no formato (XX) XXXX-XXXX.');
        return;
      }

      // Prepare Stripe account creation data
      const stripeAccountData = {
        type: stripeForm.accountType,
        country: stripeForm.country,
        email: stripeForm.email,
        business_type: stripeForm.accountType === 'business' ? 'company' : 'individual',
        individual: stripeForm.accountType === 'individual' ? {
          first_name: user?.name?.split(' ')[0] || '',
          last_name: user?.name?.split(' ').slice(1).join(' ') || '',
          email: stripeForm.email,
          phone: stripeForm.phone,
          address: {
            line1: stripeForm.address.line1,
            line2: stripeForm.address.line2,
            city: stripeForm.address.city,
            state: stripeForm.address.state,
            postal_code: stripeForm.address.postal_code,
            country: stripeForm.country,
          },
          dob: {
            day: parseInt(stripeForm.dob.day),
            month: parseInt(stripeForm.dob.month),
            year: parseInt(stripeForm.dob.year),
          },
          id_number: stripeForm.idNumber,
        } : undefined,
        company: stripeForm.accountType === 'business' ? {
          name: stripeForm.businessName,
          structure: stripeForm.businessType,
          address: {
            line1: stripeForm.address.line1,
            line2: stripeForm.address.line2,
            city: stripeForm.address.city,
            state: stripeForm.address.state,
            postal_code: stripeForm.address.postal_code,
            country: stripeForm.country,
          },
        } : undefined,
      };

      // Call API to create Stripe account
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/api/stripe/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(stripeAccountData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar conta Stripe');
      }

      if (result.success) {
        toast.success('Conta Stripe criada com sucesso! Verificação em andamento...');
        
        // Update user state to reflect Stripe account creation
        if (user) {
          dispatch({
            type: 'auth/updateUser',
            payload: {
              stripe_account_id: result.stripe_account_id,
              stripe_verification_status: 'pending',
            }
          });
        }

        // Navigate to creator dashboard
        if (isInsideCreatorDashboard) {
          setComponent?.('Painel');
        } else {
          navigateToRoleDashboard('creator');
        }
      } else {
        throw new Error(result.message || 'Falha na criação da conta Stripe');
      }

    } catch (err: any) {
      console.error('Stripe verification error:', err);
      setStripeError(err.message || 'Erro ao criar conta Stripe. Tente novamente.');
    } finally {
      setIsStripeSubmitting(false);
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
  };

  return (
    <>
      {!isInsideCreatorDashboard && (
        <Helmet>
          <title>Nexa - Verificação de aluno</title>
          <meta name="description" content="Verifique seu status de aluno para obter acesso gratuito à plataforma Nexa." />
          {canonical && <link rel="canonical" href={canonical} />}
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
      )}
      <div className={`${isInsideCreatorDashboard ? 'p-6 w-full min-h-[92vh] flex justify-center items-center' : 'min-h-screen flex items-center justify-center bg-muted py-8 px-2 dark:bg-background relative'}`}>
        {!isInsideCreatorDashboard && (
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>
        )}
        <div className={`w-full max-w-4xl bg-background rounded-xl shadow-lg relative border ${isInsideCreatorDashboard ? 'p-6' : 'p-8 md:p-12'}`}>
          <h1 className={`font-bold mb-2 text-foreground ${isInsideCreatorDashboard ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
            Verificação de Conta
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl text-sm md:text-base">
            {user?.student_verified 
              ? "Você já foi verificado como aluno! Redirecionando para o painel..."
              : "Escolha uma das opções abaixo para verificar sua conta e obter acesso completo à plataforma."
            }
          </p>
          {/* Success Alert for Already Verified Students */}
          {user?.student_verified && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✅ Você já está verificado como aluno! Redirecionando para o dashboard...
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Verificação de Aluno
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Conta Stripe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#E91E63]" />
                    Verificação de Aluno
                  </CardTitle>
                  <CardDescription>
                    Preencha suas informações educacionais para obter acesso gratuito por até 12 meses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-2 bg-[#FAF5FF] dark:bg-[#30253d]">
                    <div className="flex-1">
                      <AlertTitle className="font-semibold text-primary text-sm md:text-base">
                        <span className="mr-2 text-[#A873E9]">ⓘ</span>Os alunos do curso recebem acesso 100% gratuito!
                      </AlertTitle>
                    </div>
                    <AlertDescription className="text-xs md:text-sm text-muted-foreground">
                      Não perca.
                    </AlertDescription>
                  </Alert>

                  {/* Error Alert */}
                  {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${user?.student_verified ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-xs text-muted-foreground">Nome completo</label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Your name as it appears on the course"
                value={form.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                disabled={isSubmitting}
              />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="purchaseEmail" className="text-xs text-muted-foreground">E-mail de compra</label>
            <Input
              id="purchaseEmail"
              name="purchaseEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={form.purchaseEmail}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cpf" className="text-xs text-muted-foreground">CPF</label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
              required
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="courseName" className="text-xs text-muted-foreground">Nome do curso</label>
            <Input
              id="courseName"
              name="courseName"
              type="text"
              placeholder="Nome do curso que você comprou"
              value={form.courseName}
              onChange={handleChange}
              required
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-[#E91E63] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                'Enviar para verificação'
              )}
            </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleSkip}
                      className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      disabled={isSubmitting}
                    >
                      Pular por enquanto
                    </Button>
                  </div>
                </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stripe" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#635BFF]" />
                    Verificação de Conta Stripe
                  </CardTitle>
                  <CardDescription>
                    Crie uma conta Stripe para receber pagamentos e ter acesso completo à plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-2 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex-1">
                      <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300 text-sm md:text-base">
                        <span className="mr-2">💳</span>Conta Stripe necessária para receber pagamentos
                      </AlertTitle>
                    </div>
                    <AlertDescription className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                      Verificação em até 24h.
                    </AlertDescription>
                  </Alert>

                  {/* Stripe Error Alert */}
                  {stripeError && (
                    <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        {stripeError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleStripeVerification} className="space-y-6">
                    {/* Account Type Selection */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Tipo de Conta</label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={stripeForm.accountType === 'individual' ? 'default' : 'outline'}
                          onClick={() => setStripeForm({...stripeForm, accountType: 'individual'})}
                          className="flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Pessoa Física
                        </Button>
                        <Button
                          type="button"
                          variant={stripeForm.accountType === 'business' ? 'default' : 'outline'}
                          onClick={() => setStripeForm({...stripeForm, accountType: 'business'})}
                          className="flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4" />
                          Empresa
                        </Button>
                      </div>
                    </div>

                    {/* Business Information */}
                    {stripeForm.accountType === 'business' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="businessName" className="text-xs text-muted-foreground">Nome da Empresa</label>
                          <Input
                            id="businessName"
                            name="businessName"
                            type="text"
                            placeholder="Nome da sua empresa"
                            value={stripeForm.businessName}
                            onChange={handleStripeChange}
                            required
                            disabled={isStripeSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="businessType" className="text-xs text-muted-foreground">Tipo de Empresa</label>
                          <select
                            id="businessType"
                            name="businessType"
                            value={stripeForm.businessType}
                            onChange={handleStripeChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isStripeSubmitting}
                          >
                            <option value="">Selecione o tipo</option>
                            <option value="corporation">Corporação</option>
                            <option value="partnership">Sociedade</option>
                            <option value="llc">LLC</option>
                            <option value="sole_proprietorship">Empresa Individual</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-xs text-muted-foreground">E-mail</label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={stripeForm.email}
                          onChange={handleStripeChange}
                          required
                          disabled={isStripeSubmitting}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="phone" className="text-xs text-muted-foreground">Telefone</label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={stripeForm.phone}
                          onChange={handleStripeChange}
                          required
                          disabled={isStripeSubmitting}
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Endereço</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="address.line1" className="text-xs text-muted-foreground">Endereço</label>
                          <Input
                            id="address.line1"
                            name="address.line1"
                            type="text"
                            placeholder="Rua, número"
                            value={stripeForm.address.line1}
                            onChange={handleStripeChange}
                            required
                            disabled={isStripeSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="address.line2" className="text-xs text-muted-foreground">Complemento</label>
                          <Input
                            id="address.line2"
                            name="address.line2"
                            type="text"
                            placeholder="Apto, bloco, etc."
                            value={stripeForm.address.line2}
                            onChange={handleStripeChange}
                            disabled={isStripeSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="address.city" className="text-xs text-muted-foreground">Cidade</label>
                          <Input
                            id="address.city"
                            name="address.city"
                            type="text"
                            placeholder="São Paulo"
                            value={stripeForm.address.city}
                            onChange={handleStripeChange}
                            required
                            disabled={isStripeSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="address.state" className="text-xs text-muted-foreground">Estado</label>
                          <Input
                            id="address.state"
                            name="address.state"
                            type="text"
                            placeholder="SP"
                            value={stripeForm.address.state}
                            onChange={handleStripeChange}
                            required
                            disabled={isStripeSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="address.postal_code" className="text-xs text-muted-foreground">CEP</label>
                          <Input
                            id="address.postal_code"
                            name="address.postal_code"
                            type="text"
                            placeholder="01234-567"
                            value={stripeForm.address.postal_code}
                            onChange={handleStripeChange}
                            required
                            disabled={isStripeSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date of Birth (for individuals) */}
                    {stripeForm.accountType === 'individual' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Data de Nascimento</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="dob.day" className="text-xs text-muted-foreground">Dia</label>
                            <Input
                              id="dob.day"
                              name="dob.day"
                              type="number"
                              placeholder="01"
                              min="1"
                              max="31"
                              value={stripeForm.dob.day}
                              onChange={handleStripeChange}
                              required
                              disabled={isStripeSubmitting}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="dob.month" className="text-xs text-muted-foreground">Mês</label>
                            <Input
                              id="dob.month"
                              name="dob.month"
                              type="number"
                              placeholder="01"
                              min="1"
                              max="12"
                              value={stripeForm.dob.month}
                              onChange={handleStripeChange}
                              required
                              disabled={isStripeSubmitting}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="dob.year" className="text-xs text-muted-foreground">Ano</label>
                            <Input
                              id="dob.year"
                              name="dob.year"
                              type="number"
                              placeholder="1990"
                              min="1900"
                              max="2010"
                              value={stripeForm.dob.year}
                              onChange={handleStripeChange}
                              required
                              disabled={isStripeSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ID Number */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="idNumber" className="text-xs text-muted-foreground">
                        {stripeForm.accountType === 'individual' ? 'CPF' : 'CNPJ'}
                      </label>
                      <Input
                        id="idNumber"
                        name="idNumber"
                        type="text"
                        placeholder={stripeForm.accountType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                        value={stripeForm.idNumber}
                        onChange={handleStripeChange}
                        required
                        disabled={isStripeSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto bg-[#635BFF] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isStripeSubmitting}
                      >
                        {isStripeSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Criando conta...
                          </div>
                        ) : (
                          'Criar Conta Stripe'
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleSkip}
                        className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        disabled={isStripeSubmitting}
                      >
                        Pular por enquanto
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
