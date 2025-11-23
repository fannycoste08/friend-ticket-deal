import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, UserMinus, Bell, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InvitationManager } from '@/components/InvitationManager';
import { FriendshipRequests } from '@/components/FriendshipRequests';
import { MyTicketCard } from '@/components/MyTicketCard';
import { MyWantedTicketCard } from '@/components/MyWantedTicketCard';
import TicketForm from '@/components/TicketForm';
import WantedTicketForm from '@/components/WantedTicketForm';
import { useAuth } from '@/hooks/useAuth';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

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

interface MyWantedTicket {
  id: string;
  artist: string;
  city: string;
  event_date: string;
  email_notifications: boolean;
}

interface Friend {
  id: string;
  name: string;
  email: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [wantedTickets, setWantedTickets] = useState<MyWantedTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingWanted, setLoadingWanted] = useState(true);
  const [editingTicket, setEditingTicket] = useState<MyTicket | undefined>();
  const [editingWantedTicket, setEditingWantedTicket] = useState<MyWantedTicket | undefined>();
  const [profileData, setProfileData] = useState<{ name: string; email: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);
  const { emailNotificationsEnabled, toggleEmailNotifications } = useEmailNotifications(user?.id);
  const preferencesRef = useRef<HTMLDivElement>(null);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      loadWantedTickets();
      loadFriends();
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

  const loadWantedTickets = async () => {
    if (!user) return;

    setLoadingWanted(true);
    
    const { data, error } = await supabase
      .from('wanted_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading wanted tickets:', error);
      toast.error('Error al cargar tus búsquedas');
      setLoadingWanted(false);
      return;
    }

    setWantedTickets(data || []);
    setLoadingWanted(false);
  };

  const handleDeleteWantedTicket = async (id: string) => {
    const { error } = await supabase
      .from('wanted_tickets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar la búsqueda');
      console.error(error);
      return;
    }

    toast.success('Búsqueda eliminada');
    loadWantedTickets();
  };

  const loadFriends = async () => {
    if (!user) return;

    setLoadingFriends(true);
    
    // Get friendships where user is involved
    const { data: friendshipsData, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendshipsError) {
      console.error('Error loading friendships:', friendshipsError);
      toast.error('Error al cargar tus amigos');
      setLoadingFriends(false);
      return;
    }

    if (!friendshipsData || friendshipsData.length === 0) {
      setFriends([]);
      setLoadingFriends(false);
      return;
    }

    // Get the friend IDs
    const friendIds = friendshipsData.map((friendship) => {
      return friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
    });

    // Get profiles for those friends
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', friendIds);

    if (profilesError) {
      console.error('Error loading friend profiles:', profilesError);
      toast.error('Error al cargar información de amigos');
      setLoadingFriends(false);
      return;
    }

    setFriends(profilesData || []);
    setLoadingFriends(false);
  };

  const handleDeleteFriend = async () => {
    if (!user || !friendToDelete) return;

    // Delete all friendship records where these two users are involved (bidirectional)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendToDelete.id},friend_id.eq.${friendToDelete.id}`);

    if (error) {
      toast.error('Error al eliminar amigo');
      console.error('Error deleting friend:', error);
      setFriendToDelete(null);
      return;
    }

    // Immediately update UI state
    setFriends((prevFriends) => prevFriends.filter((f) => f.id !== friendToDelete.id));
    toast.success('Amigo eliminado');
    setFriendToDelete(null);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'ELIMINAR') return;

    setIsDeletingAccount(true);

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (error) throw error;

      // Show success message
      toast.success('Tu cuenta ha sido eliminada');

      // Sign out
      await supabase.auth.signOut();

      // Wait 2 seconds before redirect
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error al eliminar la cuenta');
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText('');
    }
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

        <Card className="p-4 sm:p-8 mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 break-words">{profileData.name}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="flex-1 text-foreground break-all text-sm sm:text-base">{profileData.email}</span>
              </div>
            </div>
          </div>
        </Card>

        <FriendshipRequests />

        <InvitationManager userId={user.id} />

        <div className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Mis Amigos</h2>
            <p className="text-sm text-muted-foreground">
              {friends.length} amigos conectados
            </p>
          </div>

          {loadingFriends ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando tus amigos...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">No tienes amigos conectados aún</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {friends.map((friend) => (
                <Card 
                  key={friend.id} 
                  className="p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground break-words">{friend.name}</h3>
                      <p className="text-sm text-muted-foreground break-all">{friend.email}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => navigate(`/user/${friend.id}`)}
                        className="text-primary hover:text-primary/80 p-0 h-auto"
                      >
                        Ver perfil
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFriendToDelete(friend)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

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

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Entradas que Busco</h2>
              <p className="text-sm text-muted-foreground">
                {wantedTickets.length} búsquedas activas
              </p>
            </div>
            <WantedTicketForm onSuccess={loadWantedTickets} />
          </div>

          {loadingWanted ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando tus búsquedas...</p>
            </div>
          ) : wantedTickets.length === 0 ? (
            <div className="text-center py-12 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-muted-foreground">No tienes búsquedas activas</p>
              <p className="text-sm text-muted-foreground mt-2">¡Añade tu primera búsqueda!</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {wantedTickets.map((ticket) => (
                <MyWantedTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={() => setEditingWantedTicket(ticket)}
                  onDelete={() => handleDeleteWantedTicket(ticket.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preferencias de Notificaciones */}
        <div className="mt-6" ref={preferencesRef}>
          <Card className="p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-primary flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Preferencias de Notificaciones</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Te avisaremos cuando aparezcan entradas que buscas
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Label htmlFor="email-notifications" className="text-sm font-medium text-foreground cursor-pointer">
                  Recibir notificaciones por email
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotificationsEnabled}
                  onCheckedChange={toggleEmailNotifications}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Eliminar Cuenta */}
        <div className="mt-6">
          <Card className="p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-destructive flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Eliminar mi cuenta</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Una vez eliminada tu cuenta, no hay vuelta atrás. Toda tu información será borrada permanentemente.
                </p>
              </div>
              <div className="flex items-center flex-shrink-0">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAccountDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Eliminar mi cuenta</span>
                  <span className="sm:hidden">Eliminar</span>
                </Button>
              </div>
            </div>
          </Card>
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

        {editingWantedTicket && (
          <WantedTicketForm
            editTicket={editingWantedTicket}
            onSuccess={() => {
              loadWantedTickets();
              setEditingWantedTicket(undefined);
            }}
          />
        )}
      </div>

      <AlertDialog open={!!friendToDelete} onOpenChange={(open) => !open && setFriendToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este amigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a {friendToDelete?.name} de tu lista de amigos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFriend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Esta acción eliminará permanentemente:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Tu perfil y datos personales</li>
                <li>Todas tus entradas publicadas</li>
                <li>Tus búsquedas guardadas</li>
                <li>Tus conexiones e invitaciones</li>
              </ul>
              <div className="pt-4">
                <Label htmlFor="confirm-delete" className="text-foreground">
                  Escribe <span className="font-bold">ELIMINAR</span> para confirmar
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="mt-2"
                  disabled={isDeletingAccount}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'ELIMINAR' || isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeletingAccount ? 'Eliminando...' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
