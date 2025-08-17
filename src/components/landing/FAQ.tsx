import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      value: "access-platform",
      question: "Como posso acessar a plataforma de jobs?",
      answer: (
        <p>
          Você precisa contratar um dos nossos planos: <strong>mensal</strong>, <strong>semestral</strong> ou <strong>anual</strong>. Ao contratar,
          você receberá acesso imediato à plataforma, ao painel de campanhas e às ferramentas de criação.
        </p>
      ),
    },
    {
      value: "followers",
      question: "Preciso ter muitos seguidores para começar?",
      answer: (
        <p>
          Não! Na <strong>NEXA</strong>, priorizamos autenticidade e qualidade do conteúdo. Muitos dos nossos top
          creators começaram com menos de <strong>1.000 seguidores</strong>. O que mais conta é a relevância e o
          engajamento do seu público.
        </p>
      ),
    },
    {
      value: "payments",
      question: "Como funcionam os pagamentos das campanhas?",
      answer: (
        <>
          <p className="mb-3">
            Todos os pagamentos são processados através dos nossos parceiros financeiros com prazo máximo de <strong>30 dias</strong>.
            Os valores por vídeo variam entre <strong>R$150</strong> e <strong>R$2.500</strong>, dependendo da complexidade da campanha.
          </p>
          <p>
            Você receberá informações detalhadas sobre prazos e condições diretamente na área da campanha e por e-mail.
          </p>
        </>
      ),
    },
    {
      value: "choose-brands",
      question: "Posso escolher com quais marcas trabalhar?",
      answer: (
        <p>
          Sim. Você tem total autonomia para aceitar ou recusar campanhas. Nossa curadoria busca alinhar oportunidades
          com valores éticos e com o perfil do creator, garantindo recomendações relevantes.
        </p>
      ),
    },
    {
      value: "equipment",
      question: "Que tipo de equipamento preciso ter?",
      answer: (
        <p>
          Um smartphone moderno é suficiente para começar. Para quem deseja melhorar a qualidade, fornecemos uma lista completa
          de equipamentos recomendados para cada nível de investimento (básico, intermediário e avançado).
        </p>
      ),
    },
    {
      value: "satisfaction",
      question: "Há garantia de satisfação?",
      answer: (
        <p>
          Sim. Oferecemos <strong>7 dias de garantia incondicional</strong>. Se você não ficar satisfeito, devolvemos 100% do investimento.
        </p>
      ),
    },
    {
      value: "community",
      question: "Comunidade e resultados",
      answer: (
        <p>
          Junte-se a mais de <strong>5.000 creators</strong> que já estão faturando de forma consistente através da NEXA.
          Nossa comunidade oferece suporte, troca de experiências e materiais educativos para acelerar seu crescimento.
        </p>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          <p className="text-lg text-muted-foreground">
            Como posso acessar a plataforma de jobs?
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <h3 className="text-xl font-semibold mb-2">Pronto para Transformar sua Vida Financeira?</h3>
          <p className="text-muted-foreground mb-6">Junte-se a mais de 5.000 creators que já estão faturando consistentemente através da NEXA.</p>
          <a
            href="/signup"
            className="inline-block rounded-lg px-6 py-3 bg-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition"
          >
            Começar minha transformação
          </a>
        </div>
      </div>
    </section>
  );
};