import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, CalendarIcon, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WantedTicketFormProps {
  onSuccess?: () => void;
  editTicket?: {
    id: string;
    artist: string;
    city: string;
    event_date: string;
  };
}

const WantedTicketForm = ({ onSuccess, editTicket }: WantedTicketFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    artist: editTicket?.artist || '',
    city: editTicket?.city || '',
    event_date: editTicket?.event_date ? new Date(editTicket.event_date) : undefined as Date | undefined,
    email_notifications: true,
  });

  useEffect(() => {
    if (editTicket) {
      setOpen(true);
      setFormData({
        artist: editTicket.artist,
        city: editTicket.city,
        event_date: new Date(editTicket.event_date),
        email_notifications: true,
      });
    }
  }, [editTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    if (!formData.event_date) { toast.error('Debes seleccionar una fecha'); return; }
    setLoading(true);

    const ticketData = {
      artist: formData.artist,
      city: formData.city,
      event_date: format(formData.event_date, 'yyyy-MM-dd'),
      email_notifications: formData.email_notifications,
    };

    let error;
    if (editTicket) {
      const result = await supabase.from('wanted_tickets').update(ticketData).eq('id', editTicket.id);
      error = result.error;
    } else {
      const result = await supabase.from('wanted_tickets').insert({ ...ticketData, user_id: user.id });
      error = result.error;
    }

    if (error) {
      toast.error(editTicket ? 'Error al actualizar' : 'Error al publicar');
      console.error(error);
      setLoading(false);
      return;
    }

    toast.success(editTicket ? '¡Búsqueda actualizada!' : '¡Búsqueda publicada!');
    setFormData({ artist: '', city: '', event_date: undefined, email_notifications: true });
    setOpen(false);
    setLoading(false);
    onSuccess?.();
  };

  const handleChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editTicket && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Añadir búsqueda
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTicket ? 'Editar Búsqueda' : 'Nueva Búsqueda'}</DialogTitle>
          <DialogDescription>Indica qué entrada estás buscando</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="artist">Artista/Grupo *</Label>
            <Input id="artist" value={formData.artist} onChange={(e) => handleChange('artist', e.target.value)} placeholder="Ej: Bad Bunny" required className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <Input id="city" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Ej: Madrid" required className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Fecha del Concierto *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !formData.event_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.event_date ? format(formData.event_date, "d 'de' MMMM 'de' yyyy", { locale: es }) : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={formData.event_date} onSelect={(date) => handleChange('event_date', date)} disabled={(date) => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editTicket ? 'Actualizando...' : 'Publicando...') : (editTicket ? 'Actualizar' : 'Añadir búsqueda')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WantedTicketForm;
