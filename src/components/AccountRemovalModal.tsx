import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { accountApi } from '../api/account';
import { useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/thunks/authThunks';

interface AccountRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountRemovalModal: React.FC<AccountRemovalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const isConfirmValid = confirmText.toLowerCase() === 'remover';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmValid) {
      toast({
        title: "Confirmação necessária",
        description: "Por favor, digite 'REMOVER' para confirmar a exclusão da conta.",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Senha necessária",
        description: "Por favor, digite sua senha para confirmar a remoção da conta.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await accountApi.removeAccount({
        password: password.trim(),
        reason: reason.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: "Conta removida",
          description: response.message,
        });

        // Logout the user
        await dispatch(logoutUser());
        
        // Close modal
        onClose();
        
        // Redirect to login page
        window.location.href = '/auth/login';
      } else {
        toast({
          title: "Erro ao remover conta",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast({
        title: "Erro ao remover conta",
        description: error.response?.data?.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setReason('');
      setConfirmText('');
      setShowPassword(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Remover Conta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium mb-2">Atenção: Esta ação não pode ser desfeita!</p>
                <ul className="space-y-1 text-xs">
                  <li>• Sua conta será removida permanentemente</li>
                  <li>• Todos os seus dados serão perdidos</li>
                  <li>• Você não poderá mais acessar a plataforma</li>
                  <li>• Você pode restaurar sua conta dentro de 30 dias</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Senha atual</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
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

            <div>
              <Label htmlFor="reason">Motivo da remoção (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Conte-nos por que você está removendo sua conta..."
                disabled={isLoading}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/500 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="confirm">
                Para confirmar, digite <span className="font-bold text-red-600">REMOVER</span>:
              </Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite REMOVER"
                disabled={isLoading}
                className={!isConfirmValid && confirmText ? 'border-red-500' : ''}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!isConfirmValid || isLoading || !password.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  'Remover Conta'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
