import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit, logEmail } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://friend-ticket-deal.lovable.app";
const REDIRECT_URL = `${APP_URL}/create-password`;

interface ReqBody {
  friend_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller
    const token = authHeader.replace("Bearer ", "");
    let caller: { id: string; email?: string } | null = null;
    try {
      const payloadPart = token.split(".")[1];
      if (payloadPart) {
        const padded = payloadPart.padEnd(
          payloadPart.length + ((4 - (payloadPart.length % 4)) % 4),
          "=",
        );
        const decoded = JSON.parse(
          atob(padded.replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (decoded?.sub) caller = { id: decoded.sub, email: decoded.email };
      }
    } catch (_) { /* ignore */ }
    if (!caller) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) caller = { id: data.user.id, email: data.user.email };
    }
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse body
    let body: ReqBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { friend_id } = body;
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!friend_id || typeof friend_id !== "string" || !UUID_RE.test(friend_id)) {
      return new Response(JSON.stringify({ error: "Invalid friend_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify accepted friendship exists between caller and friend
    const { data: friendship, error: friendshipErr } = await supabaseAdmin
      .from("friendships")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(user_id.eq.${caller.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${caller.id})`,
      )
      .maybeSingle();
    if (friendshipErr || !friendship) {
      return new Response(
        JSON.stringify({ error: "No friendship with this user" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Verify the friend has never logged in
    const { data: friendUser, error: friendUserErr } = await supabaseAdmin.auth
      .admin.getUserById(friend_id);
    if (friendUserErr || !friendUser?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (friendUser.user.last_sign_in_at) {
      return new Response(
        JSON.stringify({ error: "User has already activated their account" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
    const inviteeEmail = friendUser.user.email;
    if (!inviteeEmail) {
      return new Response(JSON.stringify({ error: "User has no email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find approved invitation from this inviter to this email
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("inviter_id", caller.id)
      .ilike("invitee_email", inviteeEmail)
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (invErr || !invitation) {
      return new Response(
        JSON.stringify({ error: "No approved invitation found from you to this user" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Rate limit: max 10 emails/hr per caller, 5-min cooldown per recipient
    const rl = await checkRateLimit(
      caller.id,
      inviteeEmail,
      "resend-invitation-accepted",
      supabaseUrl,
      serviceKey,
    );
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: rl.error }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate recovery link
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin
      .generateLink({ type: "recovery", email: inviteeEmail });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkErr);
      return new Response(JSON.stringify({ error: "Failed to generate link" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const url = new URL(linkData.properties.action_link);
    url.searchParams.set("redirect_to", REDIRECT_URL);
    const passwordResetLink = url.toString();

    // Invoke send-invitation-accepted with the caller's auth header
    const { error: sendErr } = await supabaseAdmin.functions.invoke(
      "send-invitation-accepted",
      {
        body: {
          invitation_id: invitation.id,
          password_reset_link: passwordResetLink,
          is_direct_invite: false,
        },
        headers: { Authorization: authHeader },
      },
    );
    if (sendErr) {
      console.error("send-invitation-accepted error:", sendErr);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log for rate-limit tracking
    await logEmail(
      caller.id,
      inviteeEmail,
      "resend-invitation-accepted",
      supabaseUrl,
      serviceKey,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in resend-invitation-accepted:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);