import { useState, useEffect } from 'react';
import { Mail, Check, X, UserPlus, RefreshCw } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('pending');

  const loadInvitations = async () => {
    console.log('🔍 [InvitationManager] Starting to load invitations...');
    console.log('🔍 [InvitationManager] User ID:', userId);
    
    // First, verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 [InvitationManager] Current session:', session?.user?.id, 'Error:', sessionError);
    console.log('🔐 [InvitationManager] Session user matches userId:', session?.user?.id === userId);
    
    // Test if we can access ANY invitations (without filter)
    const { data: allInvitations, error: allError } = await supabase
      .from('invitations')
      .select('id, inviter_id, status')
      .limit(5);
    
    console.log('📊 [InvitationManager] Can access invitations table:', allInvitations, 'Error:', allError);
    
    const { data: pending, error: pendingError } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    console.log('📥 [InvitationManager] Pending invitations:', pending);
    console.log('❌ [InvitationManager] Pending error:', pendingError);

    const { data: approved, error: approvedError } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    console.log('✅ [InvitationManager] Approved invitations:', approved);
    console.log('❌ [InvitationManager] Approved error:', approvedError);

    setPendingInvitations(pending || []);
    setApprovedInvitations(approved || []);
    
    console.log('🎯 [InvitationManager] State updated - Pending:', pending?.length || 0, 'Approved:', approved?.length || 0);
  };

  useEffect(() => {
    console.log('🚀 [InvitationManager] Component mounted/updated with userId:', userId);
    
    if (!userId) {
      console.error('❌ [InvitationManager] No userId provided!');
      return;
    }
    
    loadInvitations();
    
    // Check if URL has #invitations hash and open pending tab
    if (window.location.hash === '#invitations') {
      setActiveTab('pending');
      // Remove hash from URL without scrolling
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Subscribe to real-time changes in invitations table
    console.log('📡 [InvitationManager] Setting up realtime subscription for user:', userId);
    const channel = supabase
      .channel('invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `inviter_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 [InvitationManager] Realtime event received:', payload);
          loadInvitations();
        }
      )
      .subscribe((status) => {
        console.log('📡 [InvitationManager] Subscription status:', status);
      });

    return () => {
      console.log('🔌 [InvitationManager] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
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

    console.log('🎫 [handleApprove] Approving invitation:', invitationId);

    // Call edge function to create user and approve invitation
    const { data, error: approveError } = await supabase.functions.invoke('approve-invitation', {
      body: {
        invitation_id: invitationId,
      },
    });

    console.log('🎫 [handleApprove] Response:', { data, error: approveError });

    if (approveError) {
      console.error('Error approving invitation:', approveError);
      // Parse the error message if available
      const errorMessage = approveError.message || 'Error al aprobar la invitación';
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    // The approve-invitation edge function handles sending the email internally
    toast.success('Invitación aprobada y usuario creado');
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

    try {
      // Get inviter profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();

      if (!profile) {
        toast.error('Error al obtener tu perfil');
        setLoading(false);
        return;
      }

      // Extract name from email if no custom name provided
      const inviteeName = inviteEmail.split('@')[0];
      
      // Create invitation in database - APPROVED automatically when inviter sends it
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          inviter_id: userId,
          invitee_email: inviteEmail,
          invitee_name: inviteeName,
          status: 'approved' // Pre-approved when inviter sends directly
        })
        .select()
        .single();

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        toast.error('Error al crear la invitación');
        setLoading(false);
        return;
      }

      // Send invitation email to the invitee
      const { error: emailError } = await supabase.functions.invoke('send-invitation-accepted', {
        body: {
          invitee_email: inviteEmail,
          invitee_name: inviteeName,
          inviter_name: profile.name,
          inviter_email: profile.email,
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast.error('Invitación creada pero hubo un error al enviar el email');
      } else {
        toast.success(`Invitación enviada a ${inviteEmail}`);
      }

      setInviteEmail('');
      setDialogOpen(false);
      loadInvitations();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al enviar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Gestionar Invitaciones</h2>
          <p className="text-sm text-muted-foreground">
            {pendingInvitations.length} solicitudes pendientes
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => loadInvitations()}
            disabled={loading}
            title="Refrescar invitaciones"
            className="flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-shrink-0">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Invitar persona</span>
                <span className="sm:hidden">Invitar</span>
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground break-words">
                        {invitation.invitee_name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 break-all">
                      {invitation.invitee_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado el {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(invitation.id)}
                      disabled={loading}
                      className="gap-1 flex-1 sm:flex-initial"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Aprobar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(invitation.id)}
                      disabled={loading}
                      className="gap-1 flex-1 sm:flex-initial"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Rechazar</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground break-words">
                        {invitation.invitee_name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      {invitation.invitee_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aprobado el {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0 w-fit">
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
