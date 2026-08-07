import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFeedTickets from "./tools/list-feed-tickets";
import listWantedTickets from "./tools/list-wanted-tickets";
import listMyTickets from "./tools/list-my-tickets";
import createTicket from "./tools/create-ticket";
import createWantedTicket from "./tools/create-wanted-ticket";
import updateTicketStatus from "./tools/update-ticket-status";

// Must be the direct Supabase issuer host, built from the project ref literal.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "trusticket",
  title: "Trusticket",
  version: "0.1.0",
  instructions:
    "Herramientas de Trusticket, la red de confianza para comprar y vender entradas de conciertos entre amigos. " +
    "Usa `list_feed_tickets` para ver entradas a la venta en la red del usuario, `list_wanted_tickets` para ver qué busca su red, " +
    "`list_my_tickets` para sus propias entradas y búsquedas, `create_ticket` y `create_wanted_ticket` para publicar, " +
    "y `update_ticket_status` para marcar una entrada como vendida o volver a ponerla en venta. " +
    "El contacto entre usuarios es siempre por email dentro de la aplicación; no existe mensajería interna.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listFeedTickets,
    listWantedTickets,
    listMyTickets,
    createTicket,
    createWantedTicket,
    updateTicketStatus,
  ],
});