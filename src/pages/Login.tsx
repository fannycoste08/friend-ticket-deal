import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Shield, Users, Heart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import concertHero from "@/assets/concert-hero.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email o contraseña incorrectos");
      } else {
        toast.error("Error al iniciar sesión: " + error.message);
      }
      setLoading(false);
      return;
    }

    toast.success("¡Bienvenido!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Sección Central - 2 Columnas */}
      <div 
        className="w-full py-16 px-6 lg:px-12 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${concertHero})` }}
      >
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Compra y vende entradas entre amigos
            </h1>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-blue-400">
                Un espacio de confianza:
              </h2>
              <ul className="space-y-4 text-zinc-300 text-lg">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span>Sin sobreprecios por la entrada</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span>Sin costes por la plataforma</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span>Sin miedos, todo queda entre amigos</span>
                </li>
              </ul>
            </div>
          </div>

          {/* COLUMNA DERECHA - Login */}
          <div className="w-full">
            <Card className="w-full bg-zinc-900/90 border-zinc-800 backdrop-blur-sm shadow-2xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-white text-center">
                  Entra y descubre qué ofrecen o buscan tus amigos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-zinc-800/50 border-zinc-700 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm text-zinc-400">
                  ¿No tienes cuenta aún? Si ya te han apadrinado,{" "}
                  <Link to="/register" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                    regístrate
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sección Inferior - 3 Columnas */}
      <div className="w-full bg-black border-t border-zinc-800 py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-16">
            Somos fans de la música en directo, no carne del mercado de entradas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Bloque 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900/40 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-white font-semibold text-xl">Respetamos precios</h3>
              <p className="text-zinc-400 leading-relaxed">
                No sacamos beneficio de la compraventa de entradas. Estamos para compartir nuestra pasión por la música en directo.
              </p>
            </div>

            {/* Bloque 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900/40 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-white font-semibold text-xl">Reconectamos fans</h3>
              <p className="text-zinc-400 leading-relaxed">
                Sin plataformas de pago. Conectamos hasta 2 grados de amistad para compartir entradas como lo que somos: amigos.
              </p>
            </div>

            {/* Bloque 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900/40 flex items-center justify-center">
                <Heart className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-white font-semibold text-xl">Restablecemos comunidad</h3>
              <p className="text-zinc-400 leading-relaxed">
                Está en nuestra mano apoyarnos comprando entradas de amigos que no pueden ir, aunque el concierto no esté sold out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
