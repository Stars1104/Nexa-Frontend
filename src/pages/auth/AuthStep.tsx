import { Button } from "../../components/ui/button";
import LightLogo from "../../assets/light-logo.png";
import DarkLogo from "../../assets/dark-logo.png";
import { ArrowRight, Home, User } from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useSystemTheme } from "../../hooks/use-system-theme";
import { useNavigate } from "react-router-dom";

const AuthStep = () => {
    const { theme } = useTheme();
    const systemTheme = useSystemTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
    const navigate = useNavigate();

    const handleInfluencer = () => {
        navigate("/signup/creator");
    };

    const handleCompany = () => {
        navigate("/signup/brand");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-[#171717] transition-colors duration-300">
            <div className="bg-background rounded-2xl shadow-lg p-8 md:p-10 w-full max-w-lg flex flex-col items-center gap-6 border border-border">
                <div className="flex flex-col items-center gap-2">
                    <img
                        src={isDarkMode ? LightLogo : DarkLogo}
                        alt="Nexa logo"
                        className="w-28 mb-2 cursor-pointer"
                        onClick={() => navigate("/")}
                    />
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-1">
                        Como você quer entrar?
                    </h1>
                    <p className="text-muted-foreground text-center text-base mb-2">
                        Escolha o tipo de conta para acessar a plataforma
                    </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                    <Button
                        variant="outline"
                        className="w-full flex justify-between items-center py-6 px-4 text-lg font-semibold"
                        onClick={handleCompany}
                    >
                        <span className="flex items-center gap-2">
                            <Home className="w-6 h-6" /> Sou uma empresa
                        </span>
                        <span>
                            <ArrowRight className="w-6 h-6" />
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full flex justify-between items-center py-6 px-4 text-lg font-semibold"
                        onClick={handleInfluencer}
                    >
                        <span className="flex items-center gap-2">
                            <User className="w-6 h-6" /> Sou um influenciador
                        </span>
                        <span>
                            <ArrowRight className="w-6 h-6" />
                        </span>
                    </Button>
                </div>
                <div className="text-center w-full mt-2">
                    <span className="text-muted-foreground">Não tem uma conta? </span>
                    <a href="#" className="font-semibold text-pink-500 hover:underline">Criar conta</a>
                </div>
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
};

export default AuthStep;
