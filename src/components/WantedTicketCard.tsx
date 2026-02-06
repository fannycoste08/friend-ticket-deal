import { Calendar, MapPin, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

export const WantedTicketCard = ({
  ticket,
  currentUserId,
  networkDegree,
  mutualFriends = [],
  onContact,
  onEdit,
  onDelete,
}: WantedTicketCardProps) => {
  const navigate = useNavigate();
  const isMyTicket = currentUserId === ticket.user_id;

  const getNetworkLabel = () => {
    if (!networkDegree) return null;
    if (networkDegree === 1) return { text: "Amigo", isDirectFriend: true };
    if (networkDegree === 2) {
      if (mutualFriends.length === 0) return { text: "Amigo de amigo", isDirectFriend: false };
      if (mutualFriends.length === 1)
        return { text: `Amigo de ${mutualFriends[0].friend_name}`, isDirectFriend: false };
      return {
        text: `Amigo de ${mutualFriends[0].friend_name} y ${mutualFriends.length - 1} más`,
        isDirectFriend: false,
      };
    }
    return null;
  };

  const networkLabel = getNetworkLabel();

  return (
    <div className="bg-card rounded-xl border border-dashed border-primary/30 p-6 hover-lift group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="text-xs mb-3 border-primary/30 text-primary bg-primary/5">
            <Search className="w-3 h-3 mr-1" />
            BUSCO
          </Badge>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-1 group-hover:text-primary transition-colors">
            {ticket.artist}
          </h3>
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
          {ticket.seeker_name}
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
      </div>

      {isMyTicket ? (
        <div className="flex gap-2">
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
      ) : (
        <Button className="w-full" onClick={onContact}>
          Ofrecerle entrada
        </Button>
      )}
    </div>
  );
};
