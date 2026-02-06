import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-7xl font-extrabold gradient-text">404</h1>
        <p className="text-xl text-muted-foreground">Página no encontrada</p>
        <Link to="/">
          <Button className="gradient-primary border-0 hover:opacity-90 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
