import { Calendar, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface TicketCardProps {
  ticket: {
    id: string;
    artist: string;
    venue: string;
    city: string;
    event_date: string;
    price: number;
    ticket_type: string;
    seller_name: string;
    user_id: string;
  };
  currentUserId?: string;
  networkDegree?: number;
  mutualFriends?: Array<{ friend_name: string }>;
  onContact: () => void;
}

export const TicketCard = ({ ticket, currentUserId, networkDegree, mutualFriends = [], onContact }: TicketCardProps) => {
  const navigate = useNavigate();
  const isMyTicket = currentUserId === ticket.user_id;
  
  const getNetworkLabel = () => {
    if (!networkDegree) return null;
    if (networkDegree === 1) return 'Amigo';
    if (networkDegree === 2) {
      if (mutualFriends.length === 0) return 'Amigo de amigo';
      if (mutualFriends.length === 1) return `Amigo de ${mutualFriends[0].friend_name}`;
      return `Amigo de ${mutualFriends[0].friend_name} y ${mutualFriends.length - 1} más`;
    }
    return null;
  };
  
  const networkLabel = getNetworkLabel();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:-translate-y-1"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground mb-3">{ticket.artist}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{ticket.venue}, {ticket.city}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 text-primary" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/${ticket.user_id}`);
                  }}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {ticket.seller_name}
                </button>
                {networkLabel && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {networkLabel}
                  </Badge>
                )}
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
