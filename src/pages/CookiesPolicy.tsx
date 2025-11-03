import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CookiesPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Política de Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. ¿Qué son las cookies?</h2>
              <p className="text-muted-foreground">
                Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas nuestra plataforma. Se utilizan para mejorar tu experiencia y hacer que el sitio funcione correctamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Cookies que Utilizamos</h2>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Cookies Técnicas (Necesarias)</h3>
                <p className="text-muted-foreground mb-2">
                  Estas cookies son esenciales para el funcionamiento de la plataforma:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Autenticación:</strong> Para mantener tu sesión iniciada</li>
                  <li><strong>Seguridad:</strong> Para proteger tu cuenta y prevenir fraudes</li>
                  <li><strong>Preferencias:</strong> Para recordar tus configuraciones (tema, idioma)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Estas cookies no se pueden deshabilitar ya que son necesarias para el funcionamiento del servicio.
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Cookies de Análisis</h3>
                <p className="text-muted-foreground mb-2">
                  Utilizamos cookies para entender cómo los usuarios interactúan con la plataforma:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Análisis de tráfico y uso de la plataforma</li>
                  <li>Identificación de errores técnicos</li>
                  <li>Mejora de la experiencia del usuario</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cookies de Terceros</h2>
              <p className="text-muted-foreground">
                Utilizamos servicios de terceros que pueden establecer sus propias cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li><strong>Supabase:</strong> Para la gestión de autenticación y base de datos</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Estos servicios tienen sus propias políticas de privacidad que puedes consultar en sus respectivos sitios web.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Duración de las Cookies</h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong>Cookies de sesión:</strong> Se eliminan cuando cierras el navegador</p>
                <p><strong>Cookies persistentes:</strong> Permanecen en tu dispositivo durante un período determinado (máximo 1 año) o hasta que las elimines manualmente</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Gestión de Cookies</h2>
              <p className="text-muted-foreground">
                Puedes configurar tu navegador para rechazar las cookies o para que te avise cuando se envíe una cookie. Sin embargo, ten en cuenta que algunas funcionalidades de la plataforma pueden no funcionar correctamente si deshabilitas las cookies.
              </p>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Cómo gestionar cookies en tu navegador:</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                  <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                  <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                  <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Consentimiento</h2>
              <p className="text-muted-foreground">
                Al utilizar nuestra plataforma, aceptas el uso de cookies según se describe en esta política. Si no estás de acuerdo, por favor, configura tu navegador o no uses la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Actualizaciones</h2>
              <p className="text-muted-foreground">
                Podemos actualizar esta política de cookies ocasionalmente. Te recomendamos revisarla periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
              <p className="text-muted-foreground">
                Si tienes preguntas sobre nuestra política de cookies, contacta con nosotros en: info@trusticket.com
              </p>
            </section>

            <p className="text-sm text-muted-foreground mt-8">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiesPolicy;
