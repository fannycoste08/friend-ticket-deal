import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Search, Ticket, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SaleRow {
  id: string;
  user_id: string;
  owner_name: string;
  owner_email: string;
  artist: string;
  venue: string;
  city: string;
  event_date: string;
  price: number;
  quantity: number;
  ticket_type: string;
  status: string;
  created_at: string;
}

interface WantedRow {
  id: string;
  user_id: string;
  seeker_name: string;
  seeker_email: string;
  artist: string;
  city: string;
  event_date: string;
  quantity: number;
  created_at: string;
}

const fmt = (d: string) => {
  try {
    return format(new Date(d), "d MMM yyyy", { locale: es });
  } catch {
    return d;
  }
};

const AdminTickets = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [wanted, setWanted] = useState<WantedRow[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'sale' | 'wanted'>('sale');
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, w] = await Promise.all([
        supabase.rpc('get_all_tickets_admin'),
        supabase.rpc('get_all_wanted_tickets_admin'),
      ]);
      if (s.error) console.error(s.error);
      if (w.error) console.error(w.error);
      setSales((s.data as SaleRow[]) ?? []);
      setWanted((w.data as WantedRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const q = query.trim().toLowerCase();

  const filteredSales = useMemo(
    () =>
      sales.filter(
        (t) =>
          (!onlyUpcoming || t.event_date >= today) &&
          (!q ||
            [t.artist, t.city, t.venue, t.owner_name, t.owner_email]
              .join(' ')
              .toLowerCase()
              .includes(q)),
      ),
    [sales, q, onlyUpcoming, today],
  );

  const filteredWanted = useMemo(
    () =>
      wanted.filter(
        (t) =>
          (!onlyUpcoming || t.event_date >= today) &&
          (!q ||
            [t.artist, t.city, t.seeker_name, t.seeker_email]
              .join(' ')
              .toLowerCase()
              .includes(q)),
      ),
    [wanted, q, onlyUpcoming, today],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando entradas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={view === 'sale' ? 'default' : 'outline'}
          onClick={() => setView('sale')}
          className="gap-1.5"
        >
          <Ticket className="w-4 h-4" />
          En venta ({filteredSales.length})
        </Button>
        <Button
          size="sm"
          variant={view === 'wanted' ? 'default' : 'outline'}
          onClick={() => setView('wanted')}
          className="gap-1.5"
        >
          <Heart className="w-4 h-4" />
          Se buscan ({filteredWanted.length})
        </Button>
        <Button
          size="sm"
          variant={onlyUpcoming ? 'default' : 'outline'}
          onClick={() => setOnlyUpcoming((v) => !v)}
        >
          Solo próximas
        </Button>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artista, ciudad o usuario"
            className="pl-8 h-9"
          />
        </div>
      </div>

      <Card className="overflow-x-auto">
        {view === 'sale' ? (
          <table className="w-full text-xs">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="p-2 font-medium">Artista</th>
                <th className="p-2 font-medium">Ciudad / Sala</th>
                <th className="p-2 font-medium">Fecha</th>
                <th className="p-2 font-medium">Precio</th>
                <th className="p-2 font-medium">Cant.</th>
                <th className="p-2 font-medium">Estado</th>
                <th className="p-2 font-medium">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-2 font-medium">{t.artist}</td>
                  <td className="p-2 text-muted-foreground">{t.city} · {t.venue}</td>
                  <td className="p-2">{fmt(t.event_date)}</td>
                  <td className="p-2">{t.price} €</td>
                  <td className="p-2">{t.quantity}</td>
                  <td className="p-2">
                    <Badge variant={t.status === 'sold' ? 'secondary' : 'outline'}>
                      {t.status === 'sold' ? 'Vendida' : 'Disponible'}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="truncate max-w-[180px]" title={t.owner_email}>
                      {t.owner_name}
                      <span className="block text-muted-foreground">{t.owner_email}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No hay entradas en venta con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="p-2 font-medium">Artista</th>
                <th className="p-2 font-medium">Ciudad</th>
                <th className="p-2 font-medium">Fecha</th>
                <th className="p-2 font-medium">Cant.</th>
                <th className="p-2 font-medium">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filteredWanted.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-2 font-medium">{t.artist}</td>
                  <td className="p-2 text-muted-foreground">{t.city}</td>
                  <td className="p-2">{fmt(t.event_date)}</td>
                  <td className="p-2">{t.quantity}</td>
                  <td className="p-2">
                    <div className="truncate max-w-[180px]" title={t.seeker_email}>
                      {t.seeker_name}
                      <span className="block text-muted-foreground">{t.seeker_email}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWanted.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No hay búsquedas con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default AdminTickets;
