import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_tickets",
  title: "Listar mis entradas",
  description:
    "Lista las entradas publicadas por el propio usuario, incluyendo su estado (available o sold), y también sus búsquedas activas.",
  inputSchema: {
    status: z
      .enum(["available", "sold", "all"])
      .default("all")
      .optional()
      .describe("Filtrar por estado de la entrada."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);

    let ticketQuery = supabase
      .from("tickets")
      .select("id, artist, venue, city, event_date, price, quantity, ticket_type, status, description")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });
    if (status && status !== "all") ticketQuery = ticketQuery.eq("status", status);

    const [tickets, wanted] = await Promise.all([
      ticketQuery,
      supabase
        .from("wanted_tickets")
        .select("id, artist, city, event_date")
        .eq("user_id", userId)
        .order("event_date", { ascending: true }),
    ]);

    const error = tickets.error ?? wanted.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const payload = { tickets: tickets.data ?? [], wanted_tickets: wanted.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});