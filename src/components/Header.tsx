import { Home, User, LogOut, Shield, Menu, X } from "lucide-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const pendingRequestsCount = useFriendRequests();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Feed" },
    { to: "/profile", label: "Perfil" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={user ? "/" : "/login"}
            className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            <span className="gradient-text">Trusticket</span>
          </Link>

          {/* Desktop nav */}
          {user && !isMobile && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full gradient-vibrant" />
                      )}
                      {item.to === "/profile" && pendingRequestsCount > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] gradient-primary border-0"
                        >
                          {pendingRequestsCount}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="w-px h-5 bg-border mx-2" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Salir
              </Button>
            </nav>
          )}

          {/* Mobile menu button */}
          {user && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          )}
        </div>

        {/* Mobile dropdown */}
        {user && isMobile && mobileOpen && (
          <nav className="pb-4 border-t border-border/40 pt-3 space-y-1 fade-in-up">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors relative",
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )
                }
              >
                {item.label}
                {item.to === "/profile" && pendingRequestsCount > 0 && (
                  <Badge
                    className="absolute top-2.5 right-3 h-4 min-w-[16px] flex items-center justify-center p-0 text-[10px] gradient-primary border-0"
                  >
                    {pendingRequestsCount}
                  </Badge>
                )}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                handleSignOut();
              }}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
            >
              Salir
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
