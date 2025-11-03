import { Calendar, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketCardProps {
  ticket: {
    id: string;
    concert_name: string;
    artist: string;
    venue: string;
    event_date: string;
    price: number;
    ticket_type: string;
    seller_name: string;
    user_id: string;
  };
  currentUserId?: string;
  onContact: () => void;
}

export const TicketCard = ({ ticket, currentUserId, onContact }: TicketCardProps) => {
  const isMyTicket = currentUserId === ticket.user_id;
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:-translate-y-1"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground mb-1">{ticket.artist}</h3>
            <p className="text-sm text-muted-foreground mb-3">{ticket.concert_name}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{ticket.venue}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(new Date(ticket.event_date), "d MMM yyyy 'a las' HH:mm", { locale: es })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 text-primary" />
                <span>{ticket.seller_name}</span>
              </div>

              <Badge variant="secondary" className="text-xs">
                {ticket.ticket_type}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{ticket.price}€</div>
          </div>
        </div>

        {isMyTicket ? (
          <Button 
            className="w-full"
            variant="outline"
            disabled
          >
            Tu entrada
          </Button>
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            onClick={onContact}
          >
            Me interesa
          </Button>
        )}
      </div>
    </Card>
  );
};
