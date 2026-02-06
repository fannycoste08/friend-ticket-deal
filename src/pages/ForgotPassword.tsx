import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import concertHero from '@/assets/concert-hero.jpg';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error: checkError } = await supabase.functions.invoke('check-email-exists', {
        body: { email: normalizedEmail }
      });

      if (checkError) {
        console.error('Error checking email:', checkError);
        toast.error('Error al verificar el email. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      if (!data?.exists) {
        toast.error('Este email no está registrado en la plataforma.');
        setLoading(false);
        return;
      }

      const { error } = await resetPassword(normalizedEmail);

      if (error) {
        toast.error('Error al enviar el email: ' + error.message);
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success('Email enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al procesar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
            ¿Olvidaste tu contraseña?
          </h1>
          
          <p className="text-muted-foreground text-sm lg:text-base max-w-md">
            No te preocupes, te enviaremos instrucciones para recuperarla
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
              <h2 className="text-2xl font-bold text-foreground">Recuperar Contraseña</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {emailSent 
                  ? 'Hemos enviado un email con las instrucciones'
                  : 'Introduce tu email para recuperar tu contraseña'
                }
              </p>
            </div>
          </div>
          
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-secondary/50 border-border/50"
                />
              </div>
              <Button type="submit" className="w-full h-11 gradient-primary border-0 hover:opacity-90" disabled={loading}>
                {loading ? 'Verificando...' : 'Enviar instrucciones'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-sm">
                <p className="text-accent">
                  ✓ Revisa tu email ({email}) y sigue las instrucciones para restablecer tu contraseña.
                </p>
              </div>
              <Button 
                onClick={() => setEmailSent(false)} 
                variant="outline"
                className="w-full"
              >
                Enviar de nuevo
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
