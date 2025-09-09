import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailVerificationPendingProps {
  userEmail: string;
  userRole?: string;
  onResendEmail: () => void;
  onGoToLogin: () => void;
}

const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({
  userEmail,
  userRole,
  onResendEmail,
  onGoToLogin,
}) => {
  const getRoleSpecificContent = () => {
    if (userRole === 'creator') {
      return {
        subject: '🩷 Parabéns! Seu perfil foi selecionado!',
        message: 'Parabéns! Você tem a cara da marca e foi selecionada para uma parceria de sucesso! Prepare-se para mostrar todo o seu talento e representar a NEXA com criatividade e profissionalismo. Estamos animados para ver o que você vai criar! Abra o site da NEXA e verifique o seu Chat com a marca.'
      };
    } else if (userRole === 'brand') {
      return {
        subject: '🩷 Parabéns! Sua campanha foi aprovada na NEXA!',
        message: 'Agora é hora de dar início a uma parceria estratégica com criadores de alto nível para a sua marca. Acesse o site e confira sua campanha ativa.'
      };
    } else {
      return {
        subject: '🎉 Bem-vindo à Nexa!',
        message: 'Obrigado por se juntar à nossa comunidade! Verifique seu email para ativar sua conta e começar a usar todos os recursos incríveis da Nexa.'
      };
    }
  };

  const content = getRoleSpecificContent();
  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#171717]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Verifique Seu Email</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Enviamos um link de verificação para
          </CardDescription>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-2">
            {userEmail}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Próximos passos:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Verifique sua caixa de entrada (e pasta de spam)</li>
                  <li>Clique no link de verificação no email</li>
                  <li>Complete a configuração da sua conta</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-green-800 dark:text-green-200">
              <p className="font-semibold mb-2">{content.subject}</p>
              <p className="text-sm">{content.message}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onResendEmail}
              className="w-full"
              variant="outline"
            >
              Reenviar Email de Verificação
            </Button>
            <Button 
              onClick={onGoToLogin}
              className="w-full"
            >
              Ir para Login
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Não recebeu o email? Verifique sua pasta de spam ou tente reenviar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPending; 