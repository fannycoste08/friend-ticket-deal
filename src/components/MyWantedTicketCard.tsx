import { Calendar, MapPin, Pencil, Trash2, Search } from "lucide-react";
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
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const MyWantedTicketCard = ({ ticket, onEdit, onDelete }: MyWantedTicketCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-dashed border-primary/30 p-5 hover-lift">
      <div className="space-y-3">
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          <Search className="w-3 h-3 mr-1" />
          BUSCO
        </Badge>

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
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Pencil className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Borrar
          </Button>
        </div>
      </div>
    </div>
  );
};
