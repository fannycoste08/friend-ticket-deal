import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { getEmailTemplate } from '../_shared/email-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  ticket_id: string;
  artist: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  seller_id: string;
  seller_name: string;
}

// Fallback HTML
function getFallbackHtml(vars: Record<string, string>): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.ticket-details{background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0}.detail-row{display:flex;align-items:center;margin:10px 0}.icon{margin-right:10px}.button{display:inline-block;background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}</style></head>
<body><div class="container">
<div class="header"><h1 style="margin:0">¡Nueva entrada disponible!</h1></div>
<div class="content">
<p>¡Hola <strong>${vars.user_name}</strong>!</p>
<p>Alguien de tu red ha publicado una entrada que buscas:</p>
<div class="ticket-details">
<div class="detail-row"><span class="icon">🎤</span><strong>${vars.artist}</strong></div>
<div class="detail-row"><span class="icon">📍</span>${vars.venue}, ${vars.city}</div>
<div class="detail-row"><span class="icon">📅</span>${vars.event_date}</div>
<div class="detail-row"><span class="icon">💶</span>${vars.price}€</div>
<div class="detail-row"><span class="icon">👤</span>Vendedor: ${vars.seller_name} (${vars.relation_text})</div>
</div>
<div style="text-align:center"><a href="${vars.app_url}/feed" class="button">Ver entrada</a></div>
<p style="color:#6b7280;font-size:14px;margin-top:20px">Entra a TrusTicket para contactar con el vendedor y conseguir tu entrada.</p>
</div>
<div class="footer"><p>© 2025 TrusTicket. Compra y vende entradas de forma segura.</p></div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { ticket_id, artist, venue, city, event_date, price, seller_id, seller_name }: NotifyRequest = await req.json();
    
    if (user.id !== seller_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - you can only send notifications for your own tickets' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const APP_URL = 'https://trusticket.lovable.app';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: networkData, error: networkError } = await supabase.rpc("get_extended_network", {
      user_uuid: seller_id,
    });

    if (networkError) {
      console.error('Error getting network:', networkError);
      return new Response(JSON.stringify({ error: 'Error getting network' }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const networkUserIds = networkData?.map((n: any) => n.network_user_id) || [];

    const { data: matchingWantedTickets, error: wantedError } = await supabase
      .from('wanted_tickets')
      .select('id, user_id, artist, profiles!wanted_tickets_user_id_fkey(name, email)')
      .in('user_id', networkUserIds)
      .eq('email_notifications', true);

    if (wantedError) {
      console.error('Error fetching wanted tickets:', wantedError);
      return new Response(JSON.stringify({ error: 'Error fetching wanted tickets' }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const matches = matchingWantedTickets?.filter((wt: any) => 
      wt.artist.toLowerCase() === artist.toLowerCase()
    ) || [];

    console.log(`Found ${matches.length} matching wanted tickets`);

    const networkMap = new Map(networkData?.map((n: any) => [n.network_user_id, n.degree]) || []);

    const formattedDate = new Date(event_date).toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    const emailPromises = matches.map(async (match: any) => {
      const degree = networkMap.get(match.user_id);
      let relationText = '';

      if (degree === 1) {
        relationText = 'Amigo';
      } else if (degree === 2) {
        const { data: mutualData } = await supabase.rpc("get_mutual_friends", {
          user_a: match.user_id,
          user_b: seller_id,
        });

        if (mutualData && mutualData.length > 0) {
          if (mutualData.length === 1) {
            relationText = `Amigo de ${mutualData[0].friend_name}`;
          } else {
            relationText = `Amigo de ${mutualData[0].friend_name} y ${mutualData.length - 1} más`;
          }
        } else {
          relationText = 'Amigo de amigo';
        }
      }

      const templateVars = {
        user_name: match.profiles.name,
        artist,
        venue,
        city,
        event_date: formattedDate,
        price: String(price),
        seller_name,
        relation_text: relationText,
        app_url: APP_URL,
      };

      const dbTemplate = await getEmailTemplate('wanted-ticket-match', templateVars);

      const subject = dbTemplate?.subject ?? `🎵 Nueva entrada disponible: ${artist}`;
      const html = dbTemplate?.html ?? getFallbackHtml(templateVars);

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TrusTicket <info@trusticket.com>',
          to: [match.profiles.email],
          subject,
          html,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Resend API error:', errorData);
        throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
      }

      const emailData = await emailResponse.json();
      console.log(`Email sent to ${match.profiles.email}:`, emailData);
      return emailData;
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ 
      success: true, 
      notifications_sent: matches.length 
    }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-wanted-ticket-matches function:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
