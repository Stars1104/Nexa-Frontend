import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

export const CTA = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-pink-500 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center text-foreground">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Pronto para começar sua jornada?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-white">
          Junte-se a milhares de criadores que já estão monetizando seu conteúdo
        </p>
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 w-full sm:w-auto">
          Começar minha jornada
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
