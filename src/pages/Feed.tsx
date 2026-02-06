import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { TicketCard } from "@/components/TicketCard";
import { WantedTicketCard } from "@/components/WantedTicketCard";
import { ContactDialog } from "@/components/ContactDialog";
import TicketForm from "@/components/TicketForm";
import WantedTicketForm from "@/components/WantedTicketForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Ticket {
  id: string;
  artist: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  ticket_type: string;
  user_id: string;
  networkDegree?: number;
  mutualFriends?: Array<{ friend_name: string }>;
  profiles: { name: string } | null;
}

interface WantedTicket {
  id: string;
  artist: string;
  city: string;
  event_date: string;
  user_id: string;
  networkDegree?: number;
  mutualFriends?: Array<{ friend_name: string }>;
  profiles: { name: string } | null;
}

const Feed = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [wantedTickets, setWantedTickets] = useState<WantedTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingWanted, setLoadingWanted] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedWantedTicket, setSelectedWantedTicket] = useState<WantedTicket | null>(null);
  const [userWantedTickets, setUserWantedTickets] = useState<string[]>([]);
  const [editingWantedTicket, setEditingWantedTicket] = useState<WantedTicket | null>(null);
  const [wantedTicketToDelete, setWantedTicketToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadTickets();
      loadWantedTickets();
      loadUserWantedArtists();
      subscribeToTickets();
      subscribeToWantedTickets();
    }
  }, [user]);

  const loadUserWantedArtists = async () => {
    const { data } = await supabase.from("wanted_tickets").select("artist").eq("user_id", user?.id);
    setUserWantedTickets(data?.map((wt) => wt.artist.toLowerCase()) || []);
  };

  const loadTickets = async () => {
    setLoadingTickets(true);
    const { data: networkData, error: networkError } = await supabase.rpc("get_extended_network", {
      user_uuid: user?.id,
    });
    if (networkError) console.error("Error loading network:", networkError);

    const networkMap = new Map(networkData?.map((n) => [n.network_user_id, n.degree]) || []);
    const networkUserIds = networkData?.map((n) => n.network_user_id) || [];
    const allowedUserIds = [...networkUserIds, user?.id];

    const { data, error } = await supabase
      .from("tickets")
      .select(`*, profiles!tickets_user_id_fkey(name)`)
      .eq("status", "available")
      .in("user_id", allowedUserIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tickets:", error);
      toast.error("Error al cargar las entradas");
      setLoadingTickets(false);
      return;
    }

    const ticketsWithMutualFriends = await Promise.all(
      (data || []).map(async (ticket) => {
        const degree = networkMap.get(ticket.user_id);
        let mutualFriends: Array<{ friend_name: string }> = [];
        if (degree === 2 && user?.id) {
          const { data: mutualData } = await supabase.rpc("get_mutual_friends", {
            user_a: user.id,
            user_b: ticket.user_id,
          });
          mutualFriends = mutualData?.map((f) => ({ friend_name: f.friend_name })) || [];
        }
        return { ...ticket, networkDegree: degree, mutualFriends };
      })
    );

    const sortedTickets = ticketsWithMutualFriends.sort((a, b) => {
      const isAOwn = a.user_id === user?.id;
      const isBOwn = b.user_id === user?.id;
      if (isAOwn && !isBOwn) return 1;
      if (!isAOwn && isBOwn) return -1;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

    setTickets(sortedTickets);
    setLoadingTickets(false);
  };

  const loadWantedTickets = async () => {
    setLoadingWanted(true);
    const { data: networkData, error: networkError } = await supabase.rpc("get_extended_network", {
      user_uuid: user?.id,
    });
    if (networkError) console.error("Error loading network:", networkError);

    const networkMap = new Map(networkData?.map((n) => [n.network_user_id, n.degree]) || []);
    const networkUserIds = networkData?.map((n) => n.network_user_id) || [];
    const allowedUserIds = [...networkUserIds, user?.id];

    const { data, error } = await supabase
      .from("wanted_tickets")
      .select(`*, profiles!wanted_tickets_user_id_fkey(name)`)
      .in("user_id", allowedUserIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading wanted tickets:", error);
      toast.error("Error al cargar las búsquedas");
      setLoadingWanted(false);
      return;
    }

    const wantedTicketsWithMutualFriends = await Promise.all(
      (data || []).map(async (ticket) => {
        const degree = networkMap.get(ticket.user_id);
        let mutualFriends: Array<{ friend_name: string }> = [];
        if (degree === 2 && user?.id) {
          const { data: mutualData } = await supabase.rpc("get_mutual_friends", {
            user_a: user.id,
            user_b: ticket.user_id,
          });
          mutualFriends = mutualData?.map((f) => ({ friend_name: f.friend_name })) || [];
        }
        return { ...ticket, networkDegree: degree, mutualFriends };
      })
    );

    const sortedWantedTickets = wantedTicketsWithMutualFriends.sort((a, b) => {
      const isAOwn = a.user_id === user?.id;
      const isBOwn = b.user_id === user?.id;
      if (isAOwn && !isBOwn) return 1;
      if (!isAOwn && isBOwn) return -1;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

    setWantedTickets(sortedWantedTickets);
    setLoadingWanted(false);
  };

  const subscribeToTickets = () => {
    const channel = supabase
      .channel("tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => loadTickets())
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const subscribeToWantedTickets = () => {
    const channel = supabase
      .channel("wanted-tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "wanted_tickets" }, () => loadWantedTickets())
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleDeleteWantedTicket = async (ticketId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wanted_tickets").delete().eq("id", ticketId);
    if (error) {
      toast.error("Error al eliminar búsqueda");
      console.error("Error deleting wanted ticket:", error);
      return;
    }
    setWantedTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setWantedTicketToDelete(null);
    toast.success("Búsqueda eliminada");
    loadUserWantedArtists();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Feed</h1>
          <p className="text-muted-foreground mt-1">Entradas de tu red de confianza</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 fade-in-up-delay-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-10 h-11 rounded-lg bg-card border-border/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Tabs defaultValue="sale" className="w-full fade-in-up-delay-2">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-11 bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="sale" className="rounded-md text-sm font-medium">
              Entradas en Venta
            </TabsTrigger>
            <TabsTrigger value="wanted" className="rounded-md text-sm font-medium">
              Entradas que Buscan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sale">
            <div className="mb-6 flex justify-end">
              <TicketForm onSuccess={loadTickets} />
            </div>

            {loadingTickets ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground">Cargando entradas...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No hay entradas disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">¡Sé el primero en publicar una!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tickets
                  .filter(
                    (ticket) =>
                      searchQuery === "" || ticket.artist.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const aMatches = userWantedTickets.includes(a.artist.toLowerCase());
                    const bMatches = userWantedTickets.includes(b.artist.toLowerCase());
                    if (aMatches && !bMatches) return -1;
                    if (!aMatches && bMatches) return 1;
                    return 0;
                  })
                  .map((ticket) => {
                    if (!ticket.profiles) return null;
                    const matchesSearch = userWantedTickets.includes(ticket.artist.toLowerCase());
                    return (
                      <div key={ticket.id} className="relative">
                        {matchesSearch && (
                          <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs">
                            🔔 Coincide
                          </Badge>
                        )}
                        <TicketCard
                          ticket={{ ...ticket, seller_name: ticket.profiles.name }}
                          currentUserId={user?.id}
                          networkDegree={ticket.networkDegree}
                          mutualFriends={ticket.mutualFriends}
                          onContact={() => setSelectedTicket(ticket)}
                        />
                      </div>
                    );
                  })}

                {tickets.filter(
                  (ticket) =>
                    searchQuery === "" || ticket.artist.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 &&
                  searchQuery !== "" && (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-muted-foreground text-sm">No se encontraron entradas</p>
                    </div>
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wanted">
            <div className="mb-6 flex justify-end">
              <WantedTicketForm onSuccess={loadWantedTickets} />
            </div>

            {loadingWanted ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground">Cargando búsquedas...</p>
              </div>
            ) : wantedTickets.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No hay búsquedas activas</p>
                <p className="text-sm text-muted-foreground mt-1">¡Sé el primero en publicar una!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {wantedTickets
                  .filter(
                    (ticket) =>
                      searchQuery === "" || ticket.artist.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((ticket) => {
                    if (!ticket.profiles) return null;
                    return (
                      <WantedTicketCard
                        key={ticket.id}
                        ticket={{ ...ticket, seeker_name: ticket.profiles.name }}
                        currentUserId={user?.id}
                        networkDegree={ticket.networkDegree}
                        mutualFriends={ticket.mutualFriends}
                        onContact={() => setSelectedWantedTicket(ticket)}
                        onEdit={() => setEditingWantedTicket(ticket)}
                        onDelete={() => setWantedTicketToDelete(ticket.id)}
                      />
                    );
                  })}
                {wantedTickets.filter(
                  (ticket) =>
                    searchQuery === "" || ticket.artist.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 &&
                  searchQuery !== "" && (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-muted-foreground text-sm">No se encontraron entradas</p>
                    </div>
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTicket && selectedTicket.profiles && (
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

      {selectedWantedTicket && selectedWantedTicket.profiles && (
        <ContactDialog
          open={!!selectedWantedTicket}
          onOpenChange={(open) => !open && setSelectedWantedTicket(null)}
          ticket={{
            id: selectedWantedTicket.id,
            artist: selectedWantedTicket.artist,
            seller: selectedWantedTicket.profiles.name,
            seller_id: selectedWantedTicket.user_id,
          }}
          isWantedTicket
        />
      )}

      {editingWantedTicket && (
        <WantedTicketForm
          editTicket={editingWantedTicket}
          onSuccess={() => {
            loadWantedTickets();
            loadUserWantedArtists();
            setEditingWantedTicket(null);
          }}
        />
      )}

      <AlertDialog open={!!wantedTicketToDelete} onOpenChange={(open) => !open && setWantedTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar búsqueda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La búsqueda será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => wantedTicketToDelete && handleDeleteWantedTicket(wantedTicketToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Feed;
