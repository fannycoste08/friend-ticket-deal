import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminDoc {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const AdminDocs = () => {
  const [docs, setDocs] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const { data, error } = await supabase
      .from('admin_docs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error) {
      setDocs(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Rellena título y contenido', variant: 'destructive' });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('admin_docs')
        .update({ title: title.trim(), content: content.trim() })
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Error al actualizar', variant: 'destructive' });
        return;
      }
      toast({ title: 'Documento actualizado' });
    } else {
      const { error } = await supabase
        .from('admin_docs')
        .insert({ title: title.trim(), content: content.trim() });

      if (error) {
        toast({ title: 'Error al crear', variant: 'destructive' });
        return;
      }
      toast({ title: 'Documento creado' });
    }

    resetForm();
    loadDocs();
  };

  const handleEdit = (doc: AdminDoc) => {
    setEditingId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('admin_docs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    toast({ title: 'Documento eliminado' });
    loadDocs();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Documentación</h2>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <Input
            placeholder="Título del documento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Contenido..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm} className="gap-1">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Save className="w-4 h-4" />
              {editingId ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Cargando documentos...</p>
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No hay documentos todavía</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualizado: {formatDate(doc.updated_at)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(doc)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {doc.content}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDocs;
