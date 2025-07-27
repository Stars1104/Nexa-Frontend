import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { pagarmeAuthApi, PagarMeAuthRequest } from '@/api/auth/pagarmeAuth';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { Loader2, CreditCard, User, Mail } from 'lucide-react';

interface PagarMeAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'login' | 'link';
}

export default function PagarMeAuth({ onSuccess, onCancel, mode = 'login' }: PagarMeAuthProps) {
  const [formData, setFormData] = useState<PagarMeAuthRequest>({
    account_id: '',
    email: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        // Authenticate user
        const response = await pagarmeAuthApi.authenticate(formData);
        
        if (response.success) {
          // Dispatch login success
          dispatch(loginSuccess({
            user: response.user,
            token: response.token
          }));

          toast({
            title: "Autenticação bem-sucedida!",
            description: "Você foi autenticado com sucesso usando sua conta Pagar.me.",
          });

          onSuccess?.();
        }
      } else if (mode === 'link') {
        // Link account
        const response = await pagarmeAuthApi.linkAccount({
          account_id: formData.account_id
        });
        
        if (response.success) {
          toast({
            title: "Conta vinculada!",
            description: "Sua conta foi vinculada com sucesso ao Pagar.me.",
          });

          onSuccess?.();
        }
      }
    } catch (error: any) {
      console.error('Pagar.me authentication error:', error);
      
      let errorMessage = 'Erro na autenticação. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro na autenticação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CreditCard className="h-12 w-12 text-blue-600" />
        </div>
        <CardTitle>
          {mode === 'login' ? 'Entrar com Pagar.me' : 'Vincular Conta Pagar.me'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? 'Use sua conta Pagar.me para acessar a plataforma'
            : 'Vincule sua conta Pagar.me à sua conta atual'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="account_id">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account ID
              </div>
            </Label>
            <Input
              id="account_id"
              name="account_id"
              type="text"
              placeholder="Digite seu Account ID do Pagar.me"
              value={formData.account_id}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          {mode === 'login' && (
            <div className="space-y-2">
              <Label htmlFor="name">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </div>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.account_id || !formData.email || (mode === 'login' && !formData.name)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Entrando...' : 'Vinculando...'}
                </>
              ) : (
                mode === 'login' ? 'Entrar' : 'Vincular Conta'
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {mode === 'login' 
              ? 'Não tem uma conta Pagar.me?'
              : 'Precisa de ajuda para encontrar seu Account ID?'
            }
          </p>
          <a 
            href="https://pagar.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Visite o site do Pagar.me
          </a>
        </div>
      </CardContent>
    </Card>
  );
} 