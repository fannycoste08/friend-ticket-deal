import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface FriendRequest {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

export const FriendshipRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRequests();
      subscribeToRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, created_at')
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading friendship requests:', error);
      setRequests([]);
      setLoading(false);
      return;
    }

    // Load profiles for each request
    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, { name: p.name }]) || []
      );

      const requestsWithProfiles = data.map(r => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || { name: 'Usuario' }
      }));

      setRequests(requestsWithProfiles);
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('friendship-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      toast.error('Error al aceptar solicitud');
      return;
    }

    toast.success('¡Solicitud aceptada!');
    loadRequests();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      toast.error('Error al rechazar solicitud');
      return;
    }

    toast.success('Solicitud rechazada');
    loadRequests();
  };

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Solicitudes de amistad</h2>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
          >
            <div>
              <p className="font-medium">{request.profiles.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Check className="w-4 h-4 mr-1" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};