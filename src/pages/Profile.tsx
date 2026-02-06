import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, UserMinus, Bell, Trash2, User, Users, Ticket, Search, Settings, Menu, X } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
}

type Section = 'profile' | 'friends' | 'invitations' | 'tickets' | 'wanted' | 'settings';

const menuItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'friends', label: 'Mis Amigos', icon: Users },
  { id: 'invitations', label: 'Invitaciones', icon: Mail },
  { id: 'tickets', label: 'Mis Entradas', icon: Ticket },
  { id: 'wanted', label: 'Entradas que Busco', icon: Search },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) { loadProfile(); loadTickets(); loadWantedTickets(); loadFriends(); }
  }, [user]);

  useEffect(() => {
    if (window.location.hash === '#invitations') {
      setActiveSection('invitations');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    setProfileData({
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      email: user.email || '',
    });
  };

  const loadTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data, error } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error loading tickets:', error); toast.error('Error al cargar tus entradas'); }
    setTickets(data || []);
    setLoadingTickets(false);
  };

  const handleDeleteTicket = async (id: string) => {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar la entrada'); return; }
    toast.success('Entrada eliminada');
    loadTickets();
  };

  const handleMarkAsSold = async (id: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'sold' }).eq('id', id);
    if (error) { toast.error('Error al marcar como vendida'); return; }
    toast.success('Entrada marcada como vendida');
    loadTickets();
  };

  const loadWantedTickets = async () => {
    if (!user) return;
    setLoadingWanted(true);
    const { data, error } = await supabase.from('wanted_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error loading wanted tickets:', error); toast.error('Error al cargar tus búsquedas'); }
    setWantedTickets(data || []);
    setLoadingWanted(false);
  };

  const handleDeleteWantedTicket = async (id: string) => {
    const { error } = await supabase.from('wanted_tickets').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar la búsqueda'); return; }
    toast.success('Búsqueda eliminada');
    loadWantedTickets();
  };

  const loadFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    const { data: friendshipsData, error: friendshipsError } = await supabase
      .from('friendships').select('user_id, friend_id').eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    if (friendshipsError) { console.error('Error loading friendships:', friendshipsError); setLoadingFriends(false); return; }
    if (!friendshipsData || friendshipsData.length === 0) { setFriends([]); setLoadingFriends(false); return; }
    const friendIds = friendshipsData.map((f) => f.user_id === user.id ? f.friend_id : f.user_id);
    const { data: profilesData } = await supabase.from('profiles').select('id, name').in('id', friendIds);
    setFriends(profilesData || []);
    setLoadingFriends(false);
  };

  const handleDeleteFriend = async () => {
    if (!user || !friendToDelete) return;
    const { error } = await supabase.from('friendships').delete()
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendToDelete.id},friend_id.eq.${friendToDelete.id}`);
    if (error) { toast.error('Error al eliminar amigo'); setFriendToDelete(null); return; }
    setFriends((prev) => prev.filter((f) => f.id !== friendToDelete.id));
    toast.success('Amigo eliminado');
    setFriendToDelete(null);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'ELIMINAR') return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId: user.id } });
      if (error) throw error;
      toast.success('Tu cuenta ha sido eliminada');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error al eliminar la cuenta');
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText('');
    }
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    if (isMobile) setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user || !profileData) return null;

  const availableTicketsCount = tickets.filter((t) => t.status === 'available').length;

  // --- Section renderers ---

  const renderProfile = () => (
    <div className="space-y-8 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">Información de tu cuenta</p>
      </div>
      <div className="bg-card rounded-2xl border border-border/40 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full gradient-vibrant flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {profileData.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{profileData.name}</h3>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-border/40">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{friends.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Amigos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{availableTicketsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">En venta</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{wantedTickets.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Buscando</p>
          </div>
        </div>
      </div>
      <FriendshipRequests />
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mis Amigos</h2>
        <p className="text-sm text-muted-foreground mt-1">{friends.length} amigos conectados</p>
      </div>
      {loadingFriends ? (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando tus amigos...</p>
      ) : friends.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tienes amigos conectados aún</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {friends.map((friend) => (
            <div key={friend.id} className="bg-card rounded-2xl border border-border/40 p-4 hover-glow transition-all duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full gradient-vibrant flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {friend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground truncate text-sm">{friend.name}</h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/user/${friend.id}`)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Ver perfil
                   </Button>
                   <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFriendToDelete(friend)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <UserMinus className="w-3.5 h-3.5 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvitations = () => (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Invitaciones</h2>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tus invitaciones</p>
      </div>
      <InvitationManager userId={user.id} />
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Mis Entradas</h2>
          <p className="text-sm text-muted-foreground mt-1">{availableTicketsCount} en venta</p>
        </div>
        <TicketForm onSuccess={loadTickets} />
      </div>
      {loadingTickets ? (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando tus entradas...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <Ticket className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tienes entradas publicadas</p>
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
  );

  const renderWanted = () => (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Entradas que Busco</h2>
          <p className="text-sm text-muted-foreground mt-1">{wantedTickets.length} búsquedas activas</p>
        </div>
        <WantedTicketForm onSuccess={loadWantedTickets} />
      </div>
      {loadingWanted ? (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando tus búsquedas...</p>
      ) : wantedTickets.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tienes búsquedas activas</p>
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
  );

  const renderSettings = () => (
    <div className="space-y-8 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Ajustes</h2>
        <p className="text-sm text-muted-foreground mt-1">Preferencias y configuración</p>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border/40 p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Preferencias de Notificaciones</h3>
            <p className="text-sm text-muted-foreground">
              Te avisaremos cuando aparezcan entradas que buscas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="email-notifications" className="text-sm text-foreground">Recibir notificaciones por email</Label>
            <Switch
              id="email-notifications"
              checked={emailNotificationsEnabled}
              onCheckedChange={toggleEmailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-card rounded-2xl border border-destructive/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Eliminar mi cuenta</h3>
            <p className="text-sm text-muted-foreground">
              Una vez eliminada tu cuenta, no hay vuelta atrás. Toda tu información será borrada permanentemente.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteAccountDialog(true)}
            className="text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar mi cuenta
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile': return renderProfile();
      case 'friends': return renderFriends();
      case 'invitations': return renderInvitations();
      case 'tickets': return renderTickets();
      case 'wanted': return renderWanted();
      case 'settings': return renderSettings();
    }
  };

  const sidebarContent = (
    <nav className="space-y-0.5">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.id === 'friends' && friends.length > 0 && (
              <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                {friends.length}
              </Badge>
            )}
            {item.id === 'tickets' && availableTicketsCount > 0 && (
              <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                {availableTicketsCount}
              </Badge>
            )}
            {item.id === 'wanted' && wantedTickets.length > 0 && (
              <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                {wantedTickets.length}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {menuItems.find((i) => i.id === activeSection)?.label}
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Mobile menu */}
        {isMobile && mobileMenuOpen && (
          <div className="mb-4 bg-card rounded-2xl border border-border/40 p-3 fade-in-up">
            {sidebarContent}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          {!isMobile && (
            <aside className="w-52 shrink-0">
              <div className="sticky top-24">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-vibrant flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">
                        {profileData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{profileData.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{profileData.email}</p>
                    </div>
                  </div>
                </div>
                {sidebarContent}
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">{renderSection()}</main>
        </div>
      </div>

      {/* Edit dialogs */}
      {editingTicket && (
        <TicketForm editTicket={editingTicket} onSuccess={() => { loadTickets(); setEditingTicket(undefined); }} />
      )}
      {editingWantedTicket && (
        <WantedTicketForm editTicket={editingWantedTicket} onSuccess={() => { loadWantedTickets(); setEditingWantedTicket(undefined); }} />
      )}

      {/* Delete friend dialog */}
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

      {/* Delete account dialog */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
