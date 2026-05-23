import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft, FolderOpen, ChevronRight, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeFile {
  id: string;
  employee_name: string;
  created_at: string;
  updated_at: string;
  draft_count: number;
}

export default function Cases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [files, setFiles] = useState<EmployeeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('employee_cases')
      .select('*, saved_drafts(count)')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading files', description: error.message, variant: 'destructive' });
    } else {
      setFiles(
        (data || []).map((c: any) => ({
          id: c.id,
          employee_name: c.employee_name,
          created_at: c.created_at,
          updated_at: c.updated_at,
          draft_count: c.saved_drafts?.[0]?.count ?? 0,
        }))
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">People</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">People</h2>
            <p className="text-muted-foreground text-sm">
              All your draft history, organised by employee. Start a draft on the home page and add a name to build the record automatically.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No files yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                When you save a draft with an employee name, it will appear here automatically.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm font-medium text-accent hover:underline"
              >
                Generate a draft →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(f => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/cases/${f.id}`)}
                  className="w-full bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-colors text-left flex items-center gap-4 shadow-card"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate mb-0.5">{f.employee_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{f.draft_count} {f.draft_count === 1 ? 'draft' : 'drafts'}</span>
                      <span>Last updated {new Date(f.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
