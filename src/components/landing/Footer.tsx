import LightLogo from "../../assets/light-logo.png";
import { Button } from "../ui/button";

export const Footer = () => {
  return (
    <footer className="bg-background text-foreground py-8 md:py-12 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="text-xl md:text-2xl font-bold mb-4">
              <img src={LightLogo} alt="NEXA UGC" className="w-30 h-10 hidden dark:block" />
            </div>
            <p className="text-gray-400 text-sm">
              Construindo o maior ecossistema de UGC da América Latina, uma parceria autêntica por vez.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Links Básicos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer">Sobre a NEXA</li>
              <li className="cursor-pointer">Como funciona</li>
              <li className="cursor-pointer">Preços e planos</li>
              <li className="cursor-pointer">Cases de sucesso</li>
              <li className="cursor-pointer">Blog e recursos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Suporte Profissional</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer">Central de atendimento</li>
              <li className="cursor-pointer">Contato comercial</li>
              <li className="cursor-pointer">Status da plataforma</li>
              <li className="cursor-pointer">Reportar problemas</li>
              <li className="cursor-pointer">Agendamento de calls</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">JCompliance e Segurança</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer">Termos de uso</li>
              <li className="cursor-pointer">Política de privacidade</li>
              <li className="cursor-pointer">Política de cookies</li>
              <li className="cursor-pointer">LGPD</li>
              <li className="cursor-pointer">Certificações</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-sm text-gray-400">
          © 2025 NEXA. Todos os direitos reservados. | CNPJ: XX.XXX.XXX/0001-XX
        </div>
      </div>
    </footer>
  );
};
