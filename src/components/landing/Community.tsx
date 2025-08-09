import { Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export const Community = () => {
  const testimonials = [
    {
      name: "Mariana",
      location: "MC Mariana Costa São Paulo, SP",
      rating: 5,
      text: "Antes da NEXA, eu criava conteúdo como hobby ganhando R$ 200-300 esporadicamente. Hoje, trabalho com marcas premium e minha renda mensal média é de R$ 6.800. Consegui sair do CLT e viver do que amo.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Alex Rivera",
      location: "RS Ricardo Silva Rio de Janeiro, RJ",
      rating: 5,
      text: "A NEXA me conectou com marcas internacionais que eu jamais imaginaria acessar. Em 4 meses, saí de R$ 800 para R$ 4.200 mensais. A estrutura profissional da plataforma fez toda a diferença.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Jamie Smith",
      location: "JM Júlia Martins Belo Horizonte, MG",
      rating: 5,
      text: "Como mãe solo, precisava de flexibilidade e renda extra. A NEXA me proporcionou isso e muito mais: em 6 meses, já estava faturando R$ 3.500 mensais trabalhando apenas 3 horas por dia de casa.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "James",
      location: "S Thiago Santos Porto Alegre, RS",
      rating: 5,
      text: "Nunca pensei que poderia ganhar R$ 1.800 por um vídeo de 30 segundos. A NEXA abriu portas que eu nem sabia que existiam. Hoje tenho uma agenda de campanhas que me rende mais de R$ 5K por mês.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Anna",
      location: "AL Ana Lucia Brasília, DF ",
      rating: 5,
      text: "Saí de zero na criação de UGC e em 3 meses já estava faturando R$ 2.800 mensais. A metodologia da NEXA e o suporte da comunidade foram fundamentais para meu sucesso.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Flex Henry",
      location: "CF Carlos Ferreira Salvador, BA",
      rating: 5,
      text: "A NEXA não é só uma plataforma, é um ecossistema completo. Triplicou minha renda, expandiu minha rede de contatos e me posicionou como referência no meu nicho.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Comunidade de Criadores
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Veja como a NEXA está transformando a vida de creators brasileiros.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-card border-border">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
