import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, UserMinus, Bell, Trash2, User, Users, Ticket, Search, Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvitationManager, InviteFriendButton } from "@/components/InvitationManager";
import { FriendshipRequests } from "@/components/FriendshipRequests";
import { MyTicketCard } from "@/components/MyTicketCard";
import { MyWantedTicketCard } from "@/components/MyWantedTicketCard";
import TicketForm from "@/components/TicketForm";
import WantedTicketForm from "@/components/WantedTicketForm";
import { useAuth } from "@/hooks/useAuth";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

interface Suggestion {
  id: string;
  name: string;
  mutualFriendName: string;
}

type Section = "friends" | "invitations" | "tickets" | "settings";
type TicketsTab = "selling" | "wanted";

const menuItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "friends", label: "Mis Amigos", icon: Users },
  { id: "invitations", label: "Invitaciones", icon: Mail },
  { id: "tickets", label: "Mis entradas", icon: Ticket },
  { id: "settings", label: "Ajustes", icon: Settings },
];

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<Section>("friends");
  const [ticketsTab, setTicketsTab] = useState<TicketsTab>("selling");
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sentSuggestionIds, setSentSuggestionIds] = useState<Set<string>>(new Set());
  const { emailNotificationsEnabled, toggleEmailNotifications } = useEmailNotifications(user?.id);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTickets();
      loadWantedTickets();
      loadFriends();
      loadPendingInvitations();
      loadPendingFriendRequests();
    }
  }, [user]);

  // Keep pending friend-request count in sync with realtime changes,
  // so the sidebar badge updates even when the Friends section is not active.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("profile-friendship-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          loadPendingFriendRequests();
          loadFriends();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (window.location.hash === "#invitations") {
      setActiveSection("invitations");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    setProfileData({
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      email: user.email || "",
    });
  };

  const loadTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading tickets:", error);
      toast.error("Error al cargar tus entradas");
    }
    setTickets(data || []);
    setLoadingTickets(false);
  };

  const loadPendingInvitations = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("inviter_id", user.id)
      .eq("status", "pending");
    setPendingInvitationsCount(count || 0);
  };

  const loadPendingFriendRequests = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("friend_id", user.id)
      .eq("status", "pending");
    setPendingFriendRequestsCount(count || 0);
  };

  const handleDeleteTicket = async (id: string) => {
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar la entrada");
      return;
    }
    toast.success("Entrada eliminada");
    loadTickets();
  };

  const handleMarkAsSold = async (id: string) => {
    const { error } = await supabase.from("tickets").update({ status: "sold" }).eq("id", id);
    if (error) {
      toast.error("Error al marcar como vendida");
      return;
    }
    toast.success("Entrada marcada como vendida");
    loadTickets();
  };

  const loadWantedTickets = async () => {
    if (!user) return;
    setLoadingWanted(true);
    const { data, error } = await supabase
      .from("wanted_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading wanted tickets:", error);
      toast.error("Error al cargar tus búsquedas");
    }
    setWantedTickets(data || []);
    setLoadingWanted(false);
  };

  const handleDeleteWantedTicket = async (id: string) => {
    const { error } = await supabase.from("wanted_tickets").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar la búsqueda");
      return;
    }
    toast.success("Búsqueda eliminada");
    loadWantedTickets();
  };

  const loadFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    const { data: friendshipsData, error: friendshipsError } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    if (friendshipsError) {
      console.error("Error loading friendships:", friendshipsError);
      setLoadingFriends(false);
      return;
    }
    if (!friendshipsData || friendshipsData.length === 0) {
      setFriends([]);
      setLoadingFriends(false);
      return;
    }
    const friendIds = friendshipsData.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
    const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", friendIds);
    setFriends(profilesData || []);
    setLoadingFriends(false);
    loadSuggestions();
  };

  const loadSuggestions = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_friend_suggestions", { _user_id: user.id });
    if (error) {
      console.error("Error loading suggestions:", error);
      return;
    }
    const mapped: Suggestion[] = (data || []).map((s: any) => ({
      id: s.suggestion_id,
      name: s.suggestion_name,
      mutualFriendName: s.mutual_friend_name,
    }));
    setSuggestions(mapped);

    // Exclude users to whom we already have a pending/accepted relationship
    if (mapped.length > 0) {
      const ids = mapped.map((m) => m.id);
      const { data: existing } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      if (existing) {
        const already = new Set<string>();
        existing.forEach((f) => {
          const other = f.user_id === user.id ? f.friend_id : f.user_id;
          if (ids.includes(other)) already.add(other);
        });
        if (already.size > 0) {
          setSentSuggestionIds((prev) => {
            const next = new Set(prev);
            already.forEach((id) => next.add(id));
            return next;
          });
        }
      }
    }
  };

  const handleSendSuggestionRequest = async (suggestion: Suggestion) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: suggestion.id,
      status: "pending",
    });
    if (error) {
      toast.error("Error al enviar solicitud");
      return;
    }
    setSentSuggestionIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      await supabase.functions.invoke("send-friendship-notification", {
        body: {
          recipient_id: suggestion.id,
          recipient_name: suggestion.name,
          requester_name: currentUserProfile?.name || "Un usuario",
        },
      });
    } catch (e) {
      console.error("Error sending friendship notification email:", e);
    }
    toast.success("Solicitud de amistad enviada");
  };

  const handleDeleteFriend = async () => {
    if (!user || !friendToDelete) return;
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .or(`user_id.eq.${friendToDelete.id},friend_id.eq.${friendToDelete.id}`);
    if (error) {
      toast.error("Error al eliminar amigo");
      setFriendToDelete(null);
      return;
    }
    setFriends((prev) => prev.filter((f) => f.id !== friendToDelete.id));
    toast.success("Amigo eliminado");
    setFriendToDelete(null);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "ELIMINAR") return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user", { body: { userId: user.id } });
      if (error) throw error;
      toast.success("Tu cuenta ha sido eliminada");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error al eliminar la cuenta");
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText("");
    }
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user || !profileData) return null;

  const availableTicketsCount = tickets.filter((t) => t.status === "available").length;

  // --- Section renderers ---

  const renderProfile = () => (
    <div className="space-y-8 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">Información de tu cuenta</p>
      </div>
      <div className="bg-card rounded-2xl border border-border/40 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full gradient-vibrant flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{profileData.name.charAt(0).toUpperCase()}</span>
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
    </div>
  );

  const renderFriends = () => (
    <InvitationManager userId={user.id} onPendingChange={setPendingInvitationsCount}>
      <div className="space-y-6 fade-in-up">
        <div className="flex items-center justify-between gap-4">
          <h2 className="hidden md:block text-2xl font-bold text-foreground tracking-tight">Mis amigos</h2>
          <div className="ml-auto">
            <InviteFriendButton />
          </div>
        </div>
        {loadingFriends ? (
              <p className="text-sm text-muted-foreground text-center py-12">Cargando tus amigos...</p>
            ) : friends.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tienes amigos conectados aún</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 w-full">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-card rounded-2xl border border-border/40 p-4 hover-glow transition-all duration-300 w-full overflow-hidden"
                  >
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <div className="w-9 h-9 rounded-full gradient-vibrant flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">{friend.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <h3 className="flex-1 min-w-0 font-medium text-foreground text-sm truncate">
                        {friend.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/user/${friend.id}`)}
                        className="shrink-0 px-2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        Ver perfil
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFriendToDelete(friend)}
                        className="shrink-0 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
        )}
        {suggestions.length > 0 && (
          <div className="pt-4 border-t border-border/40 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Personas que quizás conoces</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 w-full">
              {suggestions.map((s) => {
                const sent = sentSuggestionIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="bg-card rounded-2xl border border-border/40 p-4 hover-glow transition-all duration-300 w-full overflow-hidden"
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <div className="w-9 h-9 rounded-full gradient-vibrant flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Amigo/a de {s.mutualFriendName}
                        </p>
                      </div>
                      {sent ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          Solicitud enviada
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendSuggestionRequest(s)}
                          className="shrink-0 text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Añadir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </InvitationManager>
  );

  const renderInvitations = () => (
    <div className="space-y-6 fade-in-up">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Invitaciones</h2>
      </div>
      <InvitationManager
        userId={user.id}
        onPendingChange={setPendingInvitationsCount}
        pendingHeader={
          <FriendshipRequests embedded onCountChange={setPendingFriendRequestsCount} />
        }
      />
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="hidden md:block text-2xl font-bold text-foreground tracking-tight">Mis entradas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ticketsTab === "selling"
              ? `${availableTicketsCount} en venta`
              : `${wantedTickets.length} búsquedas activas`}
          </p>
        </div>
        {ticketsTab === "selling" ? (
          <TicketForm onSuccess={loadTickets} />
        ) : (
          <WantedTicketForm onSuccess={loadWantedTickets} />
        )}
      </div>
      <Tabs value={ticketsTab} onValueChange={(v) => setTicketsTab(v as TicketsTab)}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="selling">En venta</TabsTrigger>
          <TabsTrigger value="wanted">Buscando</TabsTrigger>
        </TabsList>
        <TabsContent value="selling" className="mt-6">
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
        </TabsContent>
        <TabsContent value="wanted" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 fade-in-up">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Ajustes</h2>
        <p className="text-sm text-muted-foreground mt-1">Preferencias y configuración</p>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border/40 p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Preferencias de notificaciones</h3>
            <p className="text-sm text-muted-foreground">Te avisaremos cuando aparezcan entradas que buscas</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="email-notifications" className="text-sm text-foreground">
              Recibir notificaciones por email
            </Label>
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
      case "friends":
        return renderFriends();
      case "invitations":
        return renderInvitations();
      case "tickets":
        return renderTickets();
      case "settings":
        return renderSettings();
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
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.id === "invitations" && pendingInvitationsCount + pendingFriendRequestsCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center"
              >
                {pendingInvitationsCount + pendingFriendRequestsCount}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-[100vw]">
      {/* Mobile sticky tab bar */}
      {isMobile && (
        <div className="sticky top-16 z-40 glass-strong border-b border-border/40">
          <div
            className="flex items-center gap-1 px-4 py-2 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              const showBadge =
                item.id === "invitations" &&
                pendingInvitationsCount + pendingFriendRequestsCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "relative shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center border-0"
                    >
                      {pendingInvitationsCount + pendingFriendRequestsCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 min-w-0">
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
          <main className="flex-1 min-w-0 w-full">{renderSection()}</main>
        </div>
      </div>

      {/* Edit dialogs */}
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
            <AlertDialogAction
              onClick={handleDeleteFriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
              disabled={deleteConfirmText !== "ELIMINAR" || isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeletingAccount ? "Eliminando..." : "Eliminar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
