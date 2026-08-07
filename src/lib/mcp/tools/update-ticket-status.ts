import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_ticket_status",
  title: "Marcar entrada como vendida o disponible",
  description:
    "Cambia el estado de una entrada propia entre 'available' (en venta) y 'sold' (vendida). Solo afecta a entradas del propio usuario.",
  inputSchema: {
    ticket_id: z.string().uuid().describe("ID de la entrada a actualizar."),
    status: z.enum(["available", "sold"]).describe("Nuevo estado de la entrada."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ ticket_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticket_id)
      .eq("user_id", ctx.getUserId())
      .select("id, artist, status")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No se encontró una entrada propia con ese ID." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Estado actualizado: ${JSON.stringify(data)}` }],
      structuredContent: { ticket: data },
    };
  },
});