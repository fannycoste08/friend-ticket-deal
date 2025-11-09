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
      {/* Hero Section */}
      <div className="relative w-full min-h-[40vh] overflow-hidden">
        <img
          src={concertHero}
          alt="Concierto con multitud"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-blue-900/30" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl border border-white/10">
            <Ticket className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Conecta con los amigos de tus amigos para comprar y vender entradas de conciertos en confianza
          </h1>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="w-full flex items-center justify-center p-8 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="w-full max-w-md">
          <Card
            className="w-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm"
            style={{ boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}
          >
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
                <CardDescription className="text-zinc-400">Entra a tu cuenta de Trusticket</CardDescription>
              </div>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-300">
                      Contraseña
                    </Label>
                    <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
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
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-zinc-400">¿No tienes cuenta? </span>
                <Link to="/register" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                  Regístrate
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* What is Trusticket Section - Full Width */}
      <div className="w-full bg-gradient-to-b from-zinc-900 to-black border-t border-zinc-800 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">¿Por qué Trusticket?</h2>
            <p className="text-zinc-300 text-xl mb-2">
              La forma más segura de comprar y vender entradas entre personas reales.
            </p>
            <p className="text-zinc-400 text-lg">
              Porque nadie mejor que tus amigos —y los amigos de tus amigos— para ayudarte a comprar o vender entradas
              con confianza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-blue-900/30 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Tu red de confianza</h3>
              <p className="text-zinc-400">
                Descubre qué entradas venden tus amigos y los amigos de tus amigos. Todas esas personas en las que
                puedes confiar.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-blue-900/30 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Sin plataforma de pago</h3>
              <p className="text-zinc-400">
                Contacta con el vendedor o comprador y gestiona la transacción por tu cuenta.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-blue-900/30 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Comunidad de fans reales</h3>
              <p className="text-zinc-400">
                Solo se accede con invitación para crear una comunidad de personas que quieren disfrutar de la música de
                una forma más ética.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
