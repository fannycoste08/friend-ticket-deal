import { useState, useEffect, useMemo, Fragment } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, UserCheck, FileText, Mail, Send, ArrowUp, ArrowDown, ArrowUpDown,
  Search, ListChecks, ChevronDown, ChevronRight, UserPlus, Loader2,
  Ticket, MessageSquare, Heart, Filter, Trash2,
} from 'lucide-react';
import AdminDocs from '@/components/AdminDocs';
import AdminEmailTemplates from '@/components/AdminEmailTemplates';
import AdminOutreach from '@/components/AdminOutreach';
import AdminLaunchTasks from '@/components/AdminLaunchTasks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  id: string;
  name: string;
  email: string;
  created_at: string;
  friend_count: number;
  active_tickets: number;
  active_wanted: number;
  messages_sent: number;
  messages_received: number;
}

interface FriendRow {
  friend_id: string;
  friend_name: string;
  friend_email: string;
}

interface InviterRow {
  inviter_id: string;
  inviter_name: string;
  inviter_email: string;
}

interface InviteeRow {
  invitee_id: string | null;
  invitee_name: string;
  invitee_email: string;
  status: string;
  created_at: string;
}

interface TicketRow {
  id: string;
  artist: string;
  price: number;
  event_date: string;
  city: string;
  venue: string;
  status: string;
}

interface WantedRow {
  id: string;
  artist: string;
  event_date: string;
  city: string;
}

interface UserDetails {
  loading: boolean;
  friends: FriendRow[];
  inviter: InviterRow | null;
  invitees: InviteeRow[];
  tickets: TicketRow[];
  wanted: WantedRow[];
}

type SortKey = 'name' | 'email' | 'friend_count' | 'active_tickets' | 'messages' | 'created_at';
type FilterKey = 'all' | 'no_friends' | 'no_activity';

