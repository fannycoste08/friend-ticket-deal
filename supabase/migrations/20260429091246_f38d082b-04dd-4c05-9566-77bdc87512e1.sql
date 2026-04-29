UPDATE public.admin_docs SET content = $DOC$# Funcionamiento de Trusticket

## ¿Qué es Trusticket?
Trusticket es una plataforma de compraventa de entradas de conciertos basada en la confianza. Solo puedes acceder si alguien que ya está dentro te invita (sistema de apadrinamiento). No se permite la reventa ni la especulación. Respetamos los precios originales.

---

## 1. REGISTRO E INVITACIÓN

### Cómo se registra un nuevo usuario:
1. El nuevo usuario accede a /register
2. Rellena: nombre, email y el email de la persona que le apadrina
3. Debe aceptar el manifiesto de Trusticket (checkbox obligatorio)
4. Se envía una solicitud al padrino/madrina

### Qué pasa por detrás:
- Se verifica que el email del padrino existe en el sistema
- Se crea una "invitación" con estado "pendiente"
- Se envía un email al padrino avisándole de la solicitud
- Rate limiting: 15 intentos por IP / 10 por sesión cada 15 minutos
- Protección contra enumeración de emails en endpoints de verificación

### Aprobación por el padrino:
1. El padrino ve la solicitud pendiente en su perfil (sección "Gestionar Invitaciones")
2. Puede APROBAR o RECHAZAR
3. Si aprueba: se crea la cuenta del usuario y se le envía un email para crear su contraseña
4. Se crea automáticamente una relación de amistad entre padrino y ahijado (trigger en BD)

### Invitación directa por email:
- Un usuario registrado puede invitar directamente a alguien desde su perfil
- Escribe el email de la persona → se crea la invitación ya aprobada → se envía email al invitado

### Invitación por enlace personal (NUEVO):
- Cada usuario tiene un enlace personal /invite/[token] que puede compartir
- El enlace es multi-uso y caduca a los 7 días
- Quien lo recibe rellena un formulario; las solicitudes requieren aprobación manual del propietario del link
- Útil para invitar a varias personas sin tener que escribir un email cada vez

### Recuperación de contraseña:
- /forgot-password valida primero que el email exista antes de enviar el enlace de recuperación
- Tras crear contraseña desde un invite, se fuerza login (sesión no persistente para enlaces de un solo uso)

---

## 2. RED DE CONFIANZA (Network)

### Grados de conexión:
- **Grado 1**: Amigos directos (padrinos, ahijados, amigos aceptados)
- **Grado 2**: Amigos de amigos

### Qué ves según tu red:
- Solo ves entradas y búsquedas de personas dentro de tu red (grado 1 y 2)
- En cada entrada se muestra el grado de conexión
- Para grado 2: se muestran los amigos en común
- Las políticas RLS de la BD restringen la visibilidad de perfiles a amigos directos

### Solicitudes de amistad:
- Desde el perfil de otro usuario puedes enviar una solicitud de amistad
- El otro usuario la ve en su perfil y puede aceptar o rechazar
- Se envía un email de notificación cuando alguien te envía una solicitud
- Las amistades son recíprocas: eliminar a un amigo borra la relación en ambos sentidos

### Personas que quizás conoces (NUEVO):
- En la pestaña "Mis Amigos" del perfil aparece una sección de sugerencias (amigos de tus amigos)
- Diferenciada visualmente con borde discontinuo y aviso: "Añade solo a personas que conozcas en la vida real"
- Botón "Añadir" para enviar solicitud directamente

---

## 3. FEED DE ENTRADAS

### Pestaña "Entradas a la Venta":
- Muestra entradas publicadas por personas de tu red
- Se ordenan por fecha del evento (las más próximas primero)
- Tus propias entradas aparecen al final
- Si alguien vende una entrada de un artista que TÚ buscas, aparece destacada con etiqueta "Coincide con tu búsqueda"
- Buscador por nombre de artista

