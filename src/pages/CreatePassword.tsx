import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import concertHero from '@/assets/concert-hero.jpg';
import { supabase } from '@/integrations/supabase/client';

const CreatePassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviterEmail, setInviterEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authenticating, setAuthenticating] = useState(true);

  useEffect(() => {
    // Wait for auth state to settle and get current user
    const checkAuth = async () => {
      console.log('CreatePassword: Checking authentication...');
      
      // Wait a moment for the recovery link to authenticate the user
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('CreatePassword: User data:', user?.email, 'Error:', error);
      
      if (user?.email) {
        setUserEmail(user.email);
        console.log('CreatePassword: User authenticated:', user.email);
      } else {
        console.error('CreatePassword: No user found, redirecting to login');
        toast.error('Sesión no válida. Por favor, solicita un nuevo link a tu padrino.');
        setTimeout(() => navigate('/login'), 2000);
      }
      
      setAuthenticating(false);
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Strong password validation
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('La contraseña debe contener al menos una mayúscula');
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error('La contraseña debe contener al menos una minúscula');
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error('La contraseña debe contener al menos un número');
      return;
    }

    if (!inviterEmail.trim()) {
      toast.error('Por favor, introduce el email de tu padrino');
      return;
    }

    setLoading(true);

    try {
      // Verify inviter email matches the invitation
      const { data: invitations, error: invitationError } = await supabase
        .from('invitations')
        .select(`
          *,
          profiles!invitations_inviter_id_fkey(email)
        `)
        .eq('invitee_email', userEmail.toLowerCase())
        .eq('status', 'approved');

      if (invitationError) {
        console.error('Error fetching invitation:', invitationError);
        toast.error('Error al verificar la invitación');
        setLoading(false);
        return;
      }

      if (!invitations || invitations.length === 0) {
        toast.error('No se encontró una invitación aprobada para tu email');
        setLoading(false);
        return;
      }

      // Check if the provided inviter email matches any invitation
      const matchingInvitation = invitations.find(
        inv => inv.profiles?.email?.toLowerCase() === inviterEmail.toLowerCase()
      );

      if (!matchingInvitation) {
        toast.error('El email del padrino no coincide con tu invitación');
        setLoading(false);
        return;
      }

      // Update password
      const { error } = await updatePassword(password);

      if (error) {
        toast.error('Error al crear contraseña: ' + error.message);
        setLoading(false);
        return;
      }

      toast.success('¡Contraseña creada correctamente! Ya puedes iniciar sesión');
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado al crear la contraseña');
      setLoading(false);
    }
  };

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Verificando tu identidad...</h2>
                <p className="text-sm text-muted-foreground">Por favor espera un momento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
        <img 
          src={concertHero} 
          alt="Concierto con multitud" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-12 lg:py-0">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
            <Ticket className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            ¡Bienvenido a TrusTicket!
          </h1>
          
          <p className="text-white/90 text-sm lg:text-base max-w-md drop-shadow">
            Tu invitación ha sido aprobada. Crea tu contraseña para empezar
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/30">
        <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Ticket className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Crear Contraseña</CardTitle>
              <CardDescription>Configura tu contraseña para acceder a tu cuenta</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviterEmail">Email de tu Padrino</Label>
                <Input
                  id="inviterEmail"
                  type="email"
                  value={inviterEmail}
                  onChange={(e) => setInviterEmail(e.target.value)}
                  placeholder="padrino@ejemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Email de la persona que aprobó tu invitación
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Repetir Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando contraseña...' : 'Crear contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePassword;
