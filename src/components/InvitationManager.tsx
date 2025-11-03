import { useState, useEffect } from 'react';
import { Mail, Check, X, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invitation {
  id: string;
  invitee_email: string;
  invitee_name: string;
  status: string;
  created_at: string;
}

export const InvitationManager = ({ userId }: { userId: string }) => {
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [approvedInvitations, setApprovedInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadInvitations = async () => {
    const { data: pending } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const { data: approved } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    setPendingInvitations(pending || []);
    setApprovedInvitations(approved || []);
  };

  useEffect(() => {
    loadInvitations();
  }, [userId]);

  const handleApprove = async (invitationId: string) => {
    setLoading(true);
    
    // Get invitation details first
    const invitation = pendingInvitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      toast.error('Invitación no encontrada');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('invitations')
      .update({ status: 'approved' })
      .eq('id', invitationId);

    if (error) {
      toast.error('Error al aprobar la invitación');
      setLoading(false);
      return;
    }

    // Get inviter name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    // Send email notification
    try {
      await supabase.functions.invoke('send-invitation-accepted', {
        body: {
          invitee_email: invitation.invitee_email,
          invitee_name: invitation.invitee_name,
          inviter_name: profile?.name || 'Tu padrino',
        },
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    toast.success('Invitación aprobada');
    loadInvitations();
    setLoading(false);
  };

  const handleReject = async (invitationId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (error) {
      toast.error('Error al rechazar la invitación');
    } else {
      toast.success('Invitación rechazada');
      loadInvitations();
    }
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // This would send an email invitation
    // For now, we'll just show a success message
    toast.success(`Invitación enviada a ${inviteEmail}`);
    setInviteEmail('');
    setDialogOpen(false);
    setLoading(false);
  };

  return (
    <Card className="p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestionar Invitaciones</h2>
          <p className="text-sm text-muted-foreground">
            {pendingInvitations.length} solicitudes pendientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invitar persona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar nueva persona</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="persona@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Enviar invitación
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pendientes ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobadas ({approvedInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingInvitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay solicitudes pendientes
            </p>
          ) : (
            pendingInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {invitation.invitee_name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {invitation.invitee_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado el {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(invitation.id)}
                      disabled={loading}
                      className="gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(invitation.id)}
                      disabled={loading}
                      className="gap-1"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedInvitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No has aprobado ninguna invitación todavía
            </p>
          ) : (
            approvedInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {invitation.invitee_name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invitation.invitee_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aprobado el {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Aprobado
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
