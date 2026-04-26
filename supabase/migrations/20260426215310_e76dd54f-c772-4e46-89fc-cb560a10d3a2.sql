UPDATE public.email_templates
SET html_content = REPLACE(
  html_content,
  '<a href="{{app_url}}/profile" class="button">Ver solicitud</a>',
  '<a href="{{app_url}}/profile" class="button" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:#ffffff !important;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:600;">Ver solicitud</a>'
)
WHERE template_key = 'friendship-notification';