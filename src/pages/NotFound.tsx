import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="bg-gradient-to-r from-background to-muted text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary font-bold font-semibold rounded-full hover:bg-primary/90 transition duration-300 ease-in-out"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
