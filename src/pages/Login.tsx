import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={concertHero}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Value proposition */}
            <div className="space-y-8 fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Compra y vende entradas entre
                <br />
                <span className="text-primary">amigos.</span>
              </h1>
              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Compra y vende entradas de conciertos dentro de tu red de
                confianza. Sin especulación, sin comisiones.
              </p>
              <div className="space-y-4">
                {[
                  "Sin sobreprecio. Precios justos entre personas reales.",
                  "Sin plataformas de pago. Conecta con amigos y amigos de amigos.",
                  "Sin riesgo. Solo personas verificadas por la comunidad.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 fade-in-up-delay-${i + 1}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                    <p className="text-sm text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Login form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto fade-in-up-delay-1">
              <div className="bg-card/95 backdrop-blur-lg rounded-xl p-8 border border-border/50 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-card-foreground">
                    Iniciar sesión
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accede a tu cuenta
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                    {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Regístrate
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section — Value blocks */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center mb-4">
            Nuestra filosofía
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-16 tracking-tight leading-tight max-w-2xl mx-auto">
            Somos fans de la música, no del mercadeo de entradas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Precios justos",
                desc: "No sacamos beneficio de la compraventa. Estamos para compartir nuestra pasión por la música en directo.",
              },
              {
                title: "Red de confianza",
                desc: "Conectamos hasta 2 grados de amistad para compartir entradas como lo que somos: amigos.",
              },
              {
                title: "Comunidad real",
                desc: "Apoyarnos comprando entradas de amigos que no pueden ir. Sin intermediarios, sin algoritmos.",
              },
            ].map((block, i) => (
              <div key={i} className={`space-y-4 fade-in-up-delay-${i + 1}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {block.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {block.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
