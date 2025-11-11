import { Home, Ticket, User, LogOut } from "lucide-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pendingRequestsCount = useFriendRequests();

  const navItems = [
    { to: "/", icon: Home, label: "Feed" },
    { to: "/profile", icon: User, label: "Perfil" },
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('Sesión cerrada');
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={user ? "/" : "/login"} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Trusticket
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {user ? (
              <>
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-4 h-4", isActive && "text-primary-foreground")} />
                        <span className="hidden sm:inline">{item.label}</span>
                        {item.to === "/profile" && pendingRequestsCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {pendingRequestsCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2 ml-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
