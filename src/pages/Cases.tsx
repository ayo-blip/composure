import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft, Plus, FolderOpen, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmployeeCase {
  id: string;
  employee_name: string;
  department: string | null;
  status: 'active' | 'resolved';
  created_at: string;
  updated_at: string;
  draft_count: number;
}

export default function Cases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();

  const [cases, setCases] = useState<EmployeeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDept, setNewCaseDept] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchCases();
  }, [user]);

  const fetchCases = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('employee_cases')
      .select('*, saved_drafts(count)')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading cases', description: error.message, variant: 'destructive' });
    } else {
      setCases(
        (data || []).map((c: any) => ({
          ...c,
          draft_count: c.saved_drafts?.[0]?.count ?? 0,
        }))
      );
    }
    setIsLoading(false);
  };

  const handleCreateCase = async () => {
    if (!newCaseName.trim() || !profile?.organisation_id || !user) return;
    setIsCreating(true);
    const { data, error } = await supabase
      .from('employee_cases')
      .insert({
        organisation_id: profile.organisation_id,
        created_by: user.id,
        employee_name: newCaseName.trim(),
        department: newCaseDept.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create case', description: error.message, variant: 'destructive' });
    } else {
      setShowCreateDialog(false);
      setNewCaseName('');
      setNewCaseDept('');
      navigate(`/cases/${data.id}`);
    }
    setIsCreating(false);
  };

  const filteredCases = cases.filter(c => filter === 'all' || c.status === filter);

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
              Compo<span className="text-accent">Sure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Employee Cases</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">Employee Cases</h2>
              <p className="text-muted-foreground text-sm">
                Build a documented record of every workplace situation — ready if you ever need it.
              </p>
            </div>
            <Button variant="accent" onClick={() => setShowCreateDialog(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              New Case
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'active', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No cases yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Create a case for an employee situation to start building a documented record.
              </p>
              <Button variant="accent" onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first case
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="w-full bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-colors text-left flex items-center gap-4 shadow-card"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    c.status === 'active'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {c.status === 'active'
                      ? <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      : <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground truncate">{c.employee_name}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'active'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {c.department && <span>{c.department}</span>}
                      <span>{c.draft_count} {c.draft_count === 1 ? 'draft' : 'drafts'}</span>
                      <span>Updated {new Date(c.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Employee Case</DialogTitle>
            <DialogDescription>
              Create a case to track all communications and documentation for this employee situation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="emp-name">Employee name or identifier</Label>
              <Input
                id="emp-name"
                placeholder="e.g., J. Smith or Employee #204"
                value={newCaseName}
                onChange={e => setNewCaseName(e.target.value)}
                className="mt-2"
                onKeyDown={e => e.key === 'Enter' && handleCreateCase()}
              />
            </div>
            <div>
              <Label htmlFor="emp-dept">
                Department <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="emp-dept"
                placeholder="e.g., Operations, Sales"
                value={newCaseDept}
                onChange={e => setNewCaseDept(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleCreateCase} disabled={!newCaseName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
