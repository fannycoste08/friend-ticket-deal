import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface LaunchTask {
  id: string;
  section: string;
  task: string;
  note: string;
  done: boolean;
  sort_order: number;
}

const AdminLaunchTasks = () => {
  const [tasks, setTasks] = useState<LaunchTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('admin_launch_tasks')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setTasks(data as LaunchTask[]);
    setLoading(false);
  };

  const toggleDone = async (id: string, done: boolean) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done } : t)));
    const { error } = await supabase
      .from('admin_launch_tasks')
      .update({ done })
      .eq('id', id);
    if (error) {
      toast.error('No se pudo guardar el cambio');
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !done } : t)));
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, LaunchTask[]>();
    tasks.forEach(t => {
      if (!map.has(t.section)) map.set(t.section, []);
      map.get(t.section)!.push(t);
    });
    return Array.from(map.entries());
  }, [tasks]);

  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando tareas...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Tareas pre-lanzamiento</h3>
          </div>
          <Badge variant={doneCount === total ? 'default' : 'secondary'}>
            {doneCount}/{total} ({percent}%)
          </Badge>
        </div>
        <Progress value={percent} className="h-2" />
      </Card>

      {grouped.map(([section, items]) => {
        const sectionDone = items.filter(t => t.done).length;
        return (
          <Card key={section} className="overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
              <h4 className="font-medium text-sm">{section}</h4>
              <span className="text-xs text-muted-foreground">
                {sectionDone}/{items.length}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {items.map(t => (
                <li key={t.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={(checked) => toggleDone(t.id, checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>
                      {t.task}
                    </p>
                    {t.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{t.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminLaunchTasks;
