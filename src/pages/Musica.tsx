import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Music2 } from "lucide-react";

interface Concierto {
  fecha: string;
  artista: string;
  sala: string;
  precio: string;
}

const parseFecha = (s: string): Date | null => {
  if (!s) return null;
  // formats: dd/mm/yyyy, d/m/yyyy, yyyy-mm-dd
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
};

const formatFecha = (s: string) => {
  const d = parseFecha(s);
  if (!d) return s;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Musica = () => {
  const [conciertos, setConciertos] = useState<Concierto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-conciertos");
        if (error) throw error;
        const items = (data?.conciertos ?? []) as Concierto[];
        // Sort by date and filter past concerts
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sorted = items
          .filter((c) => {
            const d = parseFecha(c.fecha);
            return !d || d >= today;
          })
          .sort((a, b) => {
            const da = parseFecha(a.fecha)?.getTime() ?? 0;
            const db = parseFecha(b.fecha)?.getTime() ?? 0;
            return da - db;
          });
        setConciertos(sorted);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando conciertos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-vibrant mb-4">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 gradient-text">
          Música
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Conciertos seleccionados en Madrid y alrededores. Una agenda viva.
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[140px]">Fecha</TableHead>
              <TableHead>Artista</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead className="text-right w-[100px]">Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No se pudieron cargar los conciertos. Inténtalo más tarde.
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && conciertos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No hay conciertos próximos por ahora.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              conciertos.map((c, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="font-medium text-foreground whitespace-nowrap">
                    {formatFecha(c.fecha)}
                  </TableCell>
                  <TableCell className="text-foreground">{c.artista}</TableCell>
                  <TableCell className="text-muted-foreground">{c.sala}</TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                    {c.precio || "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Lista actualizada automáticamente desde Google Sheets.
      </p>
    </div>
  );
};

export default Musica;