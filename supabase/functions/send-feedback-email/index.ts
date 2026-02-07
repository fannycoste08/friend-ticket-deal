import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getEmailTemplate } from '../_shared/email-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "costefanny@gmail.com";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Fallback HTML
function getFallbackHtml(vars: Record<string, string>): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.info-box{background:#f9fafb;padding:15px;border-radius:6px;margin:20px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}</style></head>
<body><div class="container">
<div class="header"><h1 style="margin:0">Nueva opinión de usuario</h1></div>
<div class="content">
<div class="info-box"><p style="margin:0"><strong>Usuario:</strong> ${vars.user_name}</p><p style="margin:5px 0 0 0"><strong>Email:</strong> <a href="mailto:${vars.user_email}">${vars.user_email}</a></p></div>
<div class="info-box"><p style="margin:0"><strong>Opinión:</strong></p><p style="margin:10px 0 0 0;white-space:pre-wrap">${vars.feedback}</p></div>
</div>
<div class="footer"><p>© 2025 TrusTicket — Opinión recibida desde la plataforma.</p></div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado: falta token de autenticación" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado: token inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { feedback } = await req.json();

    if (!feedback || typeof feedback !== "string") {
      return new Response(
        JSON.stringify({ error: "El campo de opinión es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const trimmedFeedback = feedback.trim();

    if (trimmedFeedback.length === 0) {
      return new Response(
        JSON.stringify({ error: "El campo de opinión no puede estar vacío" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (trimmedFeedback.length > 2000) {
      return new Response(
        JSON.stringify({ error: "El mensaje no puede superar los 2000 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    const userName = profile?.name || "Usuario desconocido";
    const userEmail = profile?.email || user.email || "Email no disponible";

    const safeFeedback = escapeHtml(trimmedFeedback);
    const safeName = escapeHtml(userName);
    const safeEmail = escapeHtml(userEmail);

    const templateVars = {
      user_name: safeName,
      user_email: safeEmail,
      feedback: safeFeedback,
    };

    const dbTemplate = await getEmailTemplate('feedback-email', templateVars);

    const subject = dbTemplate?.subject ?? `Opinión de usuario: ${safeName}`;
    const html = dbTemplate?.html ?? getFallbackHtml(templateVars);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrusTicket <info@trusticket.com>",
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error al enviar el email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailData = await emailResponse.json();
    console.log("Feedback email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-feedback-email function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
