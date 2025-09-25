import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useRoleNavigation } from '../../hooks/useRoleNavigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const initialState = {
  fullName: '',
  academicEmail: '',
  cpf: '',
  enrollment: '',
  dob: '',
  courseName: '',
  institution: '',
};

export default function StudentVerify() {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { navigateToRoleDashboard } = useRoleNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Check if user is already verified as a student
  useEffect(() => {
    if (user?.student_verified) {
      toast.success('Você já está verificado como estudante! Redirecionando para o dashboard...');
      setTimeout(() => {
        navigateToRoleDashboard('creator');
      }, 2000);
    }
  }, [user, navigateToRoleDashboard]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Check if user is already verified
    if (user?.student_verified) {
      toast.info('Você já está verificado como estudante!');
      navigateToRoleDashboard('creator');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      const requiredFields = ['fullName', 'academicEmail', 'cpf', 'enrollment', 'dob', 'courseName', 'institution'];
      const missingFields = requiredFields.filter(field => !form[field as keyof typeof form].trim());
      
      if (missingFields.length > 0) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.academicEmail)) {
        setError('Por favor, insira um email acadêmico válido.');
        return;
      }

      // Validate CPF format (basic validation)
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
      if (!cpfRegex.test(form.cpf.replace(/\D/g, ''))) {
        setError('Por favor, insira um CPF válido.');
        return;
      }

      // Validate date format
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(form.dob)) {
        setError('Por favor, insira a data no formato DD/MM/AAAA.');
        return;
      }

      // Prepare submission data
      const submissionData = {
        full_name: form.fullName,
        academic_email: form.academicEmail,
        cpf: form.cpf.replace(/\D/g, ''), // Remove non-digits
        enrollment: form.enrollment,
        date_of_birth: form.dob,
        course_name: form.courseName,
        institution: form.institution,
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
        throw new Error(result.message || 'Erro ao verificar status de estudante');
      }

      if (result.success) {
        toast.success('Verificação de estudante enviada com sucesso! Você receberá acesso gratuito por 1 mês.');
        
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
        navigateToRoleDashboard('creator');
      } else {
        throw new Error(result.message || 'Falha na verificação');
      }

    } catch (err: any) {
      console.error('Student verification error:', err);
      setError(err.message || 'Erro ao verificar status de estudante. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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
        <title>Nexa - Verificação de Estudante</title>
        <meta name="description" content="Verifique seu status de estudante para obter acesso gratuito à plataforma Nexa." />
        {canonical && <link rel="canonical" href={canonical} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-muted py-8 px-2 dark:bg-background relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-2xl bg-background rounded-xl shadow-lg p-8 md:p-12 relative border">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Complete your student verification</h1>
          <p className="text-muted-foreground mb-6 max-w-2xl text-sm md:text-base">
            {user?.student_verified 
              ? "You are already verified as a student! Redirecting to dashboard..."
              : "Fill in your education information below to verify your student status and get free access for up to 12 months."
            }
          </p>
          <Alert className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-2 bg-[#FAF5FF] dark:bg-[#30253d]">
            <div className="flex-1">
              <AlertTitle className="font-semibold text-primary text-sm md:text-base">
                <span className="mr-2 text-[#A873E9]">ⓘ</span>Course students receive 100% free access!
              </AlertTitle>
            </div>
            <AlertDescription className="text-xs md:text-sm text-muted-foreground">
              Don't miss it.
            </AlertDescription>
          </Alert>

          {/* Success Alert for Already Verified Students */}
          {user?.student_verified && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✅ Você já está verificado como estudante! Redirecionando para o dashboard...
              </AlertDescription>
            </Alert>
          )}

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
            <label htmlFor="academicEmail" className="text-xs text-muted-foreground">Academic email (course)</label>
            <Input
              id="academicEmail"
              name="academicEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={form.academicEmail}
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
            <label htmlFor="enrollment" className="text-xs text-muted-foreground">Enrollment / RA</label>
            <Input
              id="enrollment"
              name="enrollment"
              type="text"
              placeholder="Student registration number"
              value={form.enrollment}
              onChange={handleChange}
              required
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dob" className="text-xs text-muted-foreground">Date of birth</label>
            <Input
              id="dob"
              name="dob"
              type="text"
              placeholder="DD/MM/AAAA"
              value={form.dob}
              onChange={handleChange}
              required
              autoComplete="bday"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="courseName" className="text-xs text-muted-foreground">Course name</label>
            <Input
              id="courseName"
              name="courseName"
              type="text"
              placeholder="Digital Marketing Course, for example"
              value={form.courseName}
              onChange={handleChange}
              required
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="institution" className="text-xs text-muted-foreground">Nome da instituição</label>
            <Input
              id="institution"
              name="institution"
              type="text"
              placeholder="Nome completo da escola/plataforma"
              value={form.institution}
              onChange={handleChange}
              required
              autoComplete="organization"
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2 mt-4">
            <Button 
              type="submit" 
              className="w-full md:w-auto bg-[#E91E63] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                'Submit for verification'
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
