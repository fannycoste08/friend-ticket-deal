const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const SPREADSHEET_ID = "1bCX2DCK8dBlxhxWHG6ST7QxaYp5kHjj_qoNwE_rTh8g";
// Cada pestaña de la hoja se asigna a una ciudad.
const SHEETS: { range: string; ciudad: string }[] = [
  { range: "2026!A2:D1000", ciudad: "Madrid" },
  { range: "Barcelona 2026-2027!A2:D1000", ciudad: "Barcelona" },
];

type Concierto = { fecha: string; artista: string; sala: string; precio: string; ciudad: string };

// In-memory cache to avoid hitting the Sheets read-per-minute quota (429).
let cache: { data: Concierto[]; at: number } | null = null;
const TTL_MS = 60_000;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (cache && Date.now() - cache.at < TTL_MS) {
    return jsonResponse({ conciertos: cache.data }, 200);
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");

    const ranges = SHEETS.map((s) => `ranges=${s.range}`).join("&");
    const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${ranges}`;

    let data: { valueRanges?: { values?: string[][] }[] } | null = null;
    let lastStatus = 0;
    let lastBody = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
        },
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        data = body as { valueRanges?: { values?: string[][] }[] };
        break;
      }

      lastStatus = response.status;
      lastBody = JSON.stringify(body);

      // Retry only on rate limit / transient server errors
      if (response.status !== 429 && response.status < 500) break;
      await sleep(500 * Math.pow(2, attempt));
    }

    if (!data) {
      throw new Error(`Google Sheets API failed [${lastStatus}]: ${lastBody}`);
    }

    const conciertos: Concierto[] = [];
    (data.valueRanges ?? []).forEach((vr, i) => {
      const ciudad = SHEETS[i]?.ciudad;
      if (!ciudad) return;
      for (const r of vr.values ?? []) {
        if (!r || r.length === 0 || !(r[0] || r[1])) continue;
        conciertos.push({
          fecha: (r[0] ?? "").trim(),
          artista: (r[1] ?? "").trim(),
          sala: (r[2] ?? "").trim(),
          precio: (r[3] ?? "").trim(),
          ciudad,
        });
      }
    });

    cache = { data: conciertos, at: Date.now() };

    return jsonResponse({ conciertos }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-conciertos error:", message);

    // Serve stale cache instead of failing the page
    if (cache) {
      return jsonResponse({ conciertos: cache.data, stale: true }, 200);
    }

    return jsonResponse(
      { error: "Ha ocurrido un error, inténtalo de nuevo", conciertos: [] },
      500,
    );
  }
});
