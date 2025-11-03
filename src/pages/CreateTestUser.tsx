import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ticket } from 'lucide-react';

const CreateTestUser = () => {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const createTestUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-user');
      
      if (error) throw error;
      
      toast.success('Usuario de prueba creado correctamente');
      setCreated(true);
      console.log('Usuario creado:', data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al crear usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Crear Usuario de Prueba</CardTitle>
            <CardDescription>Para poder probar el sistema de registro</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!created ? (
            <>
              <div className="rounded-lg bg-secondary/50 p-4 text-sm space-y-2">
                <p className="font-medium">Se creará un usuario padrino con:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Email: <code className="text-foreground">padrino@test.com</code></li>
                  <li>Contraseña: <code className="text-foreground">test123</code></li>
                  <li>Nombre: Usuario Padrino</li>
                </ul>
              </div>
              <Button 
                onClick={createTestUser} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Usuario de Prueba'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm space-y-2">
                <p className="font-medium text-green-600 dark:text-green-400">✓ Usuario creado exitosamente</p>
                <p className="text-muted-foreground">Ahora puedes usar estos datos para registrar nuevos usuarios:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Email del padrino: <code className="text-foreground">padrino@test.com</code></li>
                </ul>
              </div>
              <Button 
                onClick={() => window.location.href = '/register'} 
                className="w-full"
              >
                Ir al Registro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTestUser;
