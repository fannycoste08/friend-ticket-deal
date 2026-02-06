const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-strong rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h1 className="text-3xl font-bold text-foreground mb-8">Política de Privacidad</h1>
          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Responsable del Tratamiento</h2>
              <p><strong>Titular:</strong> Fanny Coste<br /><strong>DNI:</strong> 60006070J<br /><strong>Domicilio:</strong> Calle Atocha 117, 5º Dcha, 28012 Madrid<br /><strong>Correo electrónico:</strong> trusticketinfo@gmail.com</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Datos que se recogen</h2>
              <p className="text-muted-foreground">Trusticket únicamente recopila los datos necesarios para crear y mantener una cuenta de usuario en la plataforma:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2"><li>Nombre y apellidos</li><li>Correo electrónico</li><li>Lista de amigos o contactos dentro de la plataforma</li><li>Entradas publicadas o solicitadas</li><li>Preferencias de notificaciones</li></ul>
              <p>No se recopilan datos bancarios ni datos sensibles.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Finalidad del Tratamiento</h2>
              <p className="text-muted-foreground">Utilizamos tus datos para:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2"><li>Gestionar el registro y acceso a la plataforma</li><li>Mostrar relaciones de amistad y contactos en común</li><li>Permitir la publicación y visualización de entradas</li><li>Facilitar el contacto entre usuarios</li><li>Enviar notificaciones opcionales sobre nuevas entradas</li><li>Mejorar la experiencia de uso del servicio</li></ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Base Legal</h2>
              <p>La base jurídica es el consentimiento del usuario al registrarse y la ejecución del servicio solicitado.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Conservación de Datos</h2>
              <p className="text-muted-foreground">Conservaremos tus datos mientras mantengas tu cuenta activa o durante el tiempo necesario para cumplir con las obligaciones legales.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Compartición de Datos</h2>
              <p className="text-muted-foreground">No vendemos ni compartimos tus datos personales con terceros, excepto:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2"><li>Información de perfil visible para otros usuarios de la plataforma</li><li>Cuando sea requerido por ley</li><li>Con proveedores de servicios que nos ayudan a operar la plataforma (siempre bajo acuerdos de confidencialidad)</li></ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Tus Derechos</h2>
              <p className="text-muted-foreground">Tienes derecho a:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2"><li><strong>Acceso:</strong> Solicitar una copia de tus datos</li><li><strong>Rectificación:</strong> Corregir datos inexactos</li><li><strong>Supresión:</strong> Eliminar tu cuenta y datos</li><li><strong>Portabilidad:</strong> Obtener tus datos en formato estructurado</li><li><strong>Oposición:</strong> Oponerte a ciertos tratamientos</li><li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li></ul>
              <p className="text-muted-foreground mt-2">Para ejercer estos derechos, contacta con nosotros en: trusticketinfo@gmail.com</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Seguridad</h2>
              <p className="text-muted-foreground">Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Cambios en la Política</h2>
              <p className="text-muted-foreground">Nos reservamos el derecho de actualizar esta política. Te notificaremos cualquier cambio significativo.</p>
            </section>
            <p className="text-sm text-muted-foreground mt-8">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
