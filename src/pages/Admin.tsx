import { useState, useEffect, useMemo, Fragment } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Users, UserCheck, FileText, Mail, Send, ArrowUp, ArrowDown, ArrowUpDown,
  Search, ListChecks, ChevronDown, ChevronRight, UserPlus, Loader2,
  Ticket, MessageSquare, Heart, Filter, MailCheck, MailX, Copy, Ban, Download,
} from 'lucide-react';

import AdminDocs from '@/components/AdminDocs';
import AdminEmailTemplates from '@/components/AdminEmailTemplates';
import AdminOutreach from '@/components/AdminOutreach';
import AdminLaunchTasks from '@/components/AdminLaunchTasks';

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
  last_sign_in_at: string | null;
  has_password: boolean | null;
  password_set_at: string | null;
  newsletter_unsubscribed: boolean | null;
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
  quantity?: number;
}

interface UserDetails {
  loading: boolean;
  friends: FriendRow[];
  inviter: InviterRow | null;
  invitees: InviteeRow[];
  tickets: TicketRow[];
  wanted: WantedRow[];
}

type SortKey = 'name' | 'email' | 'friend_count' | 'active_tickets' | 'messages' | 'created_at' | 'last_sign_in_at';
type FilterKey = 'all' | 'no_friends' | 'no_activity' | 'no_password' | 'password_never_signed_in' | 'active_user' | 'can_email' | 'unsubscribed';

const canEmail = (u: { last_sign_in_at: string | null; newsletter_unsubscribed: boolean | null }) =>
  !!u.last_sign_in_at && u.newsletter_unsubscribed !== true;

