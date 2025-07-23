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
              Transformando criadores em profissionais do marketing digital através do poder do UGC.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Links Básicos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Sobre o NEXA</li>
              <li>Como funciona</li>
              <li>Preços</li>
              <li>Depoimentos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Central de ajuda</li>
              <li>Contato</li>
              <li>Status do sistema</li>
              <li>Problema do repórter</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Jurídico</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Termos de uso</li>
              <li>Política de privacidade</li>
              <li>Biscoitos</li>
              <li>LGPD</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-sm text-gray-400">
          © 2024 NEXA UGC. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};
