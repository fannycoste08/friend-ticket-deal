import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TicketCard } from '@/components/TicketCard';
import { MessagingDialog } from '@/components/MessagingDialog';
import TicketForm from '@/components/TicketForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  artist: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  ticket_type: string;
  user_id: string;
  profiles: {
    name: string;
  };
}

const Feed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadTickets();
      subscribeToTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles!tickets_user_id_fkey(name)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tickets:', error);
      toast.error('Error al cargar las entradas');
      setLoadingTickets(false);
      return;
    }

    setTickets(data || []);
    setLoadingTickets(false);
  };

  const subscribeToTickets = () => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Entradas Disponibles
            </h1>
            <p className="text-muted-foreground">Encuentra las mejores entradas</p>
          </div>
          <TicketForm onSuccess={loadTickets} />
        </div>

        {loadingTickets ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando entradas...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay entradas disponibles</p>
            <p className="text-sm text-muted-foreground mt-2">¡Sé el primero en publicar una!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={{
                  ...ticket,
                  seller_name: ticket.profiles.name,
                }}
                currentUserId={user?.id}
                onContact={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <MessagingDialog
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          ticketId={selectedTicket.id}
          sellerId={selectedTicket.user_id}
          sellerName={selectedTicket.profiles.name}
        />
      )}
    </div>
  );
};

export default Feed;
