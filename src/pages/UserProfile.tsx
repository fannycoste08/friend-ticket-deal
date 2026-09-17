import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketCard } from '@/components/TicketCard';
import { WantedTicketCard } from '@/components/WantedTicketCard';
import { ContactDialog } from '@/components/ContactDialog';
import { ArrowLeft, UserPlus, UserCheck, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
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

interface WantedTicket {
  id: string;
  artist: string;
  city: string;
  event_date: string;
  quantity?: number;
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
  const [wantedTickets, setWantedTickets] = useState<WantedTicket[]>([]);
  const [networkDegree, setNetworkDegree] = useState<number | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [mutualFriends, setMutualFriends] = useState<Array<{ friend_id: string; friend_name: string }>>([]);
  const [theirFriends, setTheirFriends] = useState<Array<{ id: string; name: string }>>([]);
  const [myFriendIds, setMyFriendIds] = useState<Set<string>>(new Set());
  const [pendingSentIds, setPendingSentIds] = useState<Set<string>>(new Set());

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
      .select('id, name')
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
      .order('created_at', { ascending: false });

    setTickets(ticketsData || []);

    // Load user's wanted tickets
    const { data: wantedTicketsData } = await supabase
      .from('wanted_tickets')
      .select(`
        *,
        profiles!wanted_tickets_user_id_fkey(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setWantedTickets(wantedTicketsData || []);

    // Load this user's friends (excluding myself, server-side)
    const { data: theirFriendsData } = await supabase
      .rpc('get_user_friends_public', { _target_user_id: userId });
    const mappedFriends = (theirFriendsData || []).map((f: any) => ({ id: f.friend_id, name: f.friend_name }));
    // Filter out users who have never logged in (invited but not activated)
    if (mappedFriends.length > 0) {
      const ids = mappedFriends.map((f) => f.id);
      const { data: activatedRows } = await supabase.rpc('get_activated_user_ids', { _ids: ids });
      const activatedSet = new Set((activatedRows || []).map((r: any) => r.user_id));
      setTheirFriends(mappedFriends.filter((f) => activatedSet.has(f.id)));
    } else {
      setTheirFriends([]);
    }

    // Load my own relationships to know who is already a friend / pending
    const { data: myRelations } = await supabase
      .from('friendships')
      .select('user_id, friend_id, status')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    const accepted = new Set<string>();
    const pending = new Set<string>();
    (myRelations || []).forEach((r) => {
      const other = r.user_id === user.id ? r.friend_id : r.user_id;
      if (r.status === 'accepted') accepted.add(other);
      else if (r.status === 'pending' && r.user_id === user.id) pending.add(other);
    });
    setMyFriendIds(accepted);
    setPendingSentIds(pending);

    // Get network degree
    const { data: networkData } = await supabase
      .rpc('get_extended_network', { user_uuid: user.id });

    const userNetwork = networkData?.find(n => n.network_user_id === userId);
    const degree = userNetwork?.degree || null;
    setNetworkDegree(degree);

    // Get mutual friends if degree 2
    if (degree === 2) {
      const { data: mutualData } = await supabase
        .rpc('get_mutual_friends', { 
          user_a: user.id, 
          user_b: userId 
        });
      
      setMutualFriends(mutualData || []);
    } else {
      setMutualFriends([]);
    }

    // Check friendship status - Use separate queries to avoid SQL injection
    // Check if current user sent a request to this user
    const { data: sentRequest } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user.id)
      .eq('friend_id', userId)
      .maybeSingle();

    // Check if this user sent a request to current user
    const { data: receivedRequest } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', user.id)
      .maybeSingle();

    const friendshipData = sentRequest || receivedRequest;

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
    if (!userId || !user || !profile) return;

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

    // Send notification email using edge function that will look up email securely
    try {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      await supabase.functions.invoke('send-friendship-notification', {
        body: {
          recipient_id: userId,
          recipient_name: profile.name,
          requester_name: currentUserProfile?.name || 'Un usuario',
        },
      });
    } catch (emailError) {
      console.error('Error sending friendship notification email:', emailError);
      // Don't fail the request if email fails
    }

    toast.success('Solicitud de amistad enviada');
    loadUserData();
  };

  const handleSendRequestToFriendOfFriend = async (target: { id: string; name: string }) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: target.id,
      status: 'pending',
    });
    if (error) {
      toast.error('Error al enviar solicitud');
      return;
    }
    setPendingSentIds((prev) => new Set(prev).add(target.id));
    try {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      await supabase.functions.invoke('send-friendship-notification', {
        body: {
          recipient_id: target.id,
          recipient_name: target.name,
          requester_name: currentUserProfile?.name || 'Un usuario',
        },
      });
    } catch (e) {
      console.error('Error sending friendship notification email:', e);
    }
    toast.success('Solicitud de amistad enviada');
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

    // Reset friendship status immediately for better UX
    setFriendshipStatus({ status: 'none' });
    
    toast.success('Solicitud cancelada');
    // Reload data to ensure everything is in sync
    await loadUserData();
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

    // If already friends (either via friendship or invitation network)
    if (friendshipStatus.status === 'accepted' || networkDegree === 1) {
      return (
        <Button variant="outline" disabled className="w-full sm:w-auto">
          <UserCheck className="w-4 h-4 mr-2" />
          Amigos
        </Button>
      );
    }

    switch (friendshipStatus.status) {
      case 'pending_sent':
        return (
          <Button variant="outline" onClick={handleCancelRequest} className="w-full sm:w-auto">
            <Clock className="w-4 h-4 mr-2" />
            Solicitud enviada
          </Button>
        );
      case 'pending_received':
        return (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={handleAcceptFriendRequest} className="w-full sm:w-auto">
              <UserCheck className="w-4 h-4 mr-2" />
              Aceptar solicitud
            </Button>
            <Button variant="outline" onClick={handleCancelRequest} className="w-full sm:w-auto">
              Rechazar
            </Button>
          </div>
        );
      default:
        return (
          <Button onClick={handleSendFriendRequest} className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Añadir como amigo
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-5 px-2 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="mb-6 p-5 sm:mb-8 sm:p-8">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="max-w-full break-words text-2xl font-bold text-foreground sm:text-3xl">{profile.name}</h1>
                {getNetworkBadge()}
              </div>
            </div>
            <div className="w-full shrink-0 sm:w-auto">{getFriendshipButton()}</div>
          </div>
        </Card>

        {theirFriends.length > 0 && (
          <Card className="mb-6 p-4 sm:mb-8 sm:p-6">
            <h2 className="mb-4 break-words text-sm font-medium text-muted-foreground">
              Amigos de {profile.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {theirFriends.map((f) => {
                const alreadyFriend = myFriendIds.has(f.id);
                const requestSent = pendingSentIds.has(f.id);
                return (
                  <div
                    key={f.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 p-3 sm:gap-3"
                  >
                    <button
                      onClick={() => navigate(`/user/${f.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="w-9 h-9 rounded-full gradient-vibrant flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm truncate hover:text-primary">
                        {f.name}
                      </p>
                    </button>
                    {alreadyFriend ? (
                      <span className="max-w-[7rem] shrink-0 text-right text-xs leading-tight text-muted-foreground sm:max-w-none">
                        Ya sois amigos
                      </span>
                    ) : requestSent ? (
                      <Button variant="ghost" size="sm" disabled className="h-auto max-w-[6.5rem] shrink-0 whitespace-normal px-2 py-1 text-right text-xs leading-tight text-muted-foreground sm:max-w-none sm:whitespace-nowrap">
                        Solicitud enviada
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendRequestToFriendOfFriend(f)}
                        className="shrink-0 text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Añadir
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {mutualFriends.length > 0 && (
          <Card className="mb-6 p-4 sm:mb-8 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Amigos en común</h2>
              <Badge variant="secondary">{mutualFriends.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {mutualFriends.map((friend) => (
                <button
                  key={friend.friend_id}
                  onClick={() => navigate(`/user/${friend.friend_id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {friend.friend_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{friend.friend_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Entradas disponibles
          </h2>
        </div>

        {tickets.length === 0 ? (
            <Card className="p-6 text-center sm:p-12">
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
                onContact={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Entradas que Busca
          </h2>
        </div>

        {wantedTickets.length === 0 ? (
            <Card className="p-6 text-center sm:p-12">
            <p className="text-muted-foreground">Este usuario no está buscando entradas</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {wantedTickets.map((ticket) => (
              <WantedTicketCard
                key={ticket.id}
                ticket={{
                  ...ticket,
                  seeker_name: ticket.profiles.name,
                }}
                currentUserId={user?.id}
                onContact={() => {}} 
              />
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <ContactDialog
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          ticket={{
            id: selectedTicket.id,
            artist: selectedTicket.artist,
            seller: selectedTicket.profiles.name,
            seller_id: selectedTicket.user_id,
          }}
        />
      )}
    </div>
  );
};

export default UserProfile;