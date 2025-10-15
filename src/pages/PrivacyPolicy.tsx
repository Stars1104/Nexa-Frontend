import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Users, Database, Globe, FileText, Mail } from "lucide-react";

function usePageSEO() {
  useEffect(() => {
    const title = "Política de Privacidade - NEXA Platform";
    const description = "Conheça como a NEXA coleta, utiliza, armazena e protege seus dados pessoais em conformidade com a LGPD.";
    
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Política de Privacidade - NEXA",
      "description": description,
      "url": window.location.href,
      "mainEntity": {
        "@type": "Organization",
        "name": "NEXA",
        "description": "Plataforma de UGC para conectar marcas e criadores"
      }
    };
    
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, []);
}

const PrivacySection = ({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: any; 
  title: string; 
  children: React.ReactNode; 
}) => (
  <Card className="mb-6">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <CardTitle className="text-xl">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

export default function PrivacyPolicy() {
  usePageSEO();

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparência e proteção dos seus dados são fundamentais para nós. 
              Conheça como coletamos, utilizamos e protegemos suas informações.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Última atualização: 7 de Outubro de 2025
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Introduction */}
          <PrivacySection icon={FileText} title="1. Introdução">
            <p className="text-muted-foreground leading-relaxed">
              A presente Política de Privacidade tem por finalidade informar como a NEXA coleta, 
              utiliza, armazena e protege os dados pessoais dos usuários cadastrados na Plataforma, 
              em conformidade com a Lei nº 13.709/2018 (LGPD) e demais legislações aplicáveis.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política. 
              Recomendamos que leia atentamente este documento para entender como tratamos suas informações.
            </p>
          </PrivacySection>

          {/* Information We Collect */}
          <PrivacySection icon={Database} title="2. Informações que Coletamos">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A NEXA poderá coletar as seguintes informações fornecidas pelo usuário:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Dados Pessoais:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Nome completo, CPF e endereço</li>
                    <li>• E-mail, número de telefone e redes sociais</li>
                    <li>• Dados de login e senha</li>
                    <li>• Data de nascimento e gênero</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Dados Financeiros:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Dados de pagamento e conta bancária</li>
                    <li>• Histórico de transações</li>
                    <li>• Informações fiscais (quando necessário)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Dados de Uso:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Histórico de campanhas e preferências</li>
                  <li>• Interações dentro da Plataforma</li>
                  <li>• Dados de navegação e cookies</li>
                  <li>• Informações de dispositivo e localização</li>
                </ul>
              </div>
            </div>
          </PrivacySection>

          {/* How We Use Information */}
          <PrivacySection icon={Users} title="3. Como Utilizamos suas Informações">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Os dados coletados são utilizados para as seguintes finalidades:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Funcionalidades Principais:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Cadastrar o usuário e permitir o uso da Plataforma</li>
                    <li>• Intermediar a comunicação entre criadores e marcas</li>
                    <li>• Efetuar pagamentos e repasses financeiros</li>
                    <li>• Processar aplicações e contratos</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Melhorias e Compliance:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Melhorar a experiência de uso da Plataforma</li>
                    <li>• Personalizar conteúdo e recomendações</li>
                    <li>• Cumprir obrigações legais e regulatórias</li>
                    <li>• Prevenir fraudes e garantir segurança</li>
                  </ul>
                </div>
              </div>
            </div>
          </PrivacySection>

          {/* Data Security */}
          <PrivacySection icon={Lock} title="4. Segurança das Informações">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A NEXA adota medidas de segurança compatíveis com o estado da técnica, visando proteger 
                os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Medidas de Segurança Implementadas:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Criptografia de dados em trânsito e em repouso</li>
                  <li>• Controle de acesso baseado em funções</li>
                  <li>• Monitoramento contínuo de segurança</li>
                  <li>• Backup regular e recuperação de desastres</li>
                  <li>• Treinamento de equipe em segurança da informação</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Importante:</strong> Nenhum sistema é totalmente imune a ataques ou falhas, 
                  e a NEXA não pode garantir 100% de segurança das informações transmitidas ou armazenadas. 
                  O usuário reconhece e consente que, ao utilizar a Plataforma, aceita o risco inerente 
                  à transmissão de dados pela internet.
                </p>
              </div>
            </div>
          </PrivacySection>

          {/* Cookies */}
          <PrivacySection icon={Eye} title="5. Cookies e Tecnologias Similares">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma:
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Cookies Essenciais:</h4>
                  <p className="text-xs text-muted-foreground">
                    Necessários para o funcionamento básico da plataforma
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Cookies de Performance:</h4>
                  <p className="text-xs text-muted-foreground">
                    Coletam informações sobre como você usa a plataforma
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Cookies de Funcionalidade:</h4>
                  <p className="text-xs text-muted-foreground">
                    Lembram suas preferências e configurações
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </div>
          </PrivacySection>

          {/* Third-Party Services */}
          <PrivacySection icon={Globe} title="6. Serviços de Terceiros">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A NEXA poderá compartilhar dados com:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Marcas e Anunciantes</h4>
                    <p className="text-sm text-muted-foreground">
                      Interessados em contratar criadores para campanhas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Prestadores de Serviços</h4>
                    <p className="text-sm text-muted-foreground">
                      Hospedagem, processamento de pagamentos e suporte técnico
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Autoridades Públicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Mediante ordem judicial, exigência legal ou para proteger direitos e segurança
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Compromisso:</strong> Nenhum dado é vendido ou comercializado para terceiros 
                  para fins de marketing direto.
                </p>
              </div>
            </div>
          </PrivacySection>

          {/* User Rights */}
          <PrivacySection icon={Shield} title="7. Seus Direitos">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                De acordo com a LGPD, você possui os seguintes direitos sobre seus dados pessoais:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Direitos de Acesso:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Confirmar a existência de tratamento</li>
                    <li>• Acessar seus dados pessoais</li>
                    <li>• Corrigir dados incompletos ou inexatos</li>
                    <li>• Anonimizar, bloquear ou eliminar dados</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Direitos de Controle:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Revogar consentimento</li>
                    <li>• Solicitar portabilidade de dados</li>
                    <li>• Obter informações sobre compartilhamento</li>
                    <li>• Solicitar revisão de decisões automatizadas</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Como exercer seus direitos:</strong> Entre em contato conosco através dos 
                  canais oficiais de suporte disponíveis na Plataforma. Responderemos em até 15 dias úteis.
                </p>
              </div>
            </div>
          </PrivacySection>

          {/* Data Retention */}
          <PrivacySection icon={Database} title="8. Retenção dos Dados">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Os dados pessoais serão mantidos pelo tempo necessário para:
              </p>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Cumprimento de obrigações legais, contratuais e regulatórias</li>
                <li>• Exercício regular de direitos em processo judicial ou administrativo</li>
                <li>• Proteção dos interesses legítimos da NEXA</li>
                <li>• Até que o usuário solicite a exclusão da conta</li>
              </ul>
              
              <p className="text-sm text-muted-foreground">
                Após o período de retenção, os dados serão eliminados de forma segura, 
                exceto quando a lei exigir sua manutenção.
              </p>
            </div>
          </PrivacySection>

          {/* Policy Changes */}
          <PrivacySection icon={FileText} title="9. Alterações na Política">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A NEXA poderá alterar esta Política de Privacidade a qualquer momento, 
                com efeito imediato a partir da publicação na Plataforma.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                O uso contínuo da Plataforma após a alteração implica aceitação das novas condições. 
                Recomendamos que você revise periodicamente esta política para se manter informado 
                sobre como protegemos suas informações.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Notificação de mudanças:</strong> Alterações significativas serão comunicadas 
                  através de e-mail ou notificação na Plataforma com pelo menos 30 dias de antecedência.
                </p>
              </div>
            </div>
          </PrivacySection>

          {/* Contact */}
          <PrivacySection icon={Mail} title="10. Dúvidas e Contato">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Em caso de dúvidas sobre o tratamento de dados pessoais ou sobre esta Política, 
                você poderá entrar em contato conosco:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Canais de Suporte:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Central de atendimento na Plataforma</li>
                    <li>• E-mail: privacidade@nexa.com.br</li>
                    <li>• Chat de suporte online</li>
                    <li>• Telefone: (11) 99999-9999</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Encarregado de Dados (DPO):</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• E-mail: dpo@nexa.com.br</li>
                    <li>• Horário: Segunda a sexta, 9h às 18h</li>
                    <li>• Prazo de resposta: 15 dias úteis</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground">
                  <strong>Compromisso com a transparência:</strong> Estamos comprometidos em responder 
                  todas as suas dúvidas e solicitações relacionadas à proteção de dados pessoais de 
                  forma clara e objetiva.
                </p>
              </div>
            </div>
          </PrivacySection>

          {/* Footer Note */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD) 
              e demais legislações aplicáveis. Sua privacidade é fundamental para nós.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
