import { Calendar, MapPin, User, Search, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface WantedTicketCardProps {
  ticket: {
    id: string;
    artist: string;
    city: string;
    event_date: string;
    seeker_name: string;
    user_id: string;
  };
  currentUserId?: string;
  networkDegree?: number;
  mutualFriends?: Array<{ friend_name: string }>;
  onContact: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const WantedTicketCard = ({ ticket, currentUserId, networkDegree, mutualFriends = [], onContact, onEdit, onDelete }: WantedTicketCardProps) => {
  const navigate = useNavigate();
  const isMyTicket = currentUserId === ticket.user_id;
  
  const getNetworkLabel = () => {
    if (!networkDegree) return null;
    if (networkDegree === 1) return { text: 'Amigo', isDirectFriend: true };
    if (networkDegree === 2) {
      if (mutualFriends.length === 0) return { text: 'Amigo de amigo', isDirectFriend: false };
      if (mutualFriends.length === 1) return { text: `Amigo de ${mutualFriends[0].friend_name}`, isDirectFriend: false };
      return { text: `Amigo de ${mutualFriends[0].friend_name} y ${mutualFriends.length - 1} más`, isDirectFriend: false };
    }
    return null;
  };
  
  const networkLabel = getNetworkLabel();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/30 bg-gradient-to-br from-card to-accent/5 hover:-translate-y-1"
      style={{ boxShadow: '0 4px 6px -1px hsl(var(--accent) / 0.1), 0 2px 4px -1px hsl(var(--accent) / 0.06)' }}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-accent text-accent-foreground font-semibold">
                <Search className="w-3 h-3 mr-1" />
                BUSCO
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{ticket.artist}</h3>
            
            <div className="space-y-2 text-sm">
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

          <div className="flex-shrink-0">
            <Search className="w-12 h-12 text-accent/40" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <User className="w-4 h-4 text-accent flex-shrink-0" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${ticket.user_id}`);
            }}
            className="hover:underline hover:text-accent transition-colors"
          >
            {ticket.seeker_name}
          </button>
          {networkLabel && (
            <Badge 
              variant="outline" 
              className={networkLabel.isDirectFriend 
                ? "text-xs bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 dark:border-green-400/20" 
                : "text-xs bg-accent/10 text-accent border-accent/20"
              }
            >
              {networkLabel.text}
            </Badge>
          )}
        </div>

        {isMyTicket ? (
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
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
            onClick={onContact}
          >
            Ofrecerle entrada
          </Button>
        )}
      </div>
    </Card>
  );
};