import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_wanted_ticket_status",
  title: "Marcar búsqueda como encontrada o activa",
  description:
    "Cambia el estado de una búsqueda propia entre 'active' (buscando) y 'found' (encontrada). Solo afecta a búsquedas del propio usuario.",
  inputSchema: {
    wanted_ticket_id: z.string().uuid().describe("ID de la búsqueda a actualizar."),
    status: z.enum(["active", "found"]).describe("Nuevo estado de la búsqueda."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ wanted_ticket_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("wanted_tickets")
      .update({ status })
      .eq("id", wanted_ticket_id)
      .eq("user_id", ctx.getUserId())
      .select("id, artist, status")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No se encontró una búsqueda propia con ese ID." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Estado actualizado: ${JSON.stringify(data)}` }],
      structuredContent: { wanted_ticket: data },
    };
  },
});