### Pestaña "Entradas Buscadas":
- Muestra búsquedas activas de personas de tu red
- Misma lógica de ordenación y filtrado

### Contactar:
- Al pulsar "Me interesa" (venta) o "Tengo entrada" (búsqueda), se abre un formulario de contacto
- Se rellena: nombre, email, teléfono y mensaje
- Se envía un email al vendedor/buscador con los datos del interesado
- IMPORTANTE: NO existe mensajería interna en la plataforma. Todo contacto entre usuarios es por email.

---

## 4. PUBLICAR ENTRADAS

### Publicar entrada en venta:
- Desde el Feed o desde el Perfil, botón "Publicar Entrada"
- Campos: artista (máx. 100 caracteres), recinto, ciudad, fecha, tipo (general/VIP/pista/grada), precio, cantidad, descripción (máx. 100 caracteres)
- Al publicar, se notifica automáticamente por email a los usuarios de tu red que buscan ese artista

### Publicar búsqueda:
- Botón "Añadir búsqueda"
- Campos: artista, ciudad, fecha
- Queda visible para toda tu red
- Toggle global de notificaciones por email en el perfil para silenciar coincidencias

---

## 5. PERFIL DE USUARIO (Layout dashboard con sidebar)

### Secciones del perfil:
1. **Datos personales**: nombre y email
2. **Solicitudes de amistad**: pendientes de aceptar/rechazar (badge dinámico con contador)
3. **Gestionar Invitaciones**: ver solicitudes pendientes, aprobar/rechazar, invitar nuevas personas, gestionar enlace personal
4. **Mis Amigos**: lista de amigos con botón "Ver Perfil" + sección "Personas que quizás conoces"
5. **Mis Entradas**: entradas publicadas con opciones de editar, eliminar o marcar como vendida
6. **Entradas que Busco**: búsquedas activas con opción de editar o eliminar
7. **Preferencias de Notificaciones**: toggle global para emails de coincidencias de búsqueda
8. **Eliminar cuenta**: borrado permanente en cascada (requiere escribir "ELIMINAR" para confirmar)

### Ver perfil de un amigo:
- Vista de solo lectura con sus entradas publicadas y búsquedas activas

---

## 6. NOTIFICACIONES POR EMAIL

### Tipos de emails que se envían:
1. **Solicitud de registro**: cuando alguien quiere registrarse → email al padrino
2. **Invitación aprobada**: cuando el padrino acepta → email al nuevo usuario con link para crear contraseña
3. **Interés en una entrada**: cuando alguien pulsa "Me interesa" → email al vendedor con datos del interesado
4. **Coincidencia de búsqueda**: cuando se publica una entrada que coincide con una búsqueda → email al buscador
5. **Solicitud de amistad**: cuando alguien te envía solicitud → email de notificación
6. **Opinión de usuario (feedback)**: email al admin cuando un usuario envía opinión

Los emails se obtienen siempre del lado servidor (nunca expuestos en APIs públicas).

---

## 7. LIMPIEZA AUTOMÁTICA

- Cron diario a las 3 AM elimina entradas y búsquedas con fecha de evento pasada
- Esto mantiene el feed siempre actualizado con eventos futuros

---

## 8. SEGURIDAD

- Acceso solo por invitación (no hay registro abierto)
- Cada usuario solo ve datos de su red (grado 1 y 2)
- Políticas RLS RESTRICTIVAS en tablas críticas (profiles, tickets, wanted_tickets, friendships)
- Funciones SECURITY DEFINER para conteos administrativos sin filtrar datos
- Rate limiting (IP y sesión) en endpoints sensibles
- Protección anti-enumeración de emails
- Sólo se exponen campos públicos en respuestas de API (nunca email/teléfono)
- signOut limpia la sesión local incluso si falla el servidor
- Edge functions de invitación usan service role key + verify_jwt = false donde aplica
- Panel de admin protegido por rol en tabla user_roles (nunca en profiles)

---

## 9. PÁGINAS PÚBLICAS

