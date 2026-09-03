import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_wanted_ticket",
  title: "Publicar búsqueda de entrada",
  description:
    "Publica una búsqueda de entrada para que la red de confianza del usuario sepa qué concierto está buscando.",
  inputSchema: {
    artist: z.string().trim().min(1).max(100).describe("Nombre del artista o grupo que busca."),
    city: z.string().trim().min(1).max(100).describe("Ciudad del concierto."),
    quantity: z.number().int().min(1).max(99).default(1).optional().describe("Número de entradas que busca."),
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Fecha del evento en formato YYYY-MM-DD."),
    email_notifications: z
      .boolean()
      .default(true)
      .optional()
      .describe("Recibir email cuando aparezca una entrada que coincida."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("wanted_tickets")
      .insert({
        user_id: ctx.getUserId(),
        artist: input.artist,
        city: input.city,
        event_date: input.event_date,
        email_notifications: input.email_notifications ?? true,
      })
      .select("id, artist, city, event_date, email_notifications")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Búsqueda publicada: ${JSON.stringify(data)}` }],
      structuredContent: { wanted_ticket: data },
    };
  },
});