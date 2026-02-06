import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30 shadow-lg animate-slide-in-bottom">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Usamos cookies esenciales para el funcionamiento de la plataforma
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/cookies-policy">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-secondary"
              >
                Más información
              </Button>
            </Link>
            <Button 
              onClick={handleAccept}
              size="sm"
              className="gradient-primary border-0 hover:opacity-90 text-primary-foreground"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