const Admin = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, UserDetails>>({});
  const [userToDelete, setUserToDelete] = useState<UserStats | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = users.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );

    if (filterKey === 'no_friends') {
      result = result.filter(u => u.friend_count === 0);
    } else if (filterKey === 'no_activity') {
      result = result.filter(u =>
        u.active_tickets === 0 &&
        u.active_wanted === 0 &&
        u.messages_sent === 0 &&
        u.messages_received === 0
      );
    }

    const dir = sortOrder === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      switch (sortKey) {
        case 'name': return (a.name ?? '').localeCompare(b.name ?? '') * dir;
        case 'email': return (a.email ?? '').localeCompare(b.email ?? '') * dir;
        case 'friend_count': return (a.friend_count - b.friend_count) * dir;
        case 'active_tickets': return (a.active_tickets - b.active_tickets) * dir;
        case 'messages': {
          const am = a.messages_sent + a.messages_received;
          const bm = b.messages_sent + b.messages_received;
          return (am - bm) * dir;
        }
        case 'created_at':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    });
    return result;
  }, [users, searchQuery, sortKey, sortOrder, filterKey]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase.rpc('get_admin_user_stats');
    if (!error) setUsers((data as UserStats[]) || []);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  const toggleUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    if (detailsCache[userId]) return;

    setDetailsCache(prev => ({
      ...prev,
      [userId]: { loading: true, friends: [], inviter: null, invitees: [], tickets: [], wanted: [] },
    }));

    const [friendsRes, inviterRes, inviteesRes, ticketsRes, wantedRes] = await Promise.all([
      supabase.rpc('get_user_friends_admin', { _user_id: userId }),
      supabase.rpc('get_user_inviter_admin', { _user_id: userId }),
      supabase.rpc('get_user_invitees_admin', { _user_id: userId }),
      supabase.rpc('get_user_tickets_admin', { _user_id: userId }),
      supabase.rpc('get_user_wanted_tickets_admin', { _user_id: userId }),
    ]);

    setDetailsCache(prev => ({
      ...prev,
      [userId]: {
        loading: false,
        friends: (friendsRes.data as FriendRow[]) || [],
        inviter: ((inviterRes.data as InviterRow[]) || [])[0] || null,
        invitees: (inviteesRes.data as InviteeRow[]) || [],
        tickets: (ticketsRes.data as TicketRow[]) || [],
        wanted: (wantedRes.data as WantedRow[]) || [],
      },
    }));
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const target = userToDelete;
    setDeletingUserId(target.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: target.id },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || 'Error al eliminar');
      }
      setUsers(prev => prev.filter(u => u.id !== target.id));
      setDetailsCache(prev => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      if (expandedUserId === target.id) setExpandedUserId(null);
      toast({
        title: 'Usuario eliminado',
        description: `${target.name || target.email} ha sido eliminado correctamente.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'No se ha podido eliminar el usuario',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Usuarios, conexiones y documentación</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-1.5">
              <Mail className="w-4 h-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5">
              <FileText className="w-4 h-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5">
              <Send className="w-4 h-4" />
              Outreach
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <ListChecks className="w-4 h-4" />
              Tareas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground mr-1" />
                <Button
                  size="sm"
                  variant={filterKey === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('all')}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'no_friends' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('no_friends')}
                >
                  Sin amigos
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'no_activity' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('no_activity')}
                >
                  Sin actividad
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-8 px-2 py-3"></th>
                      <th
                        className="text-left px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('name')}
                      >
                        <span className="inline-flex items-center gap-1">Usuario <SortIcon column="name" /></span>
                      </th>
                      <th
                        className="text-left px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('email')}
                      >
                        <span className="inline-flex items-center gap-1">Email <SortIcon column="email" /></span>
                      </th>
                      <th
                        className="text-center px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('friend_count')}
                      >
                        <span className="inline-flex items-center gap-1">Amigos <SortIcon column="friend_count" /></span>
                      </th>
                      <th
                        className="text-center px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('active_tickets')}
                      >
                        <span className="inline-flex items-center gap-1">Entradas <SortIcon column="active_tickets" /></span>
                      </th>
                      <th
                        className="text-center px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('messages')}
                      >
                        <span className="inline-flex items-center gap-1">Mensajes <SortIcon column="messages" /></span>
                      </th>
                      <th
                        className="text-left px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('created_at')}
                      >
                        <span className="inline-flex items-center gap-1">Registro <SortIcon column="created_at" /></span>
                      </th>
                      <th className="w-12 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchQuery || filterKey !== 'all' ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isExpanded = expandedUserId === user.id;
                        const details = detailsCache[user.id];
                        return (
                          <Fragment key={user.id}>
                            <tr
                              className="hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => toggleUser(user.id)}
                            >
                              <td className="px-2 py-3 text-muted-foreground">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">
                                      {user.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <span className="font-medium">{user.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-sm">
                                {user.email}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={user.friend_count > 0 ? 'default' : 'secondary'}
                                  className="gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  {user.friend_count}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={user.active_tickets > 0 ? 'default' : 'secondary'}
                                  className="gap-1"
                                >
                                  <Ticket className="w-3 h-3" />
                                  {user.active_tickets}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center gap-2 text-sm">
                                  <span className="inline-flex items-center gap-0.5 text-foreground" title="Enviados">
                                    <ArrowUp className="w-3 h-3" />{user.messages_sent}
                                  </span>
                                  <span className="text-muted-foreground/50">/</span>
                                  <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="Recibidos">
                                    <ArrowDown className="w-3 h-3" />{user.messages_received}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-sm">
                                {formatDate(user.created_at)}
                              </td>
                              <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                {currentUser?.id !== user.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setUserToDelete(user)}
                                    disabled={deletingUserId === user.id}
                                    title="Eliminar usuario"
                                  >
                                    {deletingUserId === user.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/20">
                                <td colSpan={8} className="px-6 py-4">
                                  {!details || details.loading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Cargando detalles...
                                    </div>
                                  ) : (
                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                                      {/* Invitado por */}
                                      <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <UserPlus className="w-3.5 h-3.5" />
                                          Invitado por
                                        </div>
                                        {details.inviter ? (
                                          <div className="text-sm">
                                            <span className="font-medium">{details.inviter.inviter_name}</span>
                                            <span className="text-muted-foreground"> · {details.inviter.inviter_email}</span>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-muted-foreground italic">Sin invitador registrado</div>
                                        )}
                                      </div>

                                      {/* Ahijados */}
                                      <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <Heart className="w-3.5 h-3.5" />
                                          Ahijados ({details.invitees.length})
                                        </div>
                                        {details.invitees.length === 0 ? (
                                          <div className="text-sm text-muted-foreground italic">Sin ahijados</div>
                                        ) : (
                                          <ul className="space-y-1 max-h-40 overflow-y-auto pr-2">
                                            {details.invitees.map((inv, idx) => (
                                              <li key={`${inv.invitee_email}-${idx}`} className="text-sm flex items-center gap-2">
                                                <span className="font-medium">{inv.invitee_name}</span>
                                                <span className="text-muted-foreground">· {inv.invitee_email}</span>
                                                <Badge variant="outline" className="text-xs h-5">
                                                  {inv.status}
                                                </Badge>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>

                                      {/* Amigos */}
                                      <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <UserCheck className="w-3.5 h-3.5" />
                                          Amigos ({details.friends.length})
                                        </div>
                                        {details.friends.length === 0 ? (
                                          <div className="text-sm text-muted-foreground italic">Sin amigos aún</div>
                                        ) : (
                                          <ul className="space-y-1 max-h-40 overflow-y-auto pr-2">
                                            {details.friends.map((f) => (
                                              <li key={f.friend_id} className="text-sm">
                                                <span className="font-medium">{f.friend_name}</span>
                                                <span className="text-muted-foreground"> · {f.friend_email}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>

                                      {/* Actividad de mensajes */}
                                      <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          Actividad de mensajes
                                        </div>
                                        <div className="text-sm flex gap-4">
                                          <div>
                                            <span className="font-medium">{user.messages_sent}</span>
                                            <span className="text-muted-foreground"> enviados</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">{user.messages_received}</span>
                                            <span className="text-muted-foreground"> recibidos</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Entradas activas */}
                                      <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <Ticket className="w-3.5 h-3.5" />
                                          Entradas activas ({details.tickets.length})
                                        </div>
                                        {details.tickets.length === 0 ? (
                                          <div className="text-sm text-muted-foreground italic">Sin entradas activas</div>
                                        ) : (
                                          <ul className="space-y-1">
                                            {details.tickets.map((t) => (
                                              <li key={t.id} className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="font-medium">{t.artist}</span>
                                                <span className="text-muted-foreground">{formatDate(t.event_date)}</span>
                                                <span className="text-muted-foreground">· {t.city}</span>
                                                <Badge variant="secondary" className="text-xs h-5">
                                                  {formatPrice(t.price)}
                                                </Badge>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>

                                      {/* Búsquedas activas */}
                                      <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <Search className="w-3.5 h-3.5" />
                                          Búsquedas activas ({details.wanted.length})
                                        </div>
                                        {details.wanted.length === 0 ? (
                                          <div className="text-sm text-muted-foreground italic">Sin búsquedas activas</div>
                                        ) : (
                                          <ul className="space-y-1">
                                            {details.wanted.map((w) => (
                                              <li key={w.id} className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="font-medium">{w.artist}</span>
                                                <span className="text-muted-foreground">{formatDate(w.event_date)}</span>
                                                <span className="text-muted-foreground">· {w.city}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground text-center">
              Total: {filteredUsers.length}{searchQuery ? ` de ${users.length}` : ''} usuarios
            </div>
          </TabsContent>

          <TabsContent value="emails">
            <AdminEmailTemplates />
          </TabsContent>

          <TabsContent value="docs">
            <AdminDocs />
          </TabsContent>

          <TabsContent value="outreach">
            <AdminOutreach />
          </TabsContent>

          <TabsContent value="tasks">
            <AdminLaunchTasks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
