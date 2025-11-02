import { useState } from "react";
import { Calendar, MapPin, User, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactDialog } from "@/components/ContactDialog";

interface Ticket {
  id: number;
  artist: string;
  venue: string;
  date: string;
  price: number;
  seller: string;
  isFriend: boolean;
}

const mockTickets: Ticket[] = [
  {
    id: 1,
    artist: "Arctic Monkeys",
    venue: "WiZink Center",
    date: "15 Jun 2025",
    price: 85,
    seller: "Carlos M.",
    isFriend: true
  },
  {
    id: 2,
    artist: "Taylor Swift",
    venue: "Estadio Santiago Bernabéu",
    date: "22 Jun 2025",
    price: 120,
    seller: "Ana R.",
    isFriend: true
  },
  {
    id: 3,
    artist: "Bad Bunny",
    venue: "Palau Sant Jordi",
    date: "3 Jul 2025",
    price: 95,
    seller: "Miguel S.",
    isFriend: false
  },
  {
    id: 4,
    artist: "Coldplay",
    venue: "Cívitas Metropolitano",
    date: "18 Jul 2025",
    price: 110,
    seller: "Laura G.",
    isFriend: true
  }
];

const Feed = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Entradas Disponibles
          </h1>
          <p className="text-muted-foreground">Encuentra las mejores entradas de tus amigos</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {mockTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
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
                        <span>{ticket.venue}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{ticket.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {ticket.isFriend ? (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                        <span>{ticket.seller}</span>
                        {ticket.isFriend && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            Amigo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{ticket.price}€</div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  Contactar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedTicket && (
        <ContactDialog
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
};

export default Feed;
