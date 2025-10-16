import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import LightLogo from "../assets/light-logo.png";
import DarkLogo from "../assets/dark-logo.png";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import { useSystemTheme } from "../hooks/use-system-theme";
import { VisuallyHidden } from "./ui/visually-hidden";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
    const { theme } = useTheme();
    const systemTheme = useSystemTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
    const navigate = useNavigate();

    const MobileMenu = () => (
        <Sheet>
            <SheetTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden p-2 h-10 w-10 flex items-center justify-center"
                    aria-label="Open mobile menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
                <VisuallyHidden>
                    <SheetTitle>Mobile Navigation Menu</SheetTitle>
                    <SheetDescription>Navigation options for mobile users</SheetDescription>
                </VisuallyHidden>
                <div className="flex flex-col gap-6 mt-8">
                    {/* <Button variant="ghost" className="justify-start" onClick={() => navigate("/docs")}>
                        Documentação
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => navigate("/auth/login")}>
                        Entrar
                    </Button> */}
                    <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => navigate("/auth")}>
                        Acessar a plataforma
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );

    return (
        <header className="w-full top-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur fixed supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="text-xl md:text-2xl font-bold text-foreground" onClick={() => navigate("/")}>
                    {
                        isDarkMode ? (
                            <img src={LightLogo} alt="Logo" width={90} className="w-30 cursor-pointer" />
                        ) : (
                            <img src={DarkLogo} alt="Logo" width={90} className="w-30 cursor-pointer" />
                        )
                    }
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    {/* <Button variant="ghost" className="justify-start" onClick={() => navigate("/docs")}>
                        Documentação
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/auth/login")}>
                        Entrar
                    </Button> */}
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => navigate("/auth")}>
                        Acessar a plataforma
                    </Button>
                    <ThemeToggle />
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-3">
                    <ThemeToggle />
                    <MobileMenu />
                </div>
            </div>
        </header>
    );
};
