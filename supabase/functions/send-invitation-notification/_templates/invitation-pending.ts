export const getInvitationPendingEmail = (
  inviter_name: string,
  invitee_name: string,
  invitee_email: string,
  app_url: string
): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva solicitud de registro - TrusTicket</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header con logo/título -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎫 TrusTicket
              </h1>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: #333333; font-size: 24px; font-weight: bold;">
                ¡Nueva solicitud de registro!
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px;">
                Hola <strong>${inviter_name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px;">
                <strong>${invitee_name}</strong> (<span style="color: #8B5CF6;">${invitee_email}</span>) ha solicitado 
                registrarse en TrusTicket usando tu email como padrino.
              </p>
              
              <!-- Botón de acción -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${app_url}/profile" 
                       style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                      Revisar solicitud en TrusTicket
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 22px;">
                Puedes aprobar o rechazar esta solicitud desde tu perfil en TrusTicket.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #898989; font-size: 14px; line-height: 22px;">
                Saludos,<br>
                El equipo de <strong>TrusTicket</strong>
              </p>
              <p style="margin: 16px 0 0 0; color: #cbd5e0; font-size: 12px;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
