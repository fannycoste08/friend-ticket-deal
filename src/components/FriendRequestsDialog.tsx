import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface FriendRequest {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export const FriendRequestsDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadRequests();
    }
  }, [open, user]);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);
    
    // Get pending friendship requests
    const { data: friendshipsData } = await supabase
      .from('friendships')
      .select('id, user_id, created_at')
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!friendshipsData) {
      setLoading(false);
      return;
    }

    // Get profile data for each requester
    const userIds = friendshipsData.map(f => f.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    // Combine data
    const requestsWithProfiles = friendshipsData.map(friendship => {
      const profile = profilesData?.find(p => p.id === friendship.user_id);
      return {
        ...friendship,
        profiles: profile || { name: 'Unknown', email: '' }
      };
    });

    setRequests(requestsWithProfiles);
    setLoading(false);
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

    toast.success('Solicitud aceptada');
    loadRequests();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error('Error al rechazar solicitud');
      return;
    }

    toast.success('Solicitud rechazada');
    loadRequests();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <UserPlus className="w-4 h-4 mr-2" />
          Solicitudes
          {requests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {requests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitudes de amistad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes solicitudes pendientes
            </p>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{request.profiles.name}</p>
                  <p className="text-sm text-muted-foreground">{request.profiles.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};