import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, FileText, Mail } from 'lucide-react';
import AdminDocs from '@/components/AdminDocs';
import AdminEmailTemplates from '@/components/AdminEmailTemplates';

interface UserWithFriends {
  id: string;
  name: string;
  email: string;
  created_at: string;
  friend_count: number;
}

const Admin = () => {
  const [users, setUsers] = useState<UserWithFriends[]>([]);
  const [loading, setLoading] = useState(true);

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
              Documentación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-sm">Usuario</th>
                      <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
                      <th className="text-center px-4 py-3 font-medium text-sm">Amigos</th>
                      <th className="text-left px-4 py-3 font-medium text-sm">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay usuarios registrados
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
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
                              variant={user.friend_count > 0 ? "default" : "secondary"}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground text-center">
              Total: {users.length} usuarios
            </div>
          </TabsContent>

          <TabsContent value="emails">
            <AdminEmailTemplates />
          </TabsContent>

          <TabsContent value="docs">
            <AdminDocs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
