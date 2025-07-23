import WhyNexa from "../../assets/landing/why-nexa.png";

export const WhyNexaSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center px-4 md:px-6">
          <div className="relative order-last lg:order-first">
            <div className="w-full aspect-square max-w-xl mx-auto rounded-3xl overflow-hidden">
              <img src={WhyNexa} alt="Why NEXA UGC" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-4 md:space-y-6 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Por que criei o NEXA UGC
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Há 5 anos, comecei a criar conteúdo para marcas sem saber que isso se tornaria minha carreira. O que começou como um hobby se transformou em fonte de renda principal.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Percebi que muitos criadores talentosos não sabiam como monetizar seu conteúdo ou conectar-se com as marcas certas. A falta de uma plataforma brasileira que entendesse nossa realidade era um problema real.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Por isso criei o NEXA UGC: para conectar criadores brasileiros talentosos com marcas que valorizam conteúdo autêntico, garantindo pagamentos justos e proteção para ambos os lados.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Minha missão é construir uma comunidade onde criadores possam prosperar, aprender e crescer juntos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
