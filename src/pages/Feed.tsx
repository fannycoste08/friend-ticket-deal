import { Calendar, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: number;
  artist: string;
  venue: string;
  date: string;
  price: number;
  seller: string;
  image: string;
}

const mockTickets: Ticket[] = [
  {
    id: 1,
    artist: "Arctic Monkeys",
    venue: "WiZink Center",
    date: "15 Jun 2025",
    price: 85,
    seller: "Carlos M.",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
  },
  {
    id: 2,
    artist: "Taylor Swift",
    venue: "Estadio Santiago Bernabéu",
    date: "22 Jun 2025",
    price: 120,
    seller: "Ana R.",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
  },
  {
    id: 3,
    artist: "Bad Bunny",
    venue: "Palau Sant Jordi",
    date: "3 Jul 2025",
    price: 95,
    seller: "Miguel S.",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80"
  },
  {
    id: 4,
    artist: "Coldplay",
    venue: "Cívitas Metropolitano",
    date: "18 Jul 2025",
    price: 110,
    seller: "Laura G.",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80"
  }
];

const Feed = () => {
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
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={ticket.image} 
                  alt={ticket.artist}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm">
                  {ticket.price}€
                </Badge>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{ticket.artist}</h3>
                  
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
                      <User className="w-4 h-4 text-primary" />
                      <span>Vendido por {ticket.seller}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  Contactar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;
