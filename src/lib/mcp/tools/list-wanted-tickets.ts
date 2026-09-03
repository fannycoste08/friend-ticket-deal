import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_wanted_tickets",
  title: "Listar entradas buscadas",
  description:
    "Lista las entradas que la red de confianza del usuario está buscando. Útil para saber a quién le puedes ofrecer una entrada.",
  inputSchema: {
    artist: z.string().trim().min(1).optional().describe("Filtro parcial por nombre de artista."),
    city: z.string().trim().min(1).optional().describe("Filtro parcial por ciudad."),
    limit: z.number().int().min(1).max(50).default(20).optional().describe("Número máximo de resultados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ artist, city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("wanted_tickets")
      .select("id, artist, city, event_date, quantity, created_at")
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true })
      .limit(limit ?? 20);
    if (artist) query = query.ilike("artist", `%${artist}%`);
    if (city) query = query.ilike("city", `%${city}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { wanted_tickets: data ?? [] },
    };
  },
});