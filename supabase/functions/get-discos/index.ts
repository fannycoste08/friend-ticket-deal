const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const SPREADSHEET_ID = "14A0DFrTEFb5kUfx1pI0sRzTDZoR_MsDnuGt6crWn5YI";
const RANGE = "Discos!A2:J2000";

type Disco = { fecha: string; artista: string; disco: string; sello: string; formato: string; portada?: string | null };

// Carátulas: caché larga (12 h) por artista+disco
const portadas = new Map<string, { url: string | null; at: number }>();
const PORTADA_TTL = 12 * 60 * 60 * 1000;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

async function buscarPortada(artista: string, disco: string): Promise<string | null> {
  if (!artista || !disco) return null;
  const key = `${norm(artista)}|${norm(disco)}`;
  const hit = portadas.get(key);
  if (hit && Date.now() - hit.at < PORTADA_TTL) return hit.url;
  let url: string | null = null;
  try {
    const q = encodeURIComponent(`${artista} ${disco}`);
    const r = await fetch(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10&country=ES`);
    if (r.ok) {
      const j = await r.json();
      const na = norm(artista), nd = norm(disco);
      const res = (j.results ?? []) as { artistName?: string; collectionName?: string; artworkUrl100?: string }[];
      const match = res.find((x) => {
        const xa = norm(x.artistName ?? ""), xd = norm(x.collectionName ?? "");
        return (xa.includes(na) || na.includes(xa)) && (xd.includes(nd) || nd.includes(xd)) && xa && xd;
      });
      if (match?.artworkUrl100) url = match.artworkUrl100.replace("100x100bb", "300x300bb");
    }
  } catch (e) {
    console.error("portada error:", e instanceof Error ? e.message : e);
  }
  portadas.set(key, { url, at: Date.now() });
  return url;
}

let cache: { data: Disco[]; at: number } | null = null;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (cache && Date.now() - cache.at < TTL_MS) {
    return jsonResponse({ discos: cache.data }, 200);
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");

    const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}`;
    let data: { values?: string[][] } | null = null;
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
        data = body as { values?: string[][] };
        break;
      }
      lastStatus = response.status;
      lastBody = JSON.stringify(body);
      if (response.status !== 429 && response.status < 500) break;
      await sleep(500 * Math.pow(2, attempt));
    }

    if (!data) throw new Error(`Google Sheets API failed [${lastStatus}]: ${lastBody}`);

    const discos: Disco[] = [];
    for (const r of data.values ?? []) {
      if (!r) continue;
      const estado = (r[9] ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (estado !== "si") continue;
      if (!(r[0] || r[1] || r[2])) continue;
      discos.push({
        fecha: (r[0] ?? "").trim(),
        artista: (r[1] ?? "").trim(),
        disco: (r[2] ?? "").trim(),
        sello: (r[3] ?? "").trim(),
        formato: (r[4] ?? "").trim(),
      });
    }

    await Promise.all(discos.map(async (d) => { d.portada = await buscarPortada(d.artista, d.disco); }));

    cache = { data: discos, at: Date.now() };
    return jsonResponse({ discos }, 200);
  } catch (error: unknown) {
    console.error("get-discos error:", error instanceof Error ? error.message : error);
    if (cache) return jsonResponse({ discos: cache.data, stale: true }, 200);
    return jsonResponse({ error: "Ha ocurrido un error, inténtalo de nuevo", discos: [] }, 500);
  }
});
