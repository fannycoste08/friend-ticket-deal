import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              TrusTicket
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tu red social de confianza para vender y comprar entradas de conciertos
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/manifesto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Manifiesto TrusTicket
                </Link>
              </li>
              <li>
                <Link to="/legal-notice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/cookies-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Contacto
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:trusticketinfo@gmail.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  trusticketinfo@gmail.com
                </a>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Quién está detrás de Trusticket
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TrusTicket. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;