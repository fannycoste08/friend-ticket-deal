import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Trash2, Send, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OutreachRow {
  id: string;
  name: string;
  email: string;
  written: boolean;
  replied: boolean;
  mvp: boolean;
  comments: string;
  created_at: string;
}

type SortKey = 'written' | 'replied' | 'mvp' | null;
type SortDir = 'asc' | 'desc';

const AdminOutreach = () => {
  const [rows, setRows] = useState<OutreachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const loadRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_outreach')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error) setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRows(); }, [loadRows]);

  const addRow = async () => {
    const { error } = await supabase
      .from('admin_outreach')
      .insert({ name: '', email: '', comments: '' });

    if (error) {
      toast({ title: 'Error al añadir fila', variant: 'destructive' });
      return;
    }
    loadRows();
  };

  const updateField = async (id: string, field: string, value: string | boolean) => {
    const { error } = await supabase
      .from('admin_outreach')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
      return;
    }

    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase
      .from('admin_outreach')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey] ? 1 : 0;
      const vb = b[sortKey] ? 1 : 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const writtenCount = rows.filter(r => r.written).length;
  const repliedCount = rows.filter(r => r.replied).length;
  const mvpCount = rows.filter(r => r.mvp).length;

  const SortIcon = ({ k }: { k: Exclude<SortKey, null> }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Outreach</h2>
        </div>
        <Button size="sm" onClick={addRow} className="gap-1">
          <Plus className="w-4 h-4" />
          Añadir
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nombre</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="text-center w-[90px]">
                  <button
                    type="button"
                    onClick={() => toggleSort('written')}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                  >
                    Escrito
                    <SortIcon k="written" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[100px]">
                  <button
                    type="button"
                    onClick={() => toggleSort('replied')}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                  >
                    Contestado
                    <SortIcon k="replied" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[70px]">
                  <button
                    type="button"
                    onClick={() => toggleSort('mvp')}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
                  >
                    MVP
                    <SortIcon k="mvp" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[200px]">Comentarios</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : sortedRows.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay contactos todavía. Pulsa "Añadir" para empezar.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="p-2">
                      <Input
                        value={row.name}
                        placeholder="Nombre"
                        className="h-8 text-sm"
                        onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, name: e.target.value } : r))}
                        onBlur={(e) => updateField(row.id, 'name', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        value={row.email}
                        placeholder="email@ejemplo.com"
                        type="email"
                        className="h-8 text-sm"
                        onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, email: e.target.value } : r))}
                        onBlur={(e) => updateField(row.id, 'email', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={row.written}
                        onCheckedChange={(checked) => updateField(row.id, 'written', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={row.replied}
                        onCheckedChange={(checked) => updateField(row.id, 'replied', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={row.mvp}
                        onCheckedChange={(checked) => updateField(row.id, 'mvp', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        value={row.comments}
                        placeholder="Comentarios..."
                        className="h-8 text-sm"
                        onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, comments: e.target.value } : r))}
                        onBlur={(e) => updateField(row.id, 'comments', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRow(row.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && rows.length > 0 && (
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell className="p-2 text-sm text-muted-foreground" colSpan={2}>
                    Totales ({rows.length})
                  </TableCell>
                  <TableCell className="p-2 text-center text-sm">{writtenCount}</TableCell>
                  <TableCell className="p-2 text-center text-sm">{repliedCount}</TableCell>
                  <TableCell className="p-2 text-center text-sm">{mvpCount}</TableCell>
                  <TableCell className="p-2" colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {writtenCount}/{rows.length} escritos · {repliedCount}/{rows.length} contestados · {mvpCount}/{rows.length} MVP
        </p>
      )}
    </div>
  );
};

export default AdminOutreach;
