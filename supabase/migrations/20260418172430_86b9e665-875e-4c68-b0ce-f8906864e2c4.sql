UPDATE public.email_templates
SET 
  subject = 'Tu cuenta en TrusTicket está lista',
  html_content = '<!DOCTYPE html>
<html>
  <head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''Roboto'', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
      .info-box { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1 style="margin: 0;">Tu cuenta en TrusTicket está lista</h1></div>
      <div class="content">
        <p>Hola <strong>{{invitee_name}}</strong>,</p>
        <p><strong>{{inviter_name}}</strong> ha aprobado tu solicitud. Ya puedes acceder a TrusTicket.</p>
        <div class="info-box">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">🔑 Crea tu contraseña</p>
          <p style="margin: 10px 0 20px 0; font-size: 14px;">Haz clic en el botón para activar tu cuenta:</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td align="center" bgcolor="#3b82f6" style="border-radius: 8px;">
                <a href="{{password_reset_link}}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: #3b82f6; border-radius: 8px;">Crear mi contraseña</a>
              </td>
            </tr>
          </table>
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;">Necesitarás el email de tu padrino para verificar tu identidad.</p>
        </div>
        <p style="color: #374151; font-size: 14px; margin-top: 20px;">Iniciarás sesión con <strong>{{invitee_email}}</strong> y la contraseña que elijas.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">Si no solicitaste esta cuenta, ignora este email.</p>
      </div>
      <div class="footer"><p>© 2025 TrusTicket. Compra y vende entradas de forma segura.</p></div>
    </div>
  </body>
</html>',
  updated_at = now()
WHERE template_key = 'invitation-accepted';