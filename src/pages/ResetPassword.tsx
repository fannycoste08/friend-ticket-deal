import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionValid(true);
          setCheckingSession(false);
          toast.success('Enlace verificado. Introduce tu nueva contraseña.');
        } else if (event === 'SIGNED_IN' && session) {
          setSessionValid(true);
          setCheckingSession(false);
        }
      }
    );

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
    
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  const heroSection = (
    <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
      <img 
        src={concertHero} 
        alt="Concierto con multitud" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-background/80" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
    </div>
  );

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {heroSection}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background">
          <div className="glass-strong rounded-2xl p-8 w-full max-w-md" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Verificando enlace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionValid || errorMessage) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="relative lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden">
          <img 
            src={concertHero} 
            alt="Concierto con multitud" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-transparent to-primary/10" />
          
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-12 lg:py-0">
            <div className="w-20 h-20 rounded-2xl bg-destructive/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Enlace no válido
            </h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background">
          <div className="w-full max-w-md glass-strong rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="space-y-4 text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Enlace expirado</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorMessage || 'El enlace de recuperación ha expirado o no es válido.'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Los enlaces de recuperación solo son válidos durante un tiempo limitado. 
                Por favor, solicita un nuevo enlace para restablecer tu contraseña.
              </p>
              <Button onClick={handleRequestNewLink} className="w-full gradient-primary border-0 hover:opacity-90">
                Solicitar nuevo enlace
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </div>
          </div>
        </div>
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
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-12 lg:py-0">
          <div className="w-20 h-20 rounded-2xl gradient-vibrant flex items-center justify-center mb-6 shadow-2xl">
            <Ticket className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nueva Contraseña
          </h1>
          
          <p className="text-muted-foreground text-sm lg:text-base max-w-md">
            Introduce tu nueva contraseña para acceder a TrusTicket
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background">
        <div className="w-full max-w-md glass-strong rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <div className="space-y-4 text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
              <Ticket className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Restablecer Contraseña</h2>
              <p className="text-sm text-muted-foreground mt-1">Introduce tu nueva contraseña</p>
            </div>
          </div>
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
                className="h-11 bg-secondary/50 border-border/50"
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
                className="h-11 bg-secondary/50 border-border/50"
              />
            </div>
            <Button type="submit" className="w-full h-11 gradient-primary border-0 hover:opacity-90" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
