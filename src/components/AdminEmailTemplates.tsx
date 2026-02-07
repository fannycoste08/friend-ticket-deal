import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Edit2, Save, X, Eye, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  variables: Array<{ name: string; description: string }>;
  updated_at: string;
}

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Error al cargar las plantillas');
      console.error(error);
    } else {
      setTemplates((data || []).map((t) => ({
        ...t,
        description: t.description ?? null,
        variables: (t.variables as unknown as Array<{ name: string; description: string }>) || [],
      })));
    }
    setLoading(false);
  };

  const startEditing = (template: EmailTemplate) => {
    setEditingId(template.id);
    setEditSubject(template.subject);
    setEditHtml(template.html_content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditSubject('');
    setEditHtml('');
  };

  const saveTemplate = async (id: string) => {
    if (!editSubject.trim() || !editHtml.trim()) {
      toast.error('El asunto y el contenido son obligatorios');
      return;
    }

    const { error } = await supabase
      .from('email_templates')
      .update({
        subject: editSubject.trim(),
        html_content: editHtml.trim(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Error al guardar la plantilla');
      console.error(error);
    } else {
      toast.success('Plantilla actualizada correctamente');
      setEditingId(null);
      loadTemplates();
    }
  };

  const getPreviewHtml = (template: EmailTemplate) => {
    let html = template.html_content;
    // Replace variables with example values for preview
    for (const v of template.variables) {
      const pattern = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g');
      html = html.replace(pattern, `[${v.description}]`);
    }
    return html;
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

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando plantillas de email...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <Info className="w-4 h-4 shrink-0" />
        <p>
          Edita el asunto y contenido HTML de cada email. Usa <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">{"{{variable}}"}</code> para datos dinámicos.
          Los cambios se aplican inmediatamente a los próximos envíos.
        </p>
      </div>

      {templates.map((template) => (
        <Card key={template.id} className="overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{template.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{template.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {formatDate(template.updated_at)}
              </span>
              {expandedId === template.id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Expanded content */}
          {expandedId === template.id && (
            <div className="px-4 pb-4 border-t border-border space-y-4 pt-4">
              {/* Variables info */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v) => (
                    <Badge
                      key={v.name}
                      variant="secondary"
                      className="text-xs font-mono"
                      title={v.description}
                    >
                      {`{{${v.name}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {editingId === template.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Asunto</label>
                    <Input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Asunto del email"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Contenido HTML
                    </label>
                    <Textarea
                      value={editHtml}
                      onChange={(e) => setEditHtml(e.target.value)}
                      className="min-h-[300px] font-mono text-xs"
                      placeholder="Contenido HTML del email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveTemplate(template.id)} className="gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Asunto:</p>
                    <p className="text-sm bg-muted/50 px-3 py-2 rounded-md font-mono">{template.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(template)}
                      className="gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                      className="gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Vista previa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay plantillas de email configuradas
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista previa: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="flex-1 overflow-auto rounded-lg border border-border">
              <iframe
                srcDoc={getPreviewHtml(previewTemplate)}
                className="w-full min-h-[500px] bg-white rounded-lg"
                title="Email preview"
                sandbox=""
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTemplates;
