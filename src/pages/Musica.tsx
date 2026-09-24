import { useEffect, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Music2, RefreshCw, Disc3, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Concierto {
  fecha: string;
  artista: string;
  sala: string;
  precio: string;
  ciudad?: string;
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

const formatFechaCorta = (s: string) => {
  const d = parseFecha(s);
  if (!d) return s;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
};

interface Disco {
  fecha: string;
  artista: string;
  disco: string;
  sello: string;
  formato: string;
}

const PAGE_SIZE = 15;
const DISCOS_STEP = 12;

const formatFechaGrupo = (s: string) => {
  const d = parseFecha(s);
  if (!d) return s;
  const txt = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const Musica = () => {
  const [discos, setDiscos] = useState<Disco[]>([]);
  const [discosLoading, setDiscosLoading] = useState(true);
  const [discosError, setDiscosError] = useState(false);
  const [discosTab, setDiscosTab] = useState<"proximos" | "recientes">("proximos");
  const [discosVisibles, setDiscosVisibles] = useState(DISCOS_STEP);
  const [page, setPage] = useState(1);
  const agendaRef = useRef<HTMLDivElement>(null);

  const loadDiscos = async () => {
    try {
      setDiscosError(false);
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-discos?ts=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store", headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDiscos((data?.discos ?? []) as Disco[]);
    } catch {
      setDiscosError(true);
    } finally {
      setDiscosLoading(false);
    }
  };

  const [conciertos, setConciertos] = useState<Concierto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ciudadFiltro, setCiudadFiltro] = useState<string>("todas");

  const load = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-conciertos?ts=${Date.now()}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const headerLabels = new Set(["fecha", "artista", "concierto", "sala", "precio"]);
      const items = ((data?.conciertos ?? []) as Concierto[]).filter((c) => {
        const vals = [c.fecha, c.artista, c.sala].map((v) => (v ?? "").toString().trim().toLowerCase());
        return vals.every((v) => !headerLabels.has(v));
      });
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    loadDiscos();
    // Auto-refresh when the user returns to the tab (at most once per minute)
    let lastLoad = Date.now();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad > 60_000) {
        lastLoad = Date.now();
        load();
        loadDiscos();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const ciudades = Array.from(
    new Set(conciertos.map((c) => (c.ciudad || "Madrid").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const conciertosFiltrados =
    ciudadFiltro === "todas"
      ? conciertos
      : conciertos.filter((c) => (c.ciudad || "Madrid") === ciudadFiltro);

  const totalPages = Math.max(1, Math.ceil(conciertosFiltrados.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const conciertosPagina = conciertosFiltrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    agendaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageNumbers = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const nums = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    nums.forEach((n, i) => {
      if (i > 0 && n - (nums[i - 1] as number) > 1) out.push("…");
      out.push(n);
    });
    return out;
  };

  // Discos: recientes (últimos 14 días) y próximos
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hace14 = new Date(hoy);
  hace14.setDate(hace14.getDate() - 14);
  const discosConFecha = discos.map((d) => ({ ...d, _t: parseFecha(d.fecha)?.getTime() ?? null }));
  const proximos = discosConFecha.filter((d) => d._t === null || d._t >= hoy.getTime()).sort((a, b) => (a._t ?? Infinity) - (b._t ?? Infinity));
  const recientes = discosConFecha
    .filter((d) => d._t !== null && d._t < hoy.getTime() && d._t >= hace14.getTime())
    .sort((a, b) => (b._t ?? 0) - (a._t ?? 0));
  const tabEfectiva = discosTab === "proximos" && proximos.length === 0 && recientes.length > 0 ? "recientes" : discosTab;
  const listaDiscos = tabEfectiva === "proximos" ? proximos : recientes;
  const discosMostrados = listaDiscos.slice(0, discosVisibles);
  const grupos: { fecha: string; items: Disco[] }[] = [];
  discosMostrados.forEach((d) => {
    const last = grupos[grupos.length - 1];
    if (last && last.fecha === d.fecha) last.items.push(d);
    else grupos.push({ fecha: d.fecha, items: [d] });
  });

  const tituloAgenda =
    ciudadFiltro === "todas" ? "Agenda de conciertos en Madrid y Barcelona" : `Agenda de conciertos en ${ciudadFiltro}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-vibrant mb-4">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 gradient-text">Música</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Todo lo que le gusta a la gente de Trusticket</p>
      </div>

      <nav className="sticky top-16 z-20 mb-10 flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-border/40 bg-background/80 p-2 shadow-lg backdrop-blur">
          {[
            { id: "playlist", label: "Playlist", icon: Music2 },
            { id: "conciertos", label: "Conciertos", icon: CalendarDays },
            { id: "discos", label: "Discos", icon: Disc3 },
          ].map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/70 hover:bg-primary/30 hover:shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
            >
              <l.icon className="h-4 w-4 text-primary" />
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Playlist del mes */}
      <section id="playlist" className="mb-12 md:mb-16 scroll-mt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center rounded-2xl border border-border/40 bg-card/50 p-6 md:p-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 gradient-text">La playlist del mes</h2>
            <p className="text-muted-foreground">Lo que está sonando en Trusticket ahora mismo.</p>
          </div>
          <div className="rounded-xl overflow-hidden">
            <iframe
              title="Playlist del mes en Spotify"
              src="https://open.spotify.com/embed/playlist/75uSQykcs9YaxFkEryVKOS?utm_source=generator"
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
            />
          </div>
        </div>
      </section>

      {/* Conciertos */}
      <section id="conciertos" ref={agendaRef} className="mb-12 md:mb-16 scroll-mt-32">
        <div className="flex flex-col gap-4 mb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{tituloAgenda}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Seleccionados con amor por Trusticket aunque no significa que haya entradas a la venta en esta página.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            aria-label="Actualizar conciertos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {ciudades.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {["todas", ...ciudades].map((c) => (
              <Button
                key={c}
                variant={ciudadFiltro === c ? "default" : "outline"}
                size="sm"
                onClick={() => { setCiudadFiltro(c); setPage(1); }}
                className="rounded-full"
              >
                {c === "todas" ? "Todas" : c}
              </Button>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
          <Table className="table-fixed md:table-auto">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[68px] px-2 md:w-[160px] md:px-4">Fecha</TableHead>
                <TableHead className="px-2 md:px-4">Artista</TableHead>
                <TableHead className="hidden md:table-cell">Sala</TableHead>
                {ciudadFiltro === "todas" && <TableHead className="hidden md:table-cell w-[110px]">Ciudad</TableHead>}
                <TableHead className="w-[68px] px-2 text-right md:w-[120px] md:px-4">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="px-2 md:px-4">
                      <Skeleton className="h-4 w-16 md:w-24" />
                    </TableCell>
                    <TableCell className="min-w-0 px-2 md:px-4">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    {ciudadFiltro === "todas" && (
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    )}
                    <TableCell className="px-2 text-right md:px-4">
                      <Skeleton className="h-4 w-14 md:w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={ciudadFiltro === "todas" ? 5 : 4} className="text-center text-muted-foreground py-10">
                    No se pudieron cargar los conciertos. Inténtalo más tarde.
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && conciertosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={ciudadFiltro === "todas" ? 5 : 4} className="text-center text-muted-foreground py-10">
                    No hay conciertos disponibles.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                conciertosPagina.map((c, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="px-2 font-medium text-foreground whitespace-nowrap md:px-4">
                      <span className="md:hidden">{formatFechaCorta(c.fecha)}</span>
                      <span className="hidden md:inline">{formatFecha(c.fecha)}</span>
                    </TableCell>
                    <TableCell className="min-w-0 px-2 text-foreground md:px-4">
                      <div className="min-w-0 md:hidden">
                        {ciudadFiltro === "todas" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 mb-1">
                            {c.ciudad || "Madrid"}
                          </Badge>
                        )}
                        <div className="break-words text-sm leading-tight">{c.artista}</div>
                        <div className="mt-0.5 break-words text-xs leading-tight text-muted-foreground">{c.sala}</div>
                      </div>
                      <div className="hidden md:block">{c.artista}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.sala}</TableCell>
                    {ciudadFiltro === "todas" && (
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {c.ciudad || "Madrid"}
                      </TableCell>
                    )}
                    <TableCell className="px-2 text-right text-xs text-muted-foreground whitespace-nowrap md:px-4 md:text-sm">
                      {c.precio || "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {!loading && !error && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} aria-label="Página anterior">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            {pageNumbers().map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={n}
                  variant={n === currentPage ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(n)}
                >
                  {n}
                </Button>
              ),
            )}
            <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} aria-label="Página siguiente">
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>

      {/* Lanzamientos de discos */}
      <section id="discos" className="scroll-mt-32">
        <div className="mb-5">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Lanzamientos de discos</h2>
          <p className="text-muted-foreground text-sm mt-1">Lo que acaba de salir y lo que está por llegar.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {([
            { id: "proximos", label: `Próximos (${proximos.length})` },
            { id: "recientes", label: `Recién salidos (${recientes.length})` },
          ] as const).map((t) => (
            <Button
              key={t.id}
              variant={tabEfectiva === t.id ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => { setDiscosTab(t.id); setDiscosVisibles(DISCOS_STEP); }}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {discosLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        )}

        {!discosLoading && discosError && (
          <p className="text-center text-muted-foreground py-10">No se pudieron cargar los lanzamientos. Inténtalo más tarde.</p>
        )}

        {!discosLoading && !discosError && listaDiscos.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No hay lanzamientos en esta sección.</p>
        )}

        {!discosLoading && !discosError && grupos.length > 0 && (
          <div className="space-y-6">
            {grupos.map((g, gi) => (
              <div key={`${g.fecha}-${gi}`}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{formatFechaGrupo(g.fecha)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {g.items.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/50 p-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Disc3 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground leading-tight break-words">{d.artista}</div>
                        <div className="text-sm text-foreground/80 leading-tight break-words mt-0.5">{d.disco}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {d.formato && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{d.formato}</Badge>}
                          {d.sello && <span className="text-xs text-muted-foreground break-words">{d.sello}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!discosLoading && !discosError && listaDiscos.length > discosVisibles && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="rounded-full" onClick={() => setDiscosVisibles((v) => v + DISCOS_STEP)}>
              Ver más
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Musica;
