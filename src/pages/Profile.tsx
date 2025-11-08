import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { InvitationManager } from '@/components/InvitationManager';
import { FriendshipRequests } from '@/components/FriendshipRequests';
import { MyTicketCard } from '@/components/MyTicketCard';
import TicketForm from '@/components/TicketForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MyTicket {
  id: string;
  artist: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  ticket_type: string;
  status: string;
  quantity: number;
  description: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [editingTicket, setEditingTicket] = useState<MyTicket | undefined>();
  const [profileData, setProfileData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      console.log('👤 [Profile] Current user:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });
      loadProfile();
      loadTickets();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    // Get email from auth user object directly
    setProfileData({
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      email: user.email || ''
    });
  };

  const loadTickets = async () => {
    if (!user) return;

    setLoadingTickets(true);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tickets:', error);
      toast.error('Error al cargar tus entradas');
      setLoadingTickets(false);
      return;
    }

    setTickets(data || []);
    setLoadingTickets(false);
  };

  const handleDeleteTicket = async (id: string) => {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar la entrada');
      console.error(error);
      return;
    }

    toast.success('Entrada eliminada');
    loadTickets();
  };

  const handleMarkAsSold = async (id: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'sold' })
      .eq('id', id);

    if (error) {
      toast.error('Error al marcar como vendida');
      console.error(error);
      return;
    }

    toast.success('Entrada marcada como vendida');
    loadTickets();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user || !profileData) {
    return null;
  }

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
              <h2 className="text-2xl font-bold text-foreground mb-1">{profileData.name}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="flex-1 text-foreground">{profileData.email}</span>
              </div>
            </div>
          </div>
        </Card>

        <FriendshipRequests />

        <InvitationManager userId={user.id} />

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mis entradas</h2>
              <p className="text-sm text-muted-foreground">
                {tickets.filter(t => t.status === 'available').length} en venta
              </p>
            </div>
            <TicketForm onSuccess={loadTickets} />
          </div>

          {loadingTickets ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando tus entradas...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">No tienes entradas publicadas</p>
              <p className="text-sm text-muted-foreground mt-2">¡Publica tu primera entrada!</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tickets.map((ticket) => (
                <MyTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={() => setEditingTicket(ticket)}
                  onDelete={() => handleDeleteTicket(ticket.id)}
                  onMarkAsSold={() => handleMarkAsSold(ticket.id)}
                />
              ))}
            </div>
          )}
        </div>

        {editingTicket && (
          <TicketForm
            editTicket={editingTicket}
            onSuccess={() => {
              loadTickets();
              setEditingTicket(undefined);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
