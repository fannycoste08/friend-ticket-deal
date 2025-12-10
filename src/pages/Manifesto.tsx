import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Manifesto = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Manifiesto TrusTicket</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground italic">
              Por qué existimos. En qué creemos. Qué hacemos juntos.
            </p>

            <div className="space-y-4">
              <p>
                <strong>Trusticket nació de una idea sencilla:</strong>
                <br />
                la música une, pero el mercado nos aleja.
              </p>

              <p>
                Vivimos en un mundo donde ir a un concierto debería ser un momento memorable por ver a un artista, pero
                a veces lo es por lo complejo que puede llegar a ser conseguir una entrada. Compra con meses de
                antelación, precios abusivos, riesgos, estafas, bots, especulación.
              </p>

              <p>
                <strong>Por eso creamos Trusticket:</strong>
                <br />
                un lugar donde las entradas se mueven entre personas de verdad, conectadas por vínculos reales. Los
                amigos de tus amigos son un puente seguro, y queremos que ese puente sea accesible, humano y justo.
              </p>

              <p>
                Aquí no hay algoritmos que inflan precios.
                <br />
                No hay comisiones escondidas.
                <br />
                No hay mercados opacos.
                <br />
                Solo personas que aman la música y quieren ayudarse entre sí.
              </p>

              <p>
                Pero para que este espacio exista, todos tenemos una responsabilidad. Cuando te unes a Trusticket, te
                comprometes a cuidar este lugar que construimos juntos.
              </p>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Nuestro Compromiso como Comunidad</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">1. Somos honestos</h3>
                  <p className="text-muted-foreground">
                    Publicamos solo entradas reales.
                    <br />
                    No vendemos nada que no tengamos.
                    <br />
                    No engañamos ni jugamos con la ilusión de la gente.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">2. Somos respetuosos</h3>
                  <p className="text-muted-foreground">
                    Tratamos a los demás como trataríamos a un amigo.
                    <br />
                    Respondemos con claridad.
                    <br />
                    Cumplimos nuestra palabra.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">3. No especulamos</h3>
                  <p className="text-muted-foreground">
                    Trusticket no es un mercado para lucrarse.
                    <br />
                    Es una red de confianza.
                    <br />
                    Los precios son los justos, sin abuso, sin reventa inflada.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">4. Protegemos el espacio</h3>
                  <p className="text-muted-foreground">
                    No creamos cuentas falsas.
                    <br />
                    No añadimos personas que no conocemos.
                    <br />
                    No usamos la plataforma para fines ajenos a su espíritu.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">5. Cuidamos la música y a quienes la viven</h3>
                  <p className="text-muted-foreground">
                    Estamos aquí porque amamos los conciertos, los festivales, los momentos compartidos.
                    <br />
                    La música es comunidad; Trusticket también.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Lo que Hacemos Juntos</h2>

              <p>
                Cuando alguien compra o vende una entrada aquí, no solo intercambia un ticket: construye confianza para
                toda la comunidad.
              </p>

              <p>
                Cada gesto honesto, cada trato justo, cada interacción cuidada es lo que hace que Trusticket funcione y
                que podamos seguir disfrutando de la música desde un lugar seguro, limpio y humano.
              </p>
            </div>

            <hr className="border-border" />

            <div className="space-y-4 text-center py-4">
              <h2 className="text-xl font-semibold">Gracias por formar parte.</h2>

              <p>
                Tu presencia aquí hace posible lo que ninguna plataforma ha conseguido: una red de confianza real entre
                personas reales. Esto funciona porque tú quieres que funcione.
              </p>

              <p className="font-semibold text-lg">
                Bienvenido a Trusticket.
                <br />
                La música se vive mejor cuando confiamos los unos en los otros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Manifesto;
