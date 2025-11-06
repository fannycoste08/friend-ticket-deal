import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const isSold = ticket.status === 'sold';

  return (
    <Card 
      className="p-4 space-y-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-foreground mb-1">{ticket.artist}</h3>
          <p className="text-sm text-muted-foreground mb-1">{ticket.venue}, {ticket.city}</p>
          <p className="text-xs text-muted-foreground mb-2">
            {format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-primary">{ticket.price}€</div>
              <Badge variant="secondary" className="text-xs">
                {ticket.ticket_type}
              </Badge>
            </div>
            {ticket.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
              </p>
            )}
          </div>
        </div>
        
        {isSold && (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Vendida
          </Badge>
        )}
      </div>

      {isSold ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="w-full gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Eliminar
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 gap-1"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAsSold}
            className="flex-1 gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Vendida
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </Card>
  );
};