const Admin = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_sign_in_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, UserDetails>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);


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
    } else if (filterKey === 'no_password') {
      result = result.filter(u => !u.password_set_at);
    } else if (filterKey === 'password_never_signed_in') {
      result = result.filter(u => !!u.password_set_at && !u.last_sign_in_at);
    } else if (filterKey === 'active_user') {
      result = result.filter(u => !!u.last_sign_in_at);
    } else if (filterKey === 'can_email') {
      result = result.filter(canEmail);
    } else if (filterKey === 'unsubscribed') {
      result = result.filter(u => u.newsletter_unsubscribed === true);
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
        case 'last_sign_in_at': {
          // "Nunca" (null) siempre primero, independientemente del orden
          const aNull = !a.last_sign_in_at;
          const bNull = !b.last_sign_in_at;
          if (aNull && !bNull) return -1;
          if (!aNull && bNull) return 1;
          if (aNull && bNull) return 0;
          return (new Date(a.last_sign_in_at!).getTime() - new Date(b.last_sign_in_at!).getTime()) * dir;
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

  const toggleNewsletterUnsubscribed = async (userId: string, value: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, newsletter_unsubscribed: value } : u));
    const { error } = await supabase.rpc('admin_set_newsletter_unsubscribed', {
      _user_id: userId,
      _value: value,
    });
    if (error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, newsletter_unsubscribed: !value } : u));
      toast.error('No se pudo actualizar la baja de newsletter');
      return;
    }
    toast.success(value ? 'Marcado como dado de baja' : 'Baja de newsletter retirada');
  };

  const copyFilteredEmails = async () => {
    const emails = filteredUsers.filter(canEmail).map(u => u.email).filter(Boolean);
    if (emails.length === 0) {
      toast.error('No hay emails que copiar');
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      toast.success(`${emails.length} emails copiados al portapapeles`);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const selectedUsers = useMemo(
    () => users.filter(u => selectedIds.includes(u.id)),
    [users, selectedIds]
  );
  const selectedEmails = selectedUsers.map(u => u.email).filter(Boolean);

  const toggleSelected = (userId: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.includes(u.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const ids = new Set(filteredUsers.map(u => u.id));
      setSelectedIds(prev => prev.filter(id => !ids.has(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredUsers.map(u => u.id)])));
    }
  };

  const copySelectedEmails = async () => {
    if (selectedEmails.length === 0) {
      toast.error('No has seleccionado a nadie');
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedEmails.join(', '));
      toast.success(`${selectedEmails.length} emails copiados`);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const openGmailWithSelected = () => {
    if (selectedEmails.length === 0) {
      toast.error('No has seleccionado a nadie');
      return;
    }
    const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(selectedEmails.join(','))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadSelectedCsv = () => {
    if (selectedUsers.length === 0) {
      toast.error('No has seleccionado a nadie');
      return;
    }
    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      'Nombre,Email',
      ...selectedUsers.map(u => `${escape(u.name)},${escape(u.email)}`),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contactos-trusticket-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${selectedUsers.length} contactos descargados`);
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
            {/* Resumen de tipos de usuario */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              <button
                onClick={() => setFilterKey('all')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'all'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <span className="text-lg font-bold">{users.length}</span>
                <span className="text-xs text-muted-foreground">Total usuarios</span>
              </button>
              <button
                onClick={() => setFilterKey('no_password')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'no_password'
                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : 'bg-card border-border hover:border-red-500/20'
                }`}
              >
                <span className="text-lg font-bold">{users.filter(u => !u.password_set_at).length}</span>
                <span className="text-xs text-muted-foreground">Sin contraseña</span>
              </button>
              <button
                onClick={() => setFilterKey('password_never_signed_in')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'password_never_signed_in'
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                    : 'bg-card border-border hover:border-orange-500/20'
                }`}
              >
                <span className="text-lg font-bold">{users.filter(u => !!u.password_set_at && !u.last_sign_in_at).length}</span>
                <span className="text-xs text-muted-foreground">Nunca entró</span>
              </button>
              <button
                onClick={() => setFilterKey('active_user')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'active_user'
                    ? 'bg-green-500/10 border-green-500/30 text-green-500'
                    : 'bg-card border-border hover:border-green-500/20'
                }`}
              >
                <span className="text-lg font-bold">{users.filter(u => !!u.last_sign_in_at).length}</span>
                <span className="text-xs text-muted-foreground">Activos</span>
              </button>
              <button
                onClick={() => setFilterKey('can_email')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'can_email'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-card border-border hover:border-emerald-500/20'
                }`}
              >
                <span className="text-lg font-bold">{users.filter(canEmail).length}</span>
                <span className="text-xs text-muted-foreground">Puedo escribir</span>
              </button>
              <button
                onClick={() => setFilterKey('no_friends')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  filterKey === 'no_friends'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                    : 'bg-card border-border hover:border-blue-500/20'
                }`}
              >
                <span className="text-lg font-bold">{users.filter(u => u.friend_count === 0).length}</span>
                <span className="text-xs text-muted-foreground">Sin amigos</span>
              </button>
            </div>

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
                  variant={filterKey === 'no_password' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('no_password')}
                  className={filterKey === 'no_password' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Sin contraseña
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'password_never_signed_in' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('password_never_signed_in')}
                  className={filterKey === 'password_never_signed_in' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  Nunca entró
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'active_user' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('active_user')}
                  className={filterKey === 'active_user' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Activos
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'can_email' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('can_email')}
                  className={`gap-1 ${filterKey === 'can_email' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                  <MailCheck className="w-3.5 h-3.5" />
                  Puedo escribir
                </Button>
                <Button
                  size="sm"
                  variant={filterKey === 'unsubscribed' ? 'default' : 'outline'}
                  onClick={() => setFilterKey('unsubscribed')}
                  className="gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Dados de baja
                </Button>
                {filterKey === 'can_email' && (
                  <Button size="sm" onClick={copyFilteredEmails} className="gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    Copiar emails ({filteredUsers.filter(canEmail).length})
                  </Button>
                )}
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

            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-border bg-card">
              <Button size="sm" variant="outline" onClick={toggleSelectAllFiltered}>
                {allFilteredSelected ? 'Deseleccionar visibles' : `Seleccionar visibles (${filteredUsers.length})`}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} seleccionados
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={copySelectedEmails} className="gap-1" disabled={selectedIds.length === 0}>
                <Copy className="w-3.5 h-3.5" />
                Copiar emails
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSelectedCsv} className="gap-1" disabled={selectedIds.length === 0}>
                <Download className="w-3.5 h-3.5" />
                Descargar CSV
              </Button>
              <Button size="sm" onClick={openGmailWithSelected} className="gap-1" disabled={selectedIds.length === 0}>
                <Mail className="w-3.5 h-3.5" />
                Abrir en Gmail (BCC)
              </Button>
              {selectedIds.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                  Limpiar
                </Button>
              )}
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-8 px-2 py-3">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleSelectAllFiltered}
                          aria-label="Seleccionar todos los visibles"
                        />
                      </th>
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
                      <th
                        className="text-left px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort('last_sign_in_at')}
                      >
                        <span className="inline-flex items-center gap-1">Último acceso <SortIcon column="last_sign_in_at" /></span>
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-sm whitespace-nowrap">
                        Newsletter
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground">
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
                              <td className="px-4 py-3 text-sm">
                                {user.last_sign_in_at ? (
                                  <span className="text-muted-foreground">{formatDate(user.last_sign_in_at)}</span>
                                ) : user.has_password ? (
                                  <span className="font-medium text-orange-500">Nunca entró</span>
                                ) : (
                                  <span className="text-destructive font-medium">Sin contraseña</span>
                                )}
                              </td>
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  {user.newsletter_unsubscribed ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Dado de baja">
                                      <Ban className="w-3.5 h-3.5" />
                                      Baja
                                    </span>
                                  ) : canEmail(user) ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500" title="Puede recibir emails">
                                      <MailCheck className="w-3.5 h-3.5" />
                                      Sí
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive" title="No ha iniciado sesión nunca">
                                      <MailX className="w-3.5 h-3.5" />
                                      No
                                    </span>
                                  )}
                                  <Switch
                                    checked={!!user.newsletter_unsubscribed}
                                    onCheckedChange={(checked) => toggleNewsletterUnsubscribed(user.id, checked)}
                                    aria-label="Marcar baja de newsletter"
                                  />
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/20">
                                <td colSpan={9} className="px-6 py-4">
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
                                                <span className="text-muted-foreground">· {w.quantity ?? 1} {w.quantity === 1 ? 'entrada' : 'entradas'}</span>
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
