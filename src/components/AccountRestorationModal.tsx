import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { accountApi } from '../api/account';
import { useAppDispatch } from '../store/hooks';
import { loginSuccess } from '../store/slices/authSlice';

interface AccountRestorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  onSuccess?: () => void;
}

export const AccountRestorationModal: React.FC<AccountRestorationModalProps> = ({
  isOpen,
  onClose,
  email: initialEmail = '',
  onSuccess,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    can_restore: boolean;
    days_since_deletion: number;
    deleted_at: string;
  } | null>(null);
  
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const handleCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "E-mail necessário",
        description: "Por favor, digite seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);

    try {
      const response = await accountApi.checkRemovedAccount({
        email: email.trim(),
      });

      if (response.success) {
        setAccountInfo({
          can_restore: response.can_restore,
          days_since_deletion: response.days_since_deletion,
          deleted_at: response.deleted_at,
        });

        if (!response.can_restore) {
          toast({
            title: "Conta não pode ser restaurada",
            description: response.message || "Esta conta foi removida há mais de 30 dias e não pode ser restaurada automaticamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Conta não encontrada",
          description: response.message || "Nenhuma conta removida encontrada com este e-mail.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error checking account:', error);
      toast({
        title: "Erro ao verificar conta",
        description: error.response?.data?.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRestoreAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Senha necessária",
        description: "Por favor, digite sua senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await accountApi.restoreAccount({
        email: email.trim(),
        password: password.trim(),
      });

      if (response.success && response.token && response.user) {
        toast({
          title: "Conta restaurada!",
          description: response.message,
        });
        console.log(response)
       //Login the user
       dispatch(loginSuccess({
              user: response.user,
              token: response.token,
          }));

        console.log(response)
        // Close modal
        onClose();
        
        // Call success callback
        onSuccess?.();
        
        // Redirect to dashboard
      } else {
        toast({
          title: "Erro ao restaurar conta",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error restoring account:', error);
      toast({
        title: "Erro ao restaurar conta",
        description: error.response?.data?.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isChecking) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setAccountInfo(null);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="w-5 h-5" />
            Restaurar Conta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!accountInfo ? (
            <form onSubmit={handleCheckAccount} className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Verificar conta removida</p>
                    <p>Digite seu e-mail para verificar se sua conta pode ser restaurada.</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail da conta removida</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  disabled={isChecking}
                />
              </div>

              <Button
                type="submit"
                disabled={!email.trim() || isChecking}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Conta'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRestoreAccount} className="space-y-4">
              <div className={`p-4 border rounded-lg ${
                accountInfo.can_restore 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {accountInfo.can_restore ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className={`text-sm ${
                    accountInfo.can_restore 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {accountInfo.can_restore ? (
                      <>
                        <p className="font-medium mb-1">Conta pode ser restaurada!</p>
                        <p>
                          Sua conta foi removida há {accountInfo.days_since_deletion} dias 
                          (em {formatDate(accountInfo.deleted_at)}).
                        </p>
                        <p className="mt-2 font-medium">
                          Digite sua senha para restaurar sua conta.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-1">Conta não pode ser restaurada</p>
                        <p>
                          Sua conta foi removida há {accountInfo.days_since_deletion} dias 
                          (em {formatDate(accountInfo.deleted_at)}).
                        </p>
                        <p className="mt-2">
                          Contas removidas há mais de 30 dias não podem ser restauradas automaticamente.
                          Entre em contato com o suporte.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {accountInfo.can_restore && (
                <>
                  <div>
                    <Label htmlFor="restore-email">E-mail</Label>
                    <Input
                      id="restore-email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="restore-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="restore-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAccountInfo(null)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!password.trim() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        'Restaurar Conta'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
