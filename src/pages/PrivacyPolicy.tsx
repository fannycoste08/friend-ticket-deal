import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Responsable del Tratamiento</h2>
              <p className="text-muted-foreground">
                TrusTicket es el responsable del tratamiento de los datos personales que nos proporciones.
              </p>
              <p className="text-muted-foreground mt-2">
                Email de contacto: info@trusticket.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Datos que Recopilamos</h2>
              <p className="text-muted-foreground">
                Recopilamos y tratamos los siguientes datos personales:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li><strong>Datos de registro:</strong> Nombre, email, contraseña (encriptada)</li>
                <li><strong>Datos de perfil:</strong> Información adicional que decidas compartir</li>
                <li><strong>Datos de uso:</strong> Información sobre cómo usas la plataforma</li>
                <li><strong>Datos de invitaciones:</strong> Conexiones con otros usuarios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Finalidad del Tratamiento</h2>
              <p className="text-muted-foreground">
                Utilizamos tus datos para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Gestionar tu cuenta y autenticación</li>
                <li>Facilitar la compraventa de entradas entre usuarios</li>
                <li>Gestionar el sistema de invitaciones y confianza</li>
                <li>Enviarte notificaciones importantes sobre tu cuenta</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Base Legal</h2>
              <p className="text-muted-foreground">
                El tratamiento de tus datos se basa en:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li><strong>Ejecución del contrato:</strong> Para proporcionar el servicio solicitado</li>
                <li><strong>Consentimiento:</strong> Para enviar comunicaciones comerciales (si lo autorizas)</li>
                <li><strong>Interés legítimo:</strong> Para mejorar la seguridad y prevenir fraudes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Conservación de Datos</h2>
              <p className="text-muted-foreground">
                Conservaremos tus datos mientras mantengas tu cuenta activa o durante el tiempo necesario para cumplir con las obligaciones legales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Compartición de Datos</h2>
              <p className="text-muted-foreground">
                No vendemos ni compartimos tus datos personales con terceros, excepto:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Información de perfil visible para otros usuarios de la plataforma</li>
                <li>Cuando sea requerido por ley</li>
                <li>Con proveedores de servicios que nos ayudan a operar la plataforma (siempre bajo acuerdos de confidencialidad)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Tus Derechos</h2>
              <p className="text-muted-foreground">
                Tienes derecho a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li><strong>Acceso:</strong> Solicitar una copia de tus datos</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
                <li><strong>Supresión:</strong> Eliminar tu cuenta y datos</li>
                <li><strong>Portabilidad:</strong> Obtener tus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte a ciertos tratamientos</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Para ejercer estos derechos, contacta con nosotros en: info@trusticket.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Seguridad</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cambios en la Política</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de actualizar esta política. Te notificaremos cualquier cambio significativo.
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

export default PrivacyPolicy;
