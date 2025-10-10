import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logoutUser } from "../store/thunks/authThunks";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { fetchApprovedCampaigns, fetchCreatorApplications } from "@/store/thunks/campaignThunks";
import { toast } from "sonner";

interface CreatorNavbarProps {
  title: string;
}

const CreatorNavbar = ({ title }: CreatorNavbarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // Get user data from Redux store and dispatch
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  // Use profile data if available, otherwise fall back to auth user data
  const userData = profile || user;
  console.log("userData=======", userData);

  // Handle logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(logoutUser()).unwrap();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to generate initials from name
  const getInitials = (name: string): string => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (user?.role === "creator" || user?.role === "student") {
          // Sequential API calls to prevent rate limiting
          const fetchDataSequentially = async () => {
            try {
              // First, fetch approved campaigns
              await dispatch(fetchApprovedCampaigns()).unwrap();
              
              // Add a longer delay to respect backend rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Then, fetch creator applications after the first call completes
              await dispatch(fetchCreatorApplications()).unwrap();
            } catch (error) {
              console.error('Error fetching dashboard data:', error);
              toast.error("Falha ao carregar campanhas. Tente recarregar a página.");
            }
          }; 
             fetchDataSequentially();}
      

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu,user?.role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShowUserMenu(false);
    };
  }, []);



  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-4">
        <span className="text-base sm:text-lg font-semibold md:block hidden">{title}</span>
      </div>
      {/* Right: Theme toggle and user info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <NotificationBell />
        <ThemeToggle />
        <div className="flex items-center gap-2 relative" ref={userMenuRef}>
          <button
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              {(user as any)?.avatar ? (
                <AvatarImage src={(user as any).avatar} alt={user.name} />
              ) : null}
              <AvatarFallback className="text-sm sm:text-base text-start">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-start">
              <span className="font-medium leading-none">
                {user?.name || "User"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 hidden sm:block" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && typeof document !== 'undefined' && createPortal(
            <div className="fixed right-4 top-16 w-64 bg-background border rounded-lg shadow-lg z-[2147483647] dark:bg-[#171717]" style={{ pointerEvents: 'auto' }}>
              <Card onClick={(e) => e.stopPropagation()}>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        {(userData as any)?.avatar ? (
                          <AvatarImage src={(userData as any).avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="text-base">
                          {userData?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{user?.name || "User"}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full p-3 hover:bg-accent/50 text-left transition-colors text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer relative z-[2147483647]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout(e);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>,
            document.body
          )}
        </div>
      </div>
    </nav>
  );
}

export default CreatorNavbar;