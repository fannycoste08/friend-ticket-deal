import { Calendar, MapPin, Pencil, Trash2, Search, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MyWantedTicketCardProps {
  ticket: {
    id: string;
    artist: string;
    city: string;
    event_date: string;
    quantity?: number;
    status?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsFound: () => void;
  onMarkAsActive: () => void;
}

export const MyWantedTicketCard = ({ ticket, onEdit, onDelete, onMarkAsFound, onMarkAsActive }: MyWantedTicketCardProps) => {
  const isFound = ticket.status === "found";

  return (
    <div className={`bg-card rounded-2xl border border-dashed border-accent/30 p-5 hover-glow transition-all duration-300 ${isFound ? "opacity-70" : ""}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs border-accent/30 text-accent bg-accent/10">
            <Search className="w-3 h-3 mr-1" />
            BUSCO
          </Badge>
          {isFound && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Encontrada
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold text-foreground tracking-tight">{ticket.artist}</h3>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{ticket.city}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{ticket.quantity ?? 1} {ticket.quantity === 1 ? 'entrada' : 'entradas'}</span>
          </div>
        </div>

        {isFound ? (
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onMarkAsActive} className="flex-1">
              <RotateCcw className="w-3 h-3 mr-1" />
              Volver a buscar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              <Pencil className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={onMarkAsFound} className="flex-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Encontrada
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
