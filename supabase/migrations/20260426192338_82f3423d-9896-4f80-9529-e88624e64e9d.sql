INSERT INTO public.email_templates (template_key, name, description, subject, html_content, variables)
VALUES (
  'wanted-ticket-offer',
  'Oferta para entrada buscada',
  'Email enviado al usuario que busca una entrada cuando otra persona se la ofrece a través del formulario de contacto.',
  '🎟️ Alguien tiene una entrada para {{artist}} - Trusticket',
  '<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',''Roboto'',sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#F59E0B 0%,#8B5CF6 100%);color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.header h1{margin:0;font-size:22px}.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.info-box{background:#f9fafb;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #8B5CF6}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}a{color:#8B5CF6}</style></head>
<body><div class="container">
<div class="header"><h1>¡Buenas noticias! Tienen una entrada para ti</h1></div>
<div class="content">
<p>Hola <strong>{{seller_name}}</strong>,</p>
<p><strong>{{buyer_name}}</strong> ha visto que estás buscando una entrada para <strong>{{artist}}</strong> y quiere ofrecerte la suya.</p>
<div class="info-box"><p style="margin:0"><strong>Mensaje:</strong></p><p style="margin:10px 0 0 0">{{message}}</p></div>
<div class="info-box"><p style="margin:0"><strong>Datos de contacto de {{buyer_name}}:</strong></p><p style="margin:10px 0 0 0"><strong>Email:</strong> <a href="mailto:{{buyer_email}}">{{buyer_email}}</a><br><strong>Teléfono:</strong> <a href="tel:{{buyer_phone}}">{{buyer_phone}}</a></p></div>
<p>Ponte en contacto directamente con {{buyer_name}} para cerrar los detalles de la entrada.</p>
<p style="margin-top:25px">Recuerda: en Trusticket respetamos los precios originales 💜</p>
</div>
<div class="footer"><p>© 2025 Trusticket. Compra y vende entradas entre amigos.</p></div>
</div></body></html>',
  '["seller_name","buyer_name","buyer_email","buyer_phone","message","artist"]'::jsonb
);