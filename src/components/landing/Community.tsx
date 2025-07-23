import { Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export const Community = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      location: "São Paulo, SP",
      rating: 5,
      text: "Antes do NEXA UGC, eu criava conteúdo como hobby. Hoje, trabalho com as marcas que sempre admirei e já consegui uma renda mensal estável que me permitiu largar meu emprego tradicional.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Alex Rivera",
      location: "Rio de Janeiro, RJ",
      rating: 5,
      text: "A plataforma facilitou meu contato com marcas internacionais que eu jamais imaginaria trabalhar. Em 3 meses, tripliquei meu faturamento e melhorei muito a qualidade do meu portfólio.",
      avatar: "/lovable-uploads/93d0f5fe-6290-46d0-b731-dc6b564a5bd8.png"
    },
    {
      name: "Jamie Smith",
      location: "Belo Horizonte, MG",
      rating: 5,
      text: "Como mãe solo, precisava de flexibilidade no trabalho. O NEXA UGC me deu isso e mais: uma comunidade de apoio, conhecimento e oportunidades que mudaram minha vida financeira.",
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
            Veja como o NEXA UGC está transformando a vida de criadores brasileiros
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
