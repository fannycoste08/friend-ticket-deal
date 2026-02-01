import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import fannyPhoto from "@/assets/fanny-photo.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="bg-card rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Quién está detrás de Trusticket
          </h1>

          <div className="w-full mb-8 flex justify-center">
            <img 
              src={fannyPhoto} 
              alt="Fanny - Fundadora de Trusticket" 
              className="max-h-96 rounded-lg object-cover shadow-md"
            />
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-xl font-semibold text-foreground">
              Soy Fanny.
            </p>

            <p className="text-xl">
              Me flipa la música en directo. Mucho.
            </p>

            <p>
              Soy de las que hace listas de Spotify sin parar, de las que descubre grupos y da la turra a sus amigos recomendándolos, de las que siempre está mirando qué conciertos hay esta semana. De hecho, voy mínimo a un concierto a la semana desde hace años.
            </p>

            <p>
              Llevo más de 10 años con un Excel donde apunto conciertos a los que quiero ir (sí, un Excel) y hago playlists mensuales en Spotify para no perderme nada de lo que voy descubriendo por el camino.
            </p>

            <p>
              <strong className="text-foreground">La música me ha regalado algo muy importante: gente.</strong><br />
              He conocido a buenos amigos gracias a conciertos, festivales y canciones compartidas, y siempre me ha encantado ampliar ese círculo y compartir esta afición con cuanta más gente, mejor.
            </p>

            <p>
              Desde hace años, sin darme cuenta, hago de "conectora": poner en contacto a amigos que venden o buscan entradas, pasar favores, evitar reventas absurdas, ayudar a que alguien no se pierda un concierto por una entrada de más o de menos.
            </p>

            <p>
              <strong className="text-foreground">Trusticket nace exactamente de ahí.</strong><br />
              De querer llevar ese gesto cotidiano un paso más allá.<br />
              De ampliar ese círculo de confianza a personas que piensan como nosotros:<br />
              que no quieren especular con las entradas,<br />
              que prefieren hacer un favor antes que sacar beneficio,<br />
              y que creen que el mundo de los conciertos puede ser un sitio un poco más sano del que es ahora.
            </p>

            <p>
              <strong className="text-foreground">Esto no va de ganar dinero.</strong><br />
              Va de cuidar algo que nos importa.<br />
              De hacer que ir a conciertos vuelva a ser solo eso: disfrutar de la música y de la gente que la vive contigo.
            </p>

            <p className="text-foreground font-medium">
              Si estás aquí, probablemente compartimos algo más que gustos musicales.<br />
              Y eso ya es un buen punto de partida.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
