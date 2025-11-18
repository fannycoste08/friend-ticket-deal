import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Aviso Legal</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Identificación</h2>
              <p className="text-muted-foreground">
                En cumplimiento de lo establecido en la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa que el titular del sitio web www.trusticket.com es:a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Titular: Fanny Coste</li>
                <li>DNI: 60006070J</li>
                <li>Email de contacto: trusticketinfo@gmail.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Objeto</h2>
              <p className="text-muted-foreground">
                Trusticket es una plataforma social que permite a los usuarios conectar entre sí mediante contactos en común para publicar, solicitar o descubrir entradas de conciertos y eventos.
                Trusticket no vende entradas, no gestiona pagos, no cobra comisiones y no interviene en las transacciones. La plataforma únicamente facilita el contacto entre usuarios.

              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Condiciones de Uso</h2>
              <p className="text-muted-foreground">
                El acceso y uso de la plataforma implica la aceptación de estos términos. Los usuarios se comprometen a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Utilizar la plataforma de forma lícita</li>
                <li>No publicar contenido falso, fraudulento u ofensivo</li>
                <li>No suplantar identidades ni crear perfiles falsos</li>
                <li>No utilizar Trusticket para actividades comerciales no autorizadas</li>
                <li>No interferir en el funcionamiento técnico de la web</li>
                
              </ul>
              <p className="text-muted-foreground mt-2">
                Trusticket podrá limitar o suspender el acceso a usuarios que incumplan estas normas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Responsabilidad</h2>
              <p className="text-muted-foreground">
                TrusTicket actúa como intermediario entre compradores y vendedores. No nos hacemos responsables de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>La autenticidad de las entradas publicadas</li>
                <li>Las transacciones realizadas entre usuarios</li>
                <li>Los eventos cancelados o modificados por los organizadores</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Recomendamos verificar siempre la información antes de realizar cualquier transacción.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Propiedad Intelectual</h2>
              <p className="text-muted-foreground">
                Todos los contenidos de la plataforma (diseño, código, logos, textos) están protegidos por derechos de
                propiedad intelectual y son propiedad del titular o sus licenciantes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Legislación Aplicable</h2>
              <p className="text-muted-foreground">
                Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se
                someterán a los juzgados y tribunales del domicilio del usuario.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalNotice;
