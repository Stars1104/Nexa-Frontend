import { MessageSquare, Shield, DollarSign, Heart, Eye, Star } from "lucide-react";

export const Benefits = () => {
  const benefits = [
    {
      icon: MessageSquare,
      title: "Comunicação direta com as marcas.",
      description: "Chat integrado para alinhar expectativas e responder perguntas diretamente com as marcas, sem intermediários."
    },
    {
      icon: Shield,
      title: "Proteção de direitos autorais",
      description: "Contratos claros e transparentes que protegem seu trabalho e definem exatamente como seu conteúdo será usado."
    },
    {
      icon: DollarSign,
      title: "Pagamentos seguros com o Pagar.me",
      description: "Receba pagamentos em dia, sempre, com nosso sistema de pagamento seguro."
    },
    {
      icon: Heart,
      title: "Acesso gratuito para alunos do curso",
      description: "Alunos do curso UGC Pro têm acesso exclusivo à plataforma, sem mensalidade, por um período prolongado."
    },
    {
      icon: Eye,
      title: "Ferramentas de análise",
      description: "Monitore seu desempenho, entenda qual conteúdo tem melhor aceitação e otimize seus resultados."
    },
    {
      icon: Star,
      title: "Comunidade exclusiva",
      description: "Conecte-se com outros criadores, compartilhe experiências e cresça com networking de qualidade."
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-12 md:mb-16">
          Benefícios da Plataforma
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="bg-background rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
