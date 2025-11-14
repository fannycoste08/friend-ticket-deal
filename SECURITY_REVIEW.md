# Revisión de Seguridad - Flujo de Registro y Autenticación

## ✅ ESTADO GENERAL: SEGURO

El flujo de registro, aprobación y login está correctamente implementado con las medidas de seguridad apropiadas.

---

## 1. FLUJO DE REGISTRO (Usuario No Autenticado)

### Paso 1: Verificación del Email del Padrino
**Edge Function:** `verify-inviter-email` (público, sin JWT)

✅ **Seguridad Implementada:**
- Rate limiting por IP: 5 intentos cada 15 minutos
- Rate limiting por sesión: 3 intentos cada 15 minutos
- Validación de formato de email
- Logging de intentos sospechosos (múltiples búsquedas fallidas)
- Usa Service Role Key para bypass RLS (necesario para usuarios no autenticados)

⚠️ **Consideración:**
- Devuelve datos del invitador (id, name, email) cuando existe
- **JUSTIFICACIÓN:** Necesario para completar el registro sin que el usuario no autenticado pueda hacer queries a la DB
- **MITIGACIÓN:** Rate limiting estricto previene enumeración masiva de usuarios

### Paso 2: Creación de Solicitud de Invitación
**Edge Function:** `create-invitation-request` (público, sin JWT)

✅ **Seguridad Implementada:**
- Rate limiting por IP: 10 invitaciones por hora
- Validación de campos requeridos (inviter_id, invitee_email, invitee_name)
- Validación de formato de email
- Prevención de invitaciones duplicadas (verifica pending existentes)
- Normalización de emails (trim + toLowerCase)
- Usa Service Role Key para bypass RLS

### Paso 3: Envío de Notificación
**Edge Function:** `send-invitation-notification` (público, sin JWT)

✅ **Seguridad Implementada:**
- Verifica que la invitación existe en la DB antes de enviar email
- Usa API de Resend con API key almacenada como secret
- No expone información sensible en los logs

---

## 2. FLUJO DE APROBACIÓN (Padrino Autenticado)

### Aprobación de Invitación
**Edge Function:** `approve-invitation` (requiere JWT)

✅ **Seguridad Implementada:**
- **Autenticación obligatoria:** Verifica JWT token
- **Autorización:** Solo el inviter_id puede aprobar su propia invitación
- Verifica propiedad: `invitation.inviter_id !== user.id` → 403 Forbidden
- Crea usuario con contraseña temporal UUID (criptográficamente segura)
- Genera link de recuperación sin enviar email por defecto de Supabase
- Almacena metadata del inviter en el usuario (para crear amistad automática)
- Email confirmado automáticamente: `email_confirm: true`
- Rollback de estado si falla la creación del usuario

---

## 3. FLUJO DE LOGIN

### Creación de Contraseña
**Página:** `/create-password`

✅ **Seguridad Implementada:**
- Usa token de recovery de Supabase (hash seguro, de un solo uso, con expiración)
- Validación de contraseña (mínimo 8 caracteres)
- Redirect automático después de cambiar contraseña

### Login Estándar
**Página:** `/login`

✅ **Seguridad Implementada:**
- Usa `supabase.auth.signInWithPassword`
- Validación de email y contraseña
- Manejo de errores sin exponer detalles del sistema
- Session storage en localStorage con auto-refresh de tokens

### Creación Automática de Amistad
**DB Trigger:** `create_friendship_on_user_registration`

✅ **Seguridad Implementada:**
- Se ejecuta después de insertar en profiles
- Usa el email del inviter almacenado en user metadata
- Solo crea amistad si existe invitación aprobada del padrino específico
- Previene duplicados: `ON CONFLICT DO NOTHING`
- Security Definer: ejecuta con privilegios del owner, bypass RLS

---

## 4. POLÍTICAS RLS (Row Level Security)

### Tabla: invitations

✅ **Políticas Correctas:**
```sql
-- SELECT: Solo el inviter puede ver sus propias invitaciones
auth.uid() = inviter_id

-- SELECT: Usuarios pueden ver invitaciones aprobadas para su email
status = 'approved' AND invitee_email = (SELECT email FROM profiles WHERE id = auth.uid())

-- INSERT: Solo usuarios autenticados pueden crear invitaciones como inviter
auth.uid() = inviter_id

-- UPDATE: Solo el inviter puede actualizar sus invitaciones
auth.uid() = inviter_id

-- DELETE: Solo el inviter puede eliminar sus invitaciones
auth.uid() = inviter_id
```

