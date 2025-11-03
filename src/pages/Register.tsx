import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    // First, check if inviter exists
    const { data: inviterData, error: inviterError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', inviterEmail)
      .single();

    if (inviterError || !inviterData) {
      toast.error('El email del padrino no existe en el sistema');
      setLoading(false);
      return;
    }

    // Create the user
    const { data, error } = await signUp(name, email, password, inviterEmail);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email ya está registrado');
      } else {
        toast.error('Error al registrarse: ' + error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create invitation request
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          inviter_id: inviterData.id,
          invitee_email: email,
          invitee_name: name,
          invitee_password: password,
          status: 'pending',
        });

      if (invitationError) {
        toast.error('Error al crear la solicitud de invitación');
        setLoading(false);
        return;
      }

      // Send notification email to inviter
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

      toast.success('Registro solicitado. Espera la aprobación de tu padrino.');
      navigate('/login');
    }

    setLoading(false);
  };

  return (
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
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
