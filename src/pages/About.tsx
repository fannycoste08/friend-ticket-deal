import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import fannyPhoto from "@/assets/fanny-photo.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <article className="fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-10">
            Quién está detrás
          </h1>

          <div className="w-full mb-10 flex justify-center">
            <img
              src={fannyPhoto}
              alt="Fanny — Fundadora de Trusticket"
              className="max-h-96 rounded-2xl object-cover border border-border/30"
            />
          </div>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-xl font-semibold text-foreground">Soy Fanny.</p>
            <p className="text-lg">Me flipa la música en directo. Mucho.</p>
            <p>Soy de las que hace listas de Spotify sin parar, de las que descubre grupos y da la turra a sus amigos recomendándolos, de las que siempre está mirando qué conciertos hay esta semana. De hecho, voy mínimo a un concierto a la semana desde hace años.</p>
            <p>Llevo más de 10 años con un Excel donde apunto conciertos a los que quiero ir (sí, un Excel) y hago playlists mensuales en Spotify para no perderme nada de lo que voy descubriendo por el camino.</p>
            <p><strong className="text-foreground">La música me ha regalado algo muy importante: gente.</strong><br />He conocido a buenos amigos gracias a conciertos, festivales y canciones compartidas, y siempre me ha encantado ampliar ese círculo y compartir esta afición con cuanta más gente, mejor.</p>
            <p>Desde hace años, sin darme cuenta, hago de "conectora": poner en contacto a amigos que venden o buscan entradas, pasar favores, evitar reventas absurdas, ayudar a que alguien no se pierda un concierto por una entrada de más o de menos.</p>
            <p><strong className="text-foreground">Trusticket nace exactamente de ahí.</strong><br />De querer llevar ese gesto cotidiano un paso más allá. De ampliar ese círculo de confianza a personas que piensan como nosotros: que no quieren especular con las entradas, que prefieren hacer un favor antes que sacar beneficio, y que creen que el mundo de los conciertos puede ser un sitio un poco más sano del que es ahora.</p>
            <p><strong className="text-foreground">Esto no va de ganar dinero.</strong><br />Va de cuidar algo que nos importa. De hacer que ir a conciertos vuelva a ser solo eso: disfrutar de la música y de la gente que la vive contigo.</p>
            <p className="text-foreground font-medium">Si estás aquí, probablemente compartimos algo más que gustos musicales. Y eso ya es un buen punto de partida.</p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default About;
