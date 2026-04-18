-- Tabla de tareas QA pre-lanzamiento
CREATE TABLE public.admin_launch_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  task TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_launch_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view launch tasks"
ON public.admin_launch_tasks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert launch tasks"
ON public.admin_launch_tasks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update launch tasks"
ON public.admin_launch_tasks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete launch tasks"
ON public.admin_launch_tasks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_admin_launch_tasks_updated_at
BEFORE UPDATE ON public.admin_launch_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Datos iniciales
INSERT INTO public.admin_launch_tasks (section, task, note, sort_order) VALUES
('1. Registro e invitación', 'Registro vía /register: nombre, email, email del padrino y aceptar manifiesto', 'No se puede enviar sin aceptar el manifiesto', 10),
('1. Registro e invitación', 'El padrino recibe email de solicitud al registrarse un nuevo usuario', 'Comprobar que llega al padrino de prueba', 20),
('1. Registro e invitación', 'El padrino ve la solicitud en su perfil > Gestionar Invitaciones', 'Verificar que aparece nombre y email del solicitante', 30),
('1. Registro e invitación', 'Aprobar solicitud → se crea cuenta y el invitado recibe email con link para crear contraseña', 'Probar el link: debe abrir pantalla de creación de contraseña', 40),
('1. Registro e invitación', 'Rechazar solicitud → no se crea la cuenta', 'Verificar que el solicitante no queda en la BD', 50),
('1. Registro e invitación', 'Invitación directa desde el perfil: el invitado recibe email y la invitación se crea aprobada', '', 60),
('1. Registro e invitación', 'Al aprobar, se crea automáticamente amistad entre padrino y ahijado', 'Comprobar en Mis Amigos de ambos perfiles', 70),
('1. Registro e invitación', 'No se puede invitar a un email ya registrado en la plataforma', 'Validación en formulario de invitación', 80),
('2. Red de confianza', 'Amigos directos (grado 1) aparecen correctamente en el feed', 'Padrinos, ahijados y amigos aceptados', 110),
('2. Red de confianza', 'Amigos de amigos (grado 2) aparecen con indicación ''amigo de X''', 'Verificar que se muestran los amigos en común', 120),
('2. Red de confianza', 'No se ven entradas ni búsquedas de personas fuera de la red', 'Crear usuario sin conexión y verificar que no ve nada', 130),
('2. Red de confianza', 'Solicitud de amistad: el destinatario recibe email de notificación', '', 140),
('2. Red de confianza', 'El destinatario puede aceptar o rechazar; al aceptar aparece en Mis Amigos de ambos', '', 150),
('3. Feed de entradas', 'Pestaña ''Entradas a la venta'': entradas ordenadas por fecha, las propias al final', '', 210),
('3. Feed de entradas', 'Pestaña ''Entradas buscadas'': muestra búsquedas activas con la misma lógica', '', 220),
('3. Feed de entradas', 'Buscador por artista filtra correctamente en ambas pestañas', '', 230),
('3. Feed de entradas', 'Entrada de artista buscado aparece destacada con ''Coincide con tu búsqueda''', 'Crear búsqueda activa y luego publicar esa entrada desde otro usuario', 240),
('3. Feed de entradas', 'Botón ''Me interesa'': abre formulario y llega email al vendedor con datos del interesado', 'Verificar nombre, email, teléfono y mensaje', 250),
('3. Feed de entradas', 'Botón ''Tengo entrada'': abre formulario y llega email al buscador', '', 260),
('4. Publicar entradas y búsquedas', 'Publicar entrada: todos los campos funcionan y los obligatorios bloquean el envío', 'Artista, recinto, ciudad, fecha, tipo, precio, cantidad, descripción', 310),
('4. Publicar entradas y búsquedas', 'Al publicar, se envía email a usuarios que buscan ese artista', 'Crear búsqueda activa antes y verificar que llega el email', 320),
('4. Publicar entradas y búsquedas', 'Publicar búsqueda: campos funcionan y queda visible en el feed de la red', '', 330),
('4. Publicar entradas y búsquedas', 'Editar y eliminar entrada desde el perfil funcionan correctamente', '', 340),
('4. Publicar entradas y búsquedas', 'Marcar entrada como ''vendida'' la desactiva del feed', '', 350),
('4. Publicar entradas y búsquedas', 'Entradas y búsquedas con fecha pasada se eliminan automáticamente', 'Probar con una entrada de fecha ya pasada', 360),
('5. Perfil de usuario', 'Datos personales: se puede editar nombre y email', '', 410),
('5. Perfil de usuario', 'Mis Amigos: lista correcta, ver perfil y eliminar amistad funcionan', '', 420),
('5. Perfil de usuario', 'Mis Entradas: muestra entradas con opciones de editar, eliminar y marcar como vendida', '', 430),
('5. Perfil de usuario', 'Entradas que Busco: muestra búsquedas con opción de editar y eliminar', '', 440),
('5. Perfil de usuario', 'Preferencias de notificaciones: activar/desactivar se respeta en los envíos', '', 450),
('5. Perfil de usuario', 'Eliminar cuenta: requiere escribir ''ELIMINAR'', borra datos y cierra sesión', '', 460),
('6. Autenticación', 'Login normal con email y contraseña funciona', '', 510),
('6. Autenticación', 'Logout cierra sesión y redirige a /login', '', 520),
('6. Autenticación', 'Recuperación de contraseña: /forgot-password envía email solo si existe la cuenta', '', 530),
('6. Autenticación', 'Link de reset password permite establecer nueva contraseña y hacer login', '', 540),
('7. Panel de admin', 'Solo accesible para usuarios con rol admin', '', 610),
('7. Panel de admin', 'Pestaña Usuarios: tabla con email, número de amigos y fecha de registro', '', 620),
('7. Panel de admin', 'Pestaña Emails: editar plantillas y verificar que los cambios se aplican al siguiente envío', '', 630),
('7. Panel de admin', 'Pestaña Docs: crear, editar y eliminar documentación interna', '', 640),
('7. Panel de admin', 'Pestaña Outreach: añadir, editar checks y eliminar contactos', '', 650),
('8. Páginas públicas y feedback', 'Páginas /manifesto, /about, /legal-notice, /privacy-policy y /cookies-policy cargan', '', 710),
('8. Páginas públicas y feedback', 'Botón ''Dar mi opinión'': modal funciona, llega email a costefanny@gmail.com', 'Probar con usuario autenticado', 720),
('8. Páginas públicas y feedback', 'El botón de feedback NO aparece en páginas públicas', '', 730),
('8. Páginas públicas y feedback', 'Cookie banner aparece la primera visita y se guarda la preferencia', '', 740),
('9. Navegación y UX', 'Logo del header navega a /login si no autenticado y a /feed si autenticado', '', 810),
('9. Navegación y UX', 'Scroll vuelve arriba al cambiar de ruta', '', 820),
('9. Navegación y UX', 'Vista responsive móvil correcta en feed, perfil y formularios', 'Probar con viewport <768px', 830);