import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketCard } from '@/components/TicketCard';
import { ArrowLeft, UserPlus, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  email: string;
}

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

interface FriendshipStatus {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  friendshipId?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [networkDegree, setNetworkDegree] = useState<number | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && user) {
      loadUserData();
    }
  }, [userId, user]);

  const loadUserData = async () => {
    if (!userId || !user) return;

    setLoading(true);

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load user's tickets
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles!tickets_user_id_fkey(name)
      `)
      .eq('user_id', userId)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    setTickets(ticketsData || []);

    // Get network degree
    const { data: networkData } = await supabase
      .rpc('get_extended_network', { user_uuid: user.id });

    const userNetwork = networkData?.find(n => n.network_user_id === userId);
    setNetworkDegree(userNetwork?.degree || null);

    // Check friendship status
    const { data: friendshipData } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (friendshipData) {
      if (friendshipData.status === 'accepted') {
        setFriendshipStatus({ status: 'accepted', friendshipId: friendshipData.id });
      } else if (friendshipData.user_id === user.id) {
        setFriendshipStatus({ status: 'pending_sent', friendshipId: friendshipData.id });
      } else {
        setFriendshipStatus({ status: 'pending_received', friendshipId: friendshipData.id });
      }
    }

    setLoading(false);
  };

  const handleSendFriendRequest = async () => {
    if (!userId || !user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: userId,
        status: 'pending'
      });

    if (error) {
      toast.error('Error al enviar solicitud de amistad');
      return;
    }

    toast.success('Solicitud de amistad enviada');
    loadUserData();
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus.friendshipId) return;

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipStatus.friendshipId);

    if (error) {
      toast.error('Error al aceptar solicitud');
      return;
    }

    toast.success('Ahora sois amigos');
    loadUserData();
  };

  const handleCancelRequest = async () => {
    if (!friendshipStatus.friendshipId) return;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipStatus.friendshipId);

    if (error) {
      toast.error('Error al cancelar solicitud');
      return;
    }

    toast.success('Solicitud cancelada');
    loadUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  const getNetworkBadge = () => {
    if (isOwnProfile) return null;
    if (friendshipStatus.status === 'accepted' || networkDegree === 1) {
      return <Badge className="bg-primary/10 text-primary border-primary/20">Amigo</Badge>;
    }
    if (networkDegree === 2) {
      return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Amigo de amigo</Badge>;
    }
    return null;
  };

  const getFriendshipButton = () => {
    if (isOwnProfile) return null;

    switch (friendshipStatus.status) {
      case 'accepted':
        return (
          <Button variant="outline" disabled>
            <UserCheck className="w-4 h-4 mr-2" />
            Amigos
          </Button>
        );
      case 'pending_sent':
        return (
          <Button variant="outline" onClick={handleCancelRequest}>
            <Clock className="w-4 h-4 mr-2" />
            Solicitud enviada
          </Button>
        );
      case 'pending_received':
        return (
          <div className="flex gap-2">
            <Button onClick={handleAcceptFriendRequest}>
              <UserCheck className="w-4 h-4 mr-2" />
              Aceptar solicitud
            </Button>
            <Button variant="outline" onClick={handleCancelRequest}>
              Rechazar
            </Button>
          </div>
        );
      default:
        return (
          <Button onClick={handleSendFriendRequest}>
            <UserPlus className="w-4 h-4 mr-2" />
            Añadir como amigo
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
                {getNetworkBadge()}
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            {getFriendshipButton()}
          </div>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Entradas disponibles
          </h2>
        </div>

        {tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Este usuario no tiene entradas disponibles</p>
          </Card>
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
                onContact={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;