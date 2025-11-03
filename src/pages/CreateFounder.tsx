import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CreateFounder = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

    try {
      // Try reset-founder first (deletes and recreates if exists)
      const { data, error } = await supabase.functions.invoke('reset-founder', {
        body: {
          email,
          password,
          name,
        },
      });

      if (error) {
        toast.error('Error al crear usuario fundador: ' + error.message);
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success('Usuario fundador creado. Ya puedes iniciar sesión.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-card)' }}>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Crear Usuario Fundador</CardTitle>
            <CardDescription>Usuario inicial sin necesidad de padrino</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
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
                placeholder="costefanny@gmail.com"
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
                minLength={6}
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
                minLength={6}
              />
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                ⚠️ Solo para uso administrativo
              </p>
              <p className="text-amber-600 dark:text-amber-300 text-xs">
                Si el email ya existe, será eliminado y recreado. El usuario podrá invitar a otros.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando usuario...' : 'Crear usuario fundador'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateFounder;
