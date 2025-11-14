import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviterEmail, setInviterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [inviterName, setInviterName] = useState('');

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already registered in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      toast.error('Este email ya está registrado');
      setLoading(false);
      return;
    }

    // Normalize inviter email
    const normalizedInviterEmail = inviterEmail.trim().toLowerCase();

    // Verify if godparent exists using edge function (to bypass RLS)
    console.log('Verifying inviter email via edge function:', normalizedInviterEmail);
    
    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-inviter-email', {
      body: { email: normalizedInviterEmail }
    });

    console.log('Verification result:', verifyResult);

    if (verifyError || !verifyResult?.exists) {
      console.error('Inviter verification error:', verifyError);
      toast.error('El email del padrino no existe en el sistema');
      setLoading(false);
      return;
    }

    // Get inviter data from the verification result
    const inviterProfile = verifyResult.inviter;
    
    if (!inviterProfile) {
      console.error('No inviter data returned from verification');
      toast.error('Error al obtener datos del padrino');
      setLoading(false);
      return;
    }

    // Create invitation request via edge function (to bypass RLS)
    const { data: invitationResult, error: invitationError } = await supabase.functions.invoke('create-invitation-request', {
      body: {
        inviter_id: inviterProfile.id,
        invitee_email: normalizedEmail,
        invitee_name: name,
      }
    });

    if (invitationError || !invitationResult?.success) {
      console.error('Error creating invitation:', invitationError, invitationResult);
      
      if (invitationResult?.error === 'Pending invitation already exists') {
        toast.error('Ya existe una solicitud pendiente para este email');
      } else {
        toast.error('Error al crear la solicitud de invitación');
      }
      
      setLoading(false);
      return;
    }

    // Send notification email to godparent
    const { error: emailError } = await supabase.functions.invoke('send-invitation-notification', {
      body: {
        inviter_email: inviterProfile.email,
        inviter_name: inviterProfile.name || 'Usuario',
        invitee_name: name,
        invitee_email: normalizedEmail,
      },
    });

    if (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the registration if email fails
    }

    setInviterName(inviterProfile.name || 'tu padrino');
    setShowSuccessModal(true);
    setLoading(false);
  };

  return (
    <>
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        setShowSuccessModal(open);
        if (!open) navigate('/login');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">¡Gracias por registrarte!</DialogTitle>
            <DialogDescription className="text-center space-y-3 pt-4">
              <p className="text-base">
                Tu solicitud ha sido enviada a <strong>{inviterName}</strong>.
              </p>
              <p className="text-muted-foreground">
                Recibirás un correo de confirmación cuando tu padrino haya aceptado tu solicitud.
              </p>
              <p className="text-sm text-muted-foreground">
                Una vez aprobada, recibirás un correo para crear tu contraseña e iniciar sesión.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button 
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/login');
            }}
            className="w-full mt-4"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Registro por Invitación</CardTitle>
            <CardDescription>Solo puedes registrarte con una invitación</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviterEmail">Email de quien te invita *</Label>
              <Input
                id="inviterEmail"
                type="email"
                placeholder="padrino@email.com"
                value={inviterEmail}
                onChange={(e) => setInviterEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Tu registro debe ser aprobado por tu padrino
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Solicitando registro...' : 'Solicitar registro'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Register;
