import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_ticket",
  title: "Publicar entrada a la venta",
  description:
    "Publica una entrada de concierto a la venta en la red de confianza del usuario. El precio debe respetar el precio original (Trusticket no permite especulación).",
  inputSchema: {
    artist: z.string().trim().min(1).max(100).describe("Nombre del artista o grupo."),
    venue: z.string().trim().min(1).max(150).describe("Sala o recinto del concierto."),
    city: z.string().trim().min(1).max(100).describe("Ciudad del concierto."),
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Fecha del evento en formato YYYY-MM-DD."),
    price: z.number().nonnegative().describe("Precio por entrada en euros."),
    quantity: z.number().int().min(1).max(20).default(1).optional().describe("Número de entradas disponibles."),
    ticket_type: z.string().trim().min(1).max(60).describe("Tipo de entrada (p. ej. General, Pista, Grada)."),
    description: z.string().trim().max(100).optional().describe("Nota opcional, máximo 100 caracteres."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: ctx.getUserId(),
        artist: input.artist,
        venue: input.venue,
        city: input.city,
        event_date: input.event_date,
        price: input.price,
        quantity: input.quantity ?? 1,
        ticket_type: input.ticket_type,
        description: input.description ?? null,
        status: "available",
      })
      .select("id, artist, venue, city, event_date, price, quantity, ticket_type, status")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Entrada publicada: ${JSON.stringify(data)}` }],
      structuredContent: { ticket: data },
    };
  },
});