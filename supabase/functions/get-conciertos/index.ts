import { corsHeaders } from "@supabase/supabase-js/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const SPREADSHEET_ID = "1bCX2DCK8dBlxhxWHG6ST7QxaYp5kHjj_qoNwE_rTh8g";
const RANGE = "2026!A2:D1000";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");

    const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Sheets API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    const rows = (data.values ?? []) as string[][];
    const conciertos = rows
      .filter((r) => r && r.length > 0 && (r[0] || r[1]))
      .map((r) => ({
        fecha: (r[0] ?? "").trim(),
        artista: (r[1] ?? "").trim(),
        sala: (r[2] ?? "").trim(),
        precio: (r[3] ?? "").trim(),
      }));

    return new Response(JSON.stringify({ conciertos }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-conciertos error:", message);
    return new Response(JSON.stringify({ error: message, conciertos: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});