- **/**: Landing
- **/login**, **/register**, **/forgot-password**, **/reset-password**: Auth
- **/como-funciona**: Explica el funcionamiento en 4 pasos (entra por invitación, publica/busca, contacta directamente, invita a tus amigos). Visible para públicos y autenticados; los CTAs de registro se ocultan si ya estás logueado
- **/manifesto**: Manifiesto de Trusticket (reglas de uso) — aceptación obligatoria en registro
- **/musica**: Página dedicada a música
- **/about**: Quién está detrás de Trusticket (historia de Fanny)
- **/invite/[token]**: Página de invitación por enlace personal
- **/legal-notice**, **/privacy-policy**, **/cookies-policy**: Legales
- Banner de cookies persistente (guardado en localStorage)

### Navegación:
- Header con orden: Cómo funciona — Manifesto — Música — Quién está detrás
- Logo del header lleva a /login (no autenticados) o /feed (autenticados)
- ScrollToTop reinicia el scroll al cambiar de ruta

---

## 10. PANEL DE ADMINISTRACIÓN (/admin)

- Solo accesible para usuarios con rol "admin"
- **Pestaña Usuarios**: tabla con todos los usuarios, email, número de amigos (bidireccional) y fecha de registro
- **Pestaña Documentación**: documentos internos del proyecto (este documento, por ejemplo)
- **Pestaña Emails**: gestión de plantillas de emails automáticos
- **Pestaña Outreach**: tracking tipo CRM de contactos externos (estado, notas, seguimiento)

---

## 11. BOTÓN DE FEEDBACK / OPINIÓN

### Descripción:
- En todas las páginas de la parte privada (cuando el usuario está autenticado), aparece un botón flotante en la esquina inferior derecha con el texto "Dar mi opinión sobre Trusticket"
- En móvil se muestra una versión compacta del botón ("Opinión")

### Funcionamiento:
1. El usuario pulsa el botón flotante
2. Se abre un formulario modal con un campo de texto libre
3. Campo obligatorio, máximo 2.000 caracteres, contador en tiempo real
4. El botón "Enviar opinión" permanece desactivado hasta escribir al menos un carácter
5. Al enviar, se manda un email a costefanny@gmail.com con contenido, nombre y email del usuario

### Detalles técnicos:
- Componentes: FeedbackButton.tsx y FeedbackDialog.tsx
- Edge function: send-feedback-email (vía Resend)
- Validación server-side: campo obligatorio, máx. 2.000 caracteres, HTML escapado

---

## 12. GESTIÓN DE PLANTILLAS DE EMAIL

### Descripción:
- En el panel de administración existe una pestaña "Emails" donde se pueden ver y editar todas las plantillas de correos automáticos.

### Plantillas disponibles:
1. **Solicitud de registro pendiente** (invitation-pending)
2. **Invitación aprobada** (invitation-accepted)
3. **Interés en una entrada** (contact-email)
4. **Solicitud de amistad** (friendship-notification)
5. **Coincidencia de búsqueda** (wanted-ticket-match)
6. **Opinión de usuario** (feedback-email)

### Cómo editar:
1. Admin → Emails → expandir plantilla → "Editar"
2. Modificar asunto y/o HTML usando variables {{nombre_variable}} (mostradas como badges)
3. "Vista previa" para verificar el resultado
4. Guardar — se aplica inmediatamente a próximos envíos

### Detalles técnicos:
- Tabla email_templates con template_key único
- Edge functions leen plantillas de la BD; fallback hardcodeado si no existe
- Solo admins pueden ver/editar

---

## 13. OUTREACH (CRM interno de admin)

- Pestaña en el panel de admin para registrar contactos externos (potenciales usuarios, prensa, partners)
- Campos: nombre, email, contexto, estado (pendiente / contactado / respondido / cerrado), notas, fecha de seguimiento
- Permite hacer un seguimiento manual sin salir de la plataforma
$DOC$, updated_at = now() WHERE id = '4febf560-a3e2-4ac1-83ce-0ec8dc29f7ab';