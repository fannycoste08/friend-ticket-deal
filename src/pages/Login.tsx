import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Shield, Users, Heart } from "lucide-react";
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-black">
      {/* Hero Section */}
      <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
        <img src={concertHero} alt="Concierto con multitud" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-purple-900/30" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-12 lg:py-0">
          <div className="w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl border border-white/10">
            <Ticket className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Trusticket: Compra y vende entradas de conciertos en confianza
          </h1>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="w-full max-w-md space-y-8">
          <Card className="w-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm" style={{ boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}>
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
                <CardDescription className="text-zinc-400">Entra a tu cuenta de TrusTicket</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
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
                    <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                    <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-zinc-400">¿No tienes cuenta? </span>
                <Link to="/register" className="text-purple-400 hover:text-purple-300 hover:underline font-medium">
                  Regístrate
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* What is Trusticket Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">¿Qué es Trusticket?</h2>
              <p className="text-zinc-300 text-lg">
                La forma más segura de comprar y vender entradas
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Tu red de confianza</h3>
                  <p className="text-zinc-400 text-sm">
                    Funciona a través de los amigos de tus amigos. Compra y vende solo con personas conectadas a tu red.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Sin intermediarios ni riesgos</h3>
                  <p className="text-zinc-400 text-sm">
                    Contacta directamente con el vendedor o comprador. Sin comisiones ocultas ni sorpresas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Comunidad de fans reales</h3>
                  <p className="text-zinc-400 text-sm">
                    Donde la confianza vale más que cualquier comisión. Solo personas reales que aman la música.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