### Tabla: profiles

✅ **Políticas Correctas:**
```sql
-- SELECT (propia): Usuarios ven su propio perfil
auth.uid() = id

-- SELECT (otros): Solo pueden ver perfiles en su red extendida
id IN (SELECT network_user_id FROM get_extended_network(auth.uid()))

-- INSERT/UPDATE: Solo su propio perfil
auth.uid() = id
```

### Tabla: friendships

✅ **Políticas Correctas:**
```sql
-- SELECT: Ver amistades donde el usuario es parte
auth.uid() = user_id OR auth.uid() = friend_id

-- INSERT: Crear solicitudes como user_id
auth.uid() = user_id

-- UPDATE: Solo el receptor puede actualizar (aceptar/rechazar)
auth.uid() = friend_id

-- DELETE: Solo quien creó la solicitud puede eliminarla
auth.uid() = user_id
```

---

## 5. RATE LIMITING

### IP-based Rate Limiting
✅ Implementado en:
- `verify-inviter-email`: 5 intentos / 15 min
- `create-invitation-request`: 10 intentos / 60 min

### Session-based Rate Limiting
✅ Implementado en:
- `verify-inviter-email`: 3 intentos / 15 min
- Genera fingerprint basado en IP + User-Agent + Accept-Language

### Logging de Actividad Sospechosa
✅ Se registra en tabla `suspicious_activity_log`:
- Rate limits excedidos
- Múltiples búsquedas fallidas de emails
- Incluye metadata: IP, número de intentos, último email buscado

---

## 6. VALIDACIÓN DE ENTRADA

### Validación de Emails
✅ Función compartida `validateEmail()`:
- Regex estándar de validación de email
- Usada en todos los edge functions que reciben emails

### Normalización de Datos
✅ Implementada:
- Emails: `trim().toLowerCase()`
- Nombres: `trim()`
- Consistencia en toda la aplicación

---

## 7. SECRETOS Y CONFIGURACIÓN

### Secrets Almacenados de Forma Segura
✅ Variables de entorno en Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

### Configuración de Edge Functions
✅ En `supabase/config.toml`:
```toml
[functions.verify-inviter-email]
verify_jwt = false  # Necesario para usuarios no autenticados

[functions.create-invitation-request]
verify_jwt = false  # Necesario para usuarios no autenticados

[functions.send-invitation-notification]
verify_jwt = false  # Necesario para envío de emails

[functions.approve-invitation]
verify_jwt = true   # REQUIERE autenticación del padrino
```

---

## 8. POSIBLES MEJORAS (OPCIONALES)

### Enumeración de Usuarios
⚠️ **Consideración:**
- `verify-inviter-email` devuelve si un email existe en el sistema
- **Riesgo:** Baja prioridad - rate limiting estricto (3-5 intentos)
- **Mitigación Adicional Posible:** 
  - Implementar CAPTCHA después de 2 intentos fallidos
  - Delay incremental entre intentos (backoff exponencial)

### CAPTCHA en Registro
💡 **Sugerencia:**
- Añadir CAPTCHA (reCAPTCHA, hCaptcha, Turnstile) en formulario de registro
- Previene bots de crear solicitudes masivas de invitación

### Logs de Auditoría
💡 **Sugerencia:**
- Registrar todas las aprobaciones de invitaciones
- Tabla de auditoría con: quién aprobó, cuándo, IP, etc.

---

## 9. CONCLUSIÓN

✅ **El sistema es SEGURO y está listo para producción**

**Fortalezas principales:**
1. Rate limiting robusto (IP + sesión)
2. RLS policies correctamente configuradas
3. Autenticación y autorización adecuadas
4. Validación de entrada en todos los puntos
5. Uso correcto de Service Role Key solo cuando es necesario
6. Triggers de DB con Security Definer para lógica sensible
7. Secrets almacenados de forma segura
8. Logging de actividad sospechosa

**No hay vulnerabilidades críticas detectadas.**

Las mejoras sugeridas son optimizaciones opcionales que pueden implementarse si se detecta abuso en el futuro.
