import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TrusTicket
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu red social de confianza para vender y comprar entradas de conciertos
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/manifesto" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manifiesto TrusTicket
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal-notice" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies-policy" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">Contacto</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:trusticketinfo@gmail.com" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  trusticketinfo@gmail.com
                </a>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Quién está detrás de Trusticket
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TrusTicket. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
