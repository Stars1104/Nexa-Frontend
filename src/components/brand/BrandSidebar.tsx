import { Button } from "../ui/button";
import { Home, FileText, MessageCircle, User, BanknoteIcon, Bell, BookOpen } from "lucide-react";
import LightLogo from "../../assets/light-logo.png";
import DarkLogo from "../../assets/dark-logo.png";
import { useEffect, useState, useRef } from "react";
import { useIsMobile } from "../../hooks/use-mobile";

const navLinks = [
    { label: "Minhas Campanhas", icon: Home, key: "Minhas campanhas" },
    { label: "Nova campanha criada", icon: FileText, key: "Nova campanha" },
    { label: "Chat", icon: MessageCircle, key: "Chat" },
    { label: "Meu Perfil", icon: User, key: "Meu perfil" },
    { label: "Pagamentos", icon: BanknoteIcon, key: "Pagamentos" },
    { label: "Notificações", icon: Bell, key: "Notificações" },
    { label: "Guia da Plataforma", icon: BookOpen, key: "Guia da Plataforma" },
];

interface SidebarProps {
    setComponent: (component: string) => void;
    component?: string | { name: string; campaign?: any };
}

const Sidebar = ({ setComponent, component }: SidebarProps) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(component || "Minhas campanhas");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const closeTimeout = useRef<number | null>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        // Check initial theme
        checkTheme();

        // Create observer to watch for class changes on document element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Set default component on mount
    useEffect(() => {
        setSelectedComponent(component || "Minhas campanhas");
    }, [component, setSelectedComponent]);

    // Handle mounting/unmounting for animation
    useEffect(() => {
        if (mobileSidebarOpen) {
            setIsVisible(true);
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
        } else if (isVisible) {
            closeTimeout.current = setTimeout(() => setIsVisible(false), 300); // match duration-300
        }
        return () => {
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
        };
    }, [mobileSidebarOpen]);

    const handleCreatorComponent = (component: string) => {
        setSelectedComponent(component);
        setComponent(component);
        if (isMobile) setMobileSidebarOpen(false);
    }

    // Hamburger toggle button for mobile
    if (isMobile && !mobileSidebarOpen && !isVisible) {
        return (
            <button
                aria-label="Abrir menu"
                className="fixed top-4 left-3 z-0 p-1.5 rounded-md bg-background shadow-md border border-muted-foreground/10 text-lg text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                onClick={() => setMobileSidebarOpen(true)}
            >
                <span className="sr-only">Abrir menu</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
        );
    }

    if (isMobile && isVisible) {
        return (
            <div className="fixed inset-0 z-0 pointer-events-auto">
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ease-in-out ${mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setMobileSidebarOpen(false)}
                />
                {/* Sidebar */}
                <aside
                    className={`fixed top-0 left-0 h-full w-72 max-w-full bg-background flex flex-col shadow-2xl z-0
                        transition-transform transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${mobileSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
                        pointer-events-auto`}
                    style={{ willChange: 'transform, opacity' }}
                >
                    {/* Header with logo and close button */}
                    <div className="flex items-center justify-between px-4 py-5 border-b">
                        <img src={isDarkMode ? LightLogo : DarkLogo} alt="Logo" width={90} className="w-28" />
                        <button
                            aria-label="Fechar menu"
                            className="text-xl p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                            onClick={() => setMobileSidebarOpen(false)}
                        >
                            ×
                        </button>
                    </div>
                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1 mt-2">
                        {navLinks.map(({ label, icon: Icon, key }) => {
                            const isSelected = selectedComponent === key;
                            return (
                                <button
                                    key={key}
                                    className={`flex items-center gap-3 px-6 py-3 text-base font-normal transition-colors w-full text-left
                                        ${isSelected
                                            ? "bg-pink-50 border-l-4 border-pink-400 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground border-l-4 border-transparent"
                                        }`}
                                    onClick={() => handleCreatorComponent(key)}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>
            </div>
        );
    }

    // Desktop sidebar
    return (
        <aside className="flex flex-col h-full w-64 border-r bg-background py-6 px-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 px-2">
                {
                    isDarkMode ? (
                        <img src={LightLogo} alt="Logo" width={90} className="w-28" />
                    ) : (
                        <img src={DarkLogo} alt="Logo" width={90} className="w-28" />
                    )
                }
            </div>
            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1">
                {navLinks.map(({ label, icon: Icon, key }) => {
                    const isSelected = selectedComponent === key;

                    return (
                        <Button
                            key={label}
                            variant={isSelected ? "secondary" : "ghost"}
                            className={`justify-start w-full gap-3 ${isSelected ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300" : ""}`}
                            onClick={() => handleCreatorComponent(key)}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </Button>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;