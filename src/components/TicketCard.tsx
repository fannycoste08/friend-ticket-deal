import { Calendar, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
    description?: string;
  };
  currentUserId?: string;
  networkDegree?: number;
  mutualFriends?: Array<{ friend_name: string }>;
  onContact: () => void;
}

export const TicketCard = ({
  ticket,
  currentUserId,
  networkDegree,
  mutualFriends = [],
  onContact,
}: TicketCardProps) => {
  const navigate = useNavigate();
  const isMyTicket = currentUserId === ticket.user_id;

  const getNetworkLabel = () => {
    if (!networkDegree) return null;
    if (networkDegree === 1) return { text: "Amigo", isDirectFriend: true };
    if (networkDegree === 2) {
      if (mutualFriends.length === 0) return { text: "Amigo de amigo", isDirectFriend: false };
      if (mutualFriends.length === 1) return { text: `Amigo de ${mutualFriends[0].friend_name}`, isDirectFriend: false };
      return { text: `Amigo de ${mutualFriends[0].friend_name} y ${mutualFriends.length - 1} más`, isDirectFriend: false };
    }
    return null;
  };

  const networkLabel = getNetworkLabel();

  return (
    <div className="bg-card rounded-xl border border-border/60 p-6 hover-lift group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-1 group-hover:text-primary transition-colors">
            {ticket.artist}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {ticket.venue}, {ticket.city}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{format(new Date(ticket.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-foreground">{ticket.price}€</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${ticket.user_id}`);
          }}
          className="hover:text-primary transition-colors font-medium"
        >
          {ticket.seller_name}
        </button>
        {networkLabel && (
          <Badge
            variant="outline"
            className={
              networkLabel.isDirectFriend
                ? "text-xs border-primary/20 text-primary bg-primary/5"
                : "text-xs border-border text-muted-foreground"
            }
          >
            {networkLabel.text}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {ticket.ticket_type}
        </Badge>
      </div>

      {ticket.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{ticket.description}</p>
      )}

      {isMyTicket ? (
        <Button variant="outline" className="w-full" disabled>
          Tu entrada
        </Button>
      ) : (
        <Button className="w-full" onClick={onContact}>
          Me interesa
        </Button>
      )}
    </div>
  );
};
