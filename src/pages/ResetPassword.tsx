import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import concertHero from '@/assets/concert-hero.jpg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes, specifically PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event in ResetPassword:', event, session?.user?.email);
        
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the recovery link and token was valid
          setSessionValid(true);
          setCheckingSession(false);
          toast.success('Enlace verificado. Introduce tu nueva contraseña.');
        } else if (event === 'SIGNED_IN' && session) {
          // User might already have a session from recovery
          setSessionValid(true);
          setCheckingSession(false);
        }
      }
    );

    // Check if there's already a valid session (user might have refreshed)
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setErrorMessage('Error al verificar la sesión. Por favor, solicita un nuevo enlace.');
          setCheckingSession(false);
          return;
        }

        if (session) {
          setSessionValid(true);
        } else {
          // No session - the recovery link might be invalid or expired
          // Wait a bit for the auth state change to fire
          setTimeout(() => {
            setCheckingSession(false);
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setCheckingSession(false);
      }
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  // After checking is done, if still no valid session, show error
  useEffect(() => {
    if (!checkingSession && !sessionValid && !errorMessage) {
      setErrorMessage('El enlace ha expirado o no es válido. Por favor, solicita un nuevo enlace de recuperación.');
    }
  }, [checkingSession, sessionValid, errorMessage]);

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

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar contraseña: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Contraseña actualizada correctamente');
    
    // Sign out and redirect to login
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
          <img 
            src={concertHero} 
            alt="Concierto con multitud" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70" />
        </div>
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/30">
          <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Verificando enlace...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state - invalid or expired link
  if (!sessionValid || errorMessage) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
          <img 
            src={concertHero} 
            alt="Concierto con multitud" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70" />
          
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-12 lg:py-0">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Enlace no válido
            </h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/30">
          <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl">Enlace expirado</CardTitle>
                <CardDescription className="mt-2">
                  {errorMessage || 'El enlace de recuperación ha expirado o no es válido.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Los enlaces de recuperación solo son válidos durante un tiempo limitado. 
                Por favor, solicita un nuevo enlace para restablecer tu contraseña.
              </p>
              <Button onClick={handleRequestNewLink} className="w-full">
                Solicitar nuevo enlace
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Valid session - show password reset form
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
            Nueva Contraseña
          </h1>
          
          <p className="text-white/90 text-sm lg:text-base max-w-md drop-shadow">
            Introduce tu nueva contraseña para acceder a TrusTicket
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
              <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
              <CardDescription>Introduce tu nueva contraseña</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
