import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
        {/* Background image with dark overlay */}
        <div className="absolute inset-0">
          <img
            src={concertHero}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Value proposition */}
            <div className="space-y-8 fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                Compra y vende entradas entre
                <br />
                <span className="gradient-text">amigos.</span>
              </h1>
              <p className="text-lg font-semibold gradient-text max-w-md">
                ¿Por qué existe Trusticket?
              </p>
              <div className="space-y-4">
                {[
                  "Compramos entradas con meses de antelación sin saber si vamos a poder asistir.",
                  "Las plataformas de reventa no son seguras y fomentan la especulación.",
                  "Vender y comprar una entrada se ha convertido en un dolor real para los fans de la música en directo.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 fade-in-up-delay-${i + 1}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full gradient-vibrant mt-2.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Login form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto fade-in-up-delay-1">
              <div className="glass-strong rounded-2xl p-8 shadow-lg" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-foreground leading-snug">
                    Entra y descubre qué ofrecen o buscan tus amigos (y los amigos de tus amigos)
                  </h2>
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
                      className="h-11 bg-secondary/50 border-border/50"
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
                        className="h-11 pr-10 bg-secondary/50 border-border/50"
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
                    className="w-full h-11 font-semibold gradient-primary border-0 hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta aún? Si ya te han apadrinado,{" "}
                  <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 font-medium underline transition-colors"
                  >
                    regístrate
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section — Value blocks */}
      <section className="bg-card/50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-16 tracking-tight leading-tight max-w-3xl mx-auto">
            Somos fans de la música en directo, no participamos en el mercadeo de entradas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Respetamos precios",
                desc: "No sacamos beneficio de la compraventa de entradas. Estamos para compartir nuestra pasión por la música en directo.",
              },
              {
                title: "Reconectamos fans",
                desc: "Sin plataformas de pago. Conectamos hasta 2 grados de amistad para compartir entradas como lo que somos: amigos.",
              },
              {
                title: "Restablecemos comunidad",
                desc: "Está en nuestra mano apoyarnos comprando entradas de amigos que no pueden ir, aunque el concierto no esté sold out.",
              },
            ].map((block, i) => (
              <div key={i} className={`space-y-4 fade-in-up-delay-${i + 1}`}>
                <div className="w-10 h-10 rounded-xl gradient-vibrant flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
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
