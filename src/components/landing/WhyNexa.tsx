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
              Por que criei a NEXA
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Há 5 anos, comecei a criar conteúdo para marcas sem saber que isso se tornaria minha carreira.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              O que começou como um hobby se transformou em uma fonte de renda que mudou completamente minha vida financeira.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Durante essa jornada, percebi que muitos creators talentosos não sabiam como monetizar adequadamente seu conteúdo ou como se conectar com marcas dispostas a pagar valores justos. 
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
               falta de uma plataforma brasileira que realmente entendesse nossa realidade e oferecesse oportunidades reais era um problema que eu mesmo enfrentei.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
               Foi então que criei a NEXA: para ser a ponte definitiva entre creators brasileiros autênticos e marcas que valorizam conteúdo genuíno, garantindo pagamentos justos, processos transparentes e proteção total para ambos os lados.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
               Minha missão é construir o maior ecossistema de UGC do Brasil, onde creators podem prosperar financeiramente, aprender continuamente e crescer em uma comunidade de alta performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
