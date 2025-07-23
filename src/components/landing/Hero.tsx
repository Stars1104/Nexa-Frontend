import { Play, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import HeroRightImg from "../../assets/landing/hero-img.png";

export const Hero = () => {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10"></div>
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                            Transforme sua paixão por conteúdo em 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                                renda 
                            </span>
                            — com o 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">
                                NEXA UGC
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                            Aprenda, conecte-se com marcas e monetize seu conteúdo
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 w-full sm:w-auto rounded-full">
                                Começar minha jornada
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="lg" className="px-8 w-full sm:w-auto rounded-full">
                                <Play className="mr-2 h-4 w-4" />
                                Conhecer a plataforma
                            </Button>
                        </div>
                    </div>
                    <div className="relative order-first lg:order-last">
                        <div className="w-[280px] h-64 sm:w-80 sm:h-80 lg:w-[400px] lg:h-96 mx-auto flex items-center justify-center">
                            <img src={HeroRightImg} alt="Hero-Image" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};