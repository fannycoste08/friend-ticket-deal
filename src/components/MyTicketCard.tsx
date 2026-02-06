import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MyTicketCardProps {
  ticket: {
    id: string;
    artist: string;
    venue: string;
    city: string;
    event_date: string;
    price: number;
    ticket_type: string;
    status: string;
    description?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsSold: () => void;
}

export const MyTicketCard = ({ ticket, onEdit, onDelete, onMarkAsSold }: MyTicketCardProps) => {
  const isSold = ticket.status === "sold";

  return (
    <div className="bg-card rounded-xl border border-border/60 p-5 hover-lift">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground tracking-tight">{ticket.artist}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ticket.venue}, {ticket.city}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        {isSold && (
          <Badge variant="secondary" className="text-xs shrink-0">
            Vendida
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold text-foreground">{ticket.price}€</span>
        <Badge variant="secondary" className="text-xs">
          {ticket.ticket_type}
        </Badge>
      </div>

      {ticket.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
      )}

      {isSold ? (
        <Button variant="outline" size="sm" onClick={onDelete} className="w-full">
          <Trash2 className="w-3 h-3 mr-1" />
          Eliminar
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Pencil className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onMarkAsSold} className="flex-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vendida
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
