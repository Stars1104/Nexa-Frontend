import { Button } from "../ui/button";
import { CheckCircle2, Calendar, Lightbulb } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { useState } from "react";
import SubscriptionModal from "./SubscriptionModal";

const benefits = [
    "Aplicações ilimitadas em campanhas",
    "Acesso a todas as campanhas exclusivas",
    "Prioridade na aprovação de campanhas",
    "Suporte premium via chat",
    "Ferramentas avançadas de criação de conteúdo",
];

export default function Subscription() {
    const { theme } = useTheme();
    const [showCoupon, setShowCoupon] = useState(false);
    const [open, setOpen] = useState(false);
    return (
        <div className="min-h-screen w-full bg-[#f6f6f6] dark:bg-[#18181b] flex flex-col items-center py-6 px-2 sm:px-6">
            <div className="w-full flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assinatura Nexa UGC</h1>
                    <p className="text-muted-foreground text-base">Garanta seu acesso completo à plataforma</p>
                </div>

                {/* Testimonial/Info */}
                <div className="rounded-xl border border-[#f3eaff] dark:border-[#3a2a4d] bg-[#faf6ff] dark:bg-[#23182e] px-6 py-4 flex items-center gap-3 shadow-sm">
                    <div className="rounded-full bg-[#f3eaff] dark:bg-[#3a2a4d] p-2 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-purple-400 dark:text-purple-200" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-foreground">Diz Sarah:</div>
                        <div className="text-sm text-muted-foreground mt-0.5">"Com o Plano PRO, você aumenta suas chances e participa das melhores campanhas!"</div>
                    </div>
                </div>

                {/* Current Plan */}
                <div className="rounded-xl border bg-background shadow-sm flex flex-col px-6 py-5 gap-2">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-200" />
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div>
                                <div className="font-semibold text-base text-foreground">Você é um estudante verificado.</div>
                                <div className="text-sm text-muted-foreground">Seu acesso gratuito é válido até:</div>
                            </div>
                            <div className="text-base text-foreground font-medium sm:text-right">31/12/2023</div>
                        </div>
                    </div>
                </div>

                {/* Available Plans */}
                <div className="flex flex-col gap-4">
                    <div className="font-bold text-lg text-foreground">Planos Disponíveis</div>
                    <div className="rounded-xl border bg-background shadow-sm px-6 py-6 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <div className="font-bold text-xl text-foreground mb-0.5">PRO Creator</div>
                                <div className="text-sm text-muted-foreground mb-2">O plano ideal para criadores que querem se destacar</div>
                            </div>
                            <div className="flex flex-col items-end min-w-[110px]">
                                <span className="text-2xl font-bold text-foreground leading-none">R$ 49,90</span>
                                <span className="text-xs text-muted-foreground leading-none">/ mês</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="font-semibold text-sm mb-1 text-foreground">Benefícios incluídos:</div>
                            <ul className="flex flex-col gap-2">
                                {benefits.map((b) => (
                                    <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-pink-500 dark:text-pink-300" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                            <div className="flex-1 flex items-center">
                                {!showCoupon ? (
                                    <button
                                        className="text-pink-500 text-sm hover:underline"
                                        onClick={() => setShowCoupon(true)}
                                        type="button"
                                    >
                                        Eu tenho um cupom de desconto
                                    </button>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Digite seu cupom"
                                        className="border rounded-md px-3 py-2 text-sm bg-background text-foreground outline-none w-full sm:w-56"
                                    />
                                )}
                            </div>
                            <Button onClick={() => setOpen(true)} className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-8 py-2 text-base w-full sm:w-auto mt-2 sm:mt-0">
                                Assinar agora
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <SubscriptionModal open={open} onOpenChange={setOpen} />
        </div>
    );
}
