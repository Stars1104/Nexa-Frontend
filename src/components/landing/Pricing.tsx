import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export const Pricing = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-12 md:mb-16">
          Planos de Acesso NEXA UGC
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">

          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">Acesso Mensal</h3>
                <div className="text-2xl md:text-3xl font-bold text-foreground mt-2">R$ 39,90</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Masterclass completa de UGC</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Templates exclusivos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Lives mensais</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Conexão direta com marcas</span>
                </li>
              </ul>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                Quero ser um criador
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 md:p-8 border-2 border-pink-500 relative hover:shadow-lg transition-shadow">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500">
              Popular
            </Badge>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">Acesso Anual </h3>
                <div className="text-2xl md:text-3xl font-bold text-foreground mt-2">R$ 19,90</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Masterclass completa de UGC</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Templates exclusivos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Lives mensais</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Conexão direta com marcas</span>
                </li>
              </ul>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                Quero ser um criador
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 md:p-8 hover:shadow-lg transition-shadow">
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">Acesso Semestral</h3>
                <div className="text-2xl md:text-3xl font-bold text-foreground mt-2">R$ 29,90</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Masterclass completa de UGC</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Templates exclusivos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Lives mensais</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm md:text-base">Conexão direta com marcas</span>
                </li>
              </ul>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                Quero ser um criador
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
