import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TicketForm } from "@/components/TicketForm";
import { toast } from "sonner";

interface MyTicket {
  id: number;
  artist: string;
  venue: string;
  date: string;
  price: number;
  sold: boolean;
}


const Profile = () => {
  const [tickets, setTickets] = useState<MyTicket[]>([
    {
      id: 1,
      artist: "The Weeknd",
      venue: "WiZink Center",
      date: "20 Jul 2025",
      price: 95,
      sold: false,
    },
    {
      id: 2,
      artist: "Ed Sheeran",
      venue: "Estadio Santiago Bernabéu",
      date: "5 Ago 2025",
      price: 110,
      sold: false,
    },
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MyTicket | undefined>();

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState("juan.perez@email.com");
  const [tempEmail, setTempEmail] = useState(email);

  const handleAddTicket = (data: any) => {
    if (data.id) {
      // Editar
      setTickets(tickets.map(t => 
        t.id === data.id 
          ? { ...t, artist: data.artist, venue: data.venue, date: format(data.date, "d MMM yyyy", { locale: es }), price: parseFloat(data.price) }
          : t
      ));
      toast.success("Entrada actualizada");
    } else {
      // Añadir nueva
      const newTicket: MyTicket = {
        id: Math.max(...tickets.map(t => t.id), 0) + 1,
        artist: data.artist,
        venue: data.venue,
        date: format(data.date, "d MMM yyyy", { locale: es }),
        price: parseFloat(data.price),
        sold: false,
      };
      setTickets([...tickets, newTicket]);
      toast.success("Entrada añadida");
    }
    setEditingTicket(undefined);
  };

  const handleEditTicket = (ticket: MyTicket) => {
    setEditingTicket(ticket);
    setIsFormOpen(true);
  };

  const handleDeleteTicket = (id: number) => {
    setTickets(tickets.filter(t => t.id !== id));
    toast.success("Entrada eliminada");
  };

  const handleMarkAsSold = (id: number) => {
    setTickets(tickets.map(t => 
      t.id === id ? { ...t, sold: true } : t
    ));
    toast.success("Entrada marcada como vendida");
  };


  const handleSaveEmail = () => {
    setEmail(tempEmail);
    setIsEditingEmail(false);
    toast.success("Email actualizado");
  };

  const handleCancelEmail = () => {
    setTempEmail(email);
    setIsEditingEmail(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground">Información de tu cuenta</p>
        </div>

        <Card className="p-8 mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Juan Pérez</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                {isEditingEmail ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveEmail}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEmail}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-foreground">{email}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingEmail(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Mis entradas en venta</h2>
          <Button 
            onClick={() => {
              setEditingTicket(undefined);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Añadir entrada
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="p-6 space-y-4"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{ticket.artist}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{ticket.venue}</p>
                  <p className="text-sm text-muted-foreground mb-2">{ticket.date}</p>
                  <div className="text-2xl font-bold text-primary">{ticket.price}€</div>
                </div>
                
                {ticket.sold && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Vendida
                  </Badge>
                )}
              </div>

              {!ticket.sold && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTicket(ticket)}
                    className="flex-1 gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsSold(ticket.id)}
                    className="flex-1 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Vendida
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        <TicketForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          ticket={editingTicket}
          onSubmit={handleAddTicket}
        />
      </div>
    </div>
  );
};

export default Profile;
