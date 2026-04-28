import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ComoFunciona = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <article className="max-w-3xl mx-auto fade-in-up">
        {/* Hero */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          Cómo funciona
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
          ¿Cómo funciona Trusticket?
        </h1>
        <p className="text-lg text-muted-foreground italic mb-12">
          Sin comisiones, sin especulación, sin intermediarios. Solo fans ayudando a fans.
        </p>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          {/* Bloque 3 — Red de confianza */}
          <div className="rounded-2xl glass p-8 space-y-4">
            <p>
              <strong className="text-foreground">En Trusticket no ves entradas de desconocidos.</strong> Solo ves lo que publican tus amigos y los amigos de tus amigos.
            </p>
            <p>
              ¿Por qué? Porque si un amigo tuyo le da entrada a alguien, es porque confía en esa persona. Y si tu amigo confía en ella, tú también puedes hacerlo.
            </p>
            <p>
              Es la misma lógica de siempre — la del boca a boca, la del "te lo recomiendo yo" — pero aplicada a las entradas de conciertos.
            </p>
          </div>

          <hr className="border-border/30" />

          {/* Bloque 2 — Tres pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: UserPlus,
                title: "1. Entra por invitación",
                desc: "Trusticket es una comunidad cerrada. Para entrar, alguien que ya está dentro tiene que invitarte. Así nos aseguramos de que todos los miembros son de confianza.",
              },
              {
                Icon: Search,
                title: "2. Publica o busca entradas",
                desc: "¿Tienes una entrada que no vas a usar? Publícala en dos minutos. ¿Buscas entrada para un concierto? Añade tu búsqueda y te avisamos si alguien de tu red la tiene.",
              },
              {
                Icon: Mail,
                title: "3. Contacta directamente",
                desc: "Si encuentras lo que buscas, mandas un mensaje al vendedor directamente. Trusticket solo os pone en contacto — el resto lo hacéis vosotros como queráis.",
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="space-y-3">
                <div className="w-10 h-10 rounded-lg gradient-vibrant flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm">{desc}</p>
              </div>
            ))}
          </div>

          {!user && (
            <>
              <hr className="border-border/30" />

              {/* Bloque 4 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">¿Y si no me invita nadie?</h2>
                <p>
                  Pide a alguien que ya esté en Trusticket que te invite, o escríbenos a{" "}
                  <a
                    href="mailto:trusticketinfo@gmail.com"
                    className="text-primary hover:underline underline-offset-2"
                  >
                    trusticketinfo@gmail.com
                  </a>{" "}
                  y te ayudamos a encontrar a alguien de tu red que ya esté dentro.
                </p>
              </div>

              <hr className="border-border/30" />

              {/* CTA final */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg" className="gradient-vibrant border-0">
                  <Link to="/register">Regístrate</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/manifesto">Lee el Manifiesto</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  );
};

export default ComoFunciona;