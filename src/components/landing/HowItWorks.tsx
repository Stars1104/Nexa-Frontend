import { Button } from "../ui/button";
import { User, Eye, Image, DollarSign, ArrowRight } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Cadastre-se",
      description: "Crie seu perfil gratuito na plataforma, destacando suas habilidades e experiências.",
      icon: User
    },
    {
      step: "2",
      title: "Encontre campanhas",
      description: "Acesse oportunidades exclusivas com marcas nacionais e internacionais.",
      icon: Eye
    },
    {
      step: "3",
      title: "Crie conteúdo autêntico",
      description: "Produza conteúdo seguindo as diretrizes da marca, mas com seu próprio estilo único.",
      icon: Image
    },
    {
      step: "4",
      title: "Receba pagamentos",
      description: "Pagamentos seguros e transparentes diretamente na sua conta bancária.",
      icon: DollarSign
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Como o NEXA UGC funciona
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Um processo simples para transformar sua criatividade em renda
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center bg-background py-8 px-2 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{step.step}. {step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-semibold">
            Começar agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
