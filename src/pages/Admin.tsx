import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, FileText, Mail, Send, ArrowUp, ArrowDown, Search, ListChecks, ChevronDown, ChevronRight, UserPlus, Loader2 } from 'lucide-react';
import AdminDocs from '@/components/AdminDocs';
import AdminEmailTemplates from '@/components/AdminEmailTemplates';
import AdminOutreach from '@/components/AdminOutreach';
import AdminLaunchTasks from '@/components/AdminLaunchTasks';

interface UserWithFriends {
  id: string;
  name: string;
  email: string;
  created_at: string;
  friend_count: number;
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

interface UserDetails {
  loading: boolean;
  friends: FriendRow[];
  inviter: InviterRow | null;
}

const Admin = () => {
  const [users, setUsers] = useState<UserWithFriends[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, UserDetails>>({});

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
    return result;
  }, [users, searchQuery, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase.rpc('get_profiles_with_friend_count_admin');

    if (!error) {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
      [userId]: { loading: true, friends: [], inviter: null },
    }));

    const [friendsRes, inviterRes] = await Promise.all([
      supabase.rpc('get_user_friends_admin', { _user_id: userId }),
      supabase.rpc('get_user_inviter_admin', { _user_id: userId }),
    ]);

    setDetailsCache(prev => ({
      ...prev,
      [userId]: {
        loading: false,
        friends: (friendsRes.data as FriendRow[]) || [],
        inviter: ((inviterRes.data as InviterRow[]) || [])[0] || null,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-4 py-3 font-medium text-sm">Usuario</th>
                      <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
                      <th className="text-center px-4 py-3 font-medium text-sm">Amigos</th>
                      <th
                        className="text-left px-4 py-3 font-medium text-sm cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Registro
                          {sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isExpanded = expandedUserId === user.id;
                        const details = detailsCache[user.id];
                        return (
                          <>
                            <tr
                              key={user.id}
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
                              <td className="px-4 py-3 text-muted-foreground text-sm">
                                {formatDate(user.created_at)}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${user.id}-details`} className="bg-muted/20">
                                <td colSpan={5} className="px-6 py-4">
                                  {!details || details.loading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Cargando detalles...
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
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

                                      <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                          <UserCheck className="w-3.5 h-3.5" />
                                          Amigos ({details.friends.length})
                                        </div>
                                        {details.friends.length === 0 ? (
                                          <div className="text-sm text-muted-foreground italic">Sin amigos aún</div>
                                        ) : (
                                          <ul className="space-y-1">
                                            {details.friends.map((f) => (
                                              <li key={f.friend_id} className="text-sm">
                                                <span className="font-medium">{f.friend_name}</span>
                                                <span className="text-muted-foreground"> · {f.friend_email}</span>
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
                          </>
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
