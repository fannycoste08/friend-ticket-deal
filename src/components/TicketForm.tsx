import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TicketFormProps {
  onSuccess?: () => void;
  editTicket?: {
    id: string;
    artist: string;
    venue: string;
    city: string;
    event_date: string;
    ticket_type: string;
    price: number;
    quantity: number;
    description: string;
  };
}

const TicketForm = ({ onSuccess, editTicket }: TicketFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(!!editTicket);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    artist: editTicket?.artist || '',
    venue: editTicket?.venue || '',
    city: editTicket?.city || '',
    event_date: editTicket?.event_date ? new Date(editTicket.event_date) : undefined as Date | undefined,
    ticket_type: editTicket?.ticket_type || 'general',
    price: editTicket?.price?.toString() || '',
    quantity: editTicket?.quantity?.toString() || '1',
    description: editTicket?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para publicar una entrada');
      return;
    }

    if (!formData.event_date) {
      toast.error('Debes seleccionar una fecha');
      return;
    }

    setLoading(true);

    const ticketData = {
      artist: formData.artist,
      venue: formData.venue,
      city: formData.city,
      event_date: format(formData.event_date, 'yyyy-MM-dd'),
      ticket_type: formData.ticket_type,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      description: formData.description,
      status: 'available',
    };

    let error;

    if (editTicket) {
      // Actualizar entrada existente
      const result = await supabase
        .from('tickets')
        .update(ticketData)
        .eq('id', editTicket.id);
      error = result.error;
    } else {
      // Crear nueva entrada
      const result = await supabase
        .from('tickets')
        .insert({ ...ticketData, user_id: user.id });
      error = result.error;
    }

    if (error) {
      toast.error(editTicket ? 'Error al actualizar la entrada' : 'Error al publicar la entrada');
      console.error(error);
      setLoading(false);
      return;
    }

    toast.success(editTicket ? '¡Entrada actualizada con éxito!' : '¡Entrada publicada con éxito!');
    setFormData({
      artist: '',
      venue: '',
      city: '',
      event_date: undefined,
      ticket_type: 'general',
      price: '',
      quantity: '1',
      description: '',
    });
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
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Publicar Entrada
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTicket ? 'Editar Entrada' : 'Publicar Nueva Entrada'}</DialogTitle>
          <DialogDescription>
            Completa los detalles de la entrada que quieres vender
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="artist">Artista/Grupo *</Label>
            <Input
              id="artist"
              value={formData.artist}
              onChange={(e) => handleChange('artist', e.target.value)}
              placeholder="Ej: Bad Bunny"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Recinto *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="Ej: WiZink Center"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Madrid"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha del Concierto *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.event_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.event_date ? (
                    format(formData.event_date, "d 'de' MMMM 'de' yyyy", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.event_date}
                  onSelect={(date) => handleChange('event_date', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_type">Tipo de Entrada *</Label>
              <Select value={formData.ticket_type} onValueChange={(value) => handleChange('ticket_type', value)}>
                <SelectTrigger id="ticket_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="pista">Pista</SelectItem>
                  <SelectItem value="grada">Grada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="50.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Añade cualquier detalle adicional sobre las entradas..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editTicket ? 'Actualizando...' : 'Publicando...') : (editTicket ? 'Actualizar Entrada' : 'Publicar Entrada')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketForm;
