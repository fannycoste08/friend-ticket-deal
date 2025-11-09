import { Calendar, MapPin, Pencil, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    <Card 
      className="overflow-hidden border-accent/30 bg-gradient-to-br from-card to-accent/5"
      style={{ boxShadow: '0 4px 6px -1px hsl(var(--accent) / 0.1), 0 2px 4px -1px hsl(var(--accent) / 0.06)' }}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-accent text-accent-foreground font-semibold text-xs">
                <Search className="w-3 h-3 mr-1" />
                BUSCO
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{ticket.artist}</h3>
            
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{ticket.city}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 border-accent/20 hover:bg-accent/10 hover:text-accent"
          >
            <Pencil className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Borrar
          </Button>
        </div>
      </div>
    </Card>
  );
};