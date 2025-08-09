import { MessageSquare, Shield, DollarSign, Heart, Eye, Star, User, Book } from "lucide-react";

export const Benefits = () => {
  const benefits = [
    {
      icon: MessageSquare,
      title: "Comunicação Direta com Decision Makers",
      description: "Chat integrado que conecta você diretamente com os responsáveis pelas campanhas das marcas, eliminando intermediários e agilizando todo o processo."
    },
    {
      icon: Shield,
      title: "Proteção Jurídica Completa",
      description: "Contratos profissionais e transparentes que protegem seus direitos autorais e definem exatamente como seu conteúdo será utilizado, com cláusulas claras de uso."
    },
    {
      icon: DollarSign,
      title: "Sistema de Pagamentos Seguro",
      description: "Processamento seguro através de parceiros financeiros consolidados, com garantia de recebimento e prazos respeitados religiosamente."
    },
    {
      icon: Heart,
      title: "Acesso Vitalício para Alunos Certificados",
      description: "Membros da NEXA UGC têm acesso permanente à plataforma, incluindo todas as novas funcionalidades e oportunidades que surgirem."
    },
    {
      icon: Eye,
      title: "Dashboard de Performance Avançado",
      description: "Monitore métricas detalhadas, entenda quais tipos de conteúdo têm melhor aceitação e otimize continuamente seus resultados financeiros."
    },
    {
      icon: Star,
      title: "Network Exclusivo de Alto Nível",
      description: "Conecte-se com creators que faturam 5 dígitos mensais, compartilhe estratégias e participe de uma comunidade focada em alta performance."
    },
    {
      icon: User,
      title: "Suporte Técnico Especializado",
      description: "Equipe dedicada para auxiliar em todas as etapas, desde a criação do conteúdo até a negociação com marcas e resolução de questões técnicas."
    },
    {
      icon: Book,
      title: "Campanhas Pré-Selecionadas",
      description: "Oportunidades curadas especialmente para o perfil brasileiro, com briefings claros e valores de mercado sempre atualizados."
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-12 md:mb-16">
          Benefícios Exclusivos da Plataforma
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="bg-background rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-full flex justify-start items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="w-60 text-lg font-semibold text-foreground mb-3">{benefit.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
