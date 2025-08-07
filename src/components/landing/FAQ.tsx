import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export const FAQ = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre o NEXA UGC
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="subscription-renewal">
            <AccordionTrigger className="text-left">
              A assinatura renova automaticamente?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-3">
                Sim! Ela renova automaticamente. Se você se inscreveu com cartão de crédito, 
                a cobrança será feita diretamente no seu cartão de crédito. Para pagamentos 
                via PIX ou boleto, um novo código será enviado para o seu email cadastrado.
              </p>
              <p className="mb-3">
                Se o pagamento não for realizado, o acesso será suspenso.
              </p>
              <p>
                Enquanto sua assinatura estiver ativa, o preço permanece o mesmo, 
                mesmo que haja ajustes futuros.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="business-hours">
            <AccordionTrigger className="text-left">
              Quais são nossos horários de atendimento?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>
                Nossos horários de atendimento são de segunda a sexta-feira, 
                das 8h às 18h.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}; 