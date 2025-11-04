import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, CheckCircle } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    // Check if email is already registered in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      toast.error('Este email ya está registrado');
      setLoading(false);
      return;
    }

    // Check if there's an approved invitation for this email (godparent invited them directly)
    const { data: approvedInvitation } = await supabase
      .from('invitations')
      .select('*, inviter:profiles!invitations_inviter_id_fkey(id, name, email)')
      .eq('invitee_email', email)
      .eq('status', 'approved')
      .maybeSingle();

    if (approvedInvitation) {
      // User was pre-invited by a godparent - create user directly and log them in
      const inviterEmail = approvedInvitation.inviter?.email || '';
      const { error: signUpError } = await signUp(name, email, password, inviterEmail);
      
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("Este email ya está registrado");
        } else {
          toast.error("Error al crear la cuenta: " + signUpError.message);
        }
        setLoading(false);
        return;
      }

      toast.success("¡Cuenta creada! Bienvenido a TrusTicket");
      navigate("/");
      return;
    }

    // No pre-approved invitation - need godparent approval
    // Check if godparent exists in the system
    const { data: inviterData } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', inviterEmail)
      .maybeSingle();

    if (!inviterData) {
      toast.error('El email del padrino no existe en el sistema');
      setLoading(false);
      return;
    }

    // Check if there's already a pending invitation for this email
    const { data: existingPendingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('invitee_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPendingInvitation) {
      toast.error('Ya existe una solicitud pendiente para este email');
      setLoading(false);
      return;
    }

    // Create invitation request (user must wait for approval)
    // Note: Password will be set by the user after approval via password reset flow
    const { error: invitationError } = await supabase
      .from('invitations')
      .insert({
        inviter_id: inviterData.id,
        invitee_email: email,
        invitee_name: name,
        status: 'pending',
      });

    if (invitationError) {
      toast.error('Error al crear la solicitud de invitación');
      setLoading(false);
      return;
    }

    // Send notification email to godparent
    const { error: emailError } = await supabase.functions.invoke('send-invitation-notification', {
      body: {
        inviter_email: inviterEmail,
        inviter_name: inviterData.name || 'Usuario',
        invitee_name: name,
        invitee_email: email,
      },
    });

    if (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the registration if email fails
    }

    setInviterName(inviterData.name || 'tu padrino');
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
                Una vez aprobada, podrás iniciar sesión en TrusTicket.
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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
              Tu registro debe ser aprobado por tu padrino
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Solicitando registro...' : 'Solicitar registro'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
            <div className="pt-2 border-t">
              <span className="text-muted-foreground text-xs">Para pruebas: </span>
              <Link to="/create-test-user" className="text-primary hover:underline font-medium text-xs">
                Crear usuario padrino de prueba
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Register;
