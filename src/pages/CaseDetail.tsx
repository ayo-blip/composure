import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileEdit, ArrowLeft, Plus, Calendar, Sparkles, X, MessageSquare, ClipboardList, FileText, ShieldAlert, ThumbsUp, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeCase {
  id: string;
  employee_name: string;
  department: string | null;
  status: 'active' | 'resolved';
  created_at: string;
}

interface Draft {
  id: string;
  title: string;
  scenarios: string[];
  tone: string;
  draft_message: string;
  talking_points: string;
  documentation_note: string;
  risk_check: string;
  risk_level: string;
  confidence_score: number;
  confidence_strengths: string[];
  confidence_suggestion: string | null;
  created_at: string;
}

const scenarioLabels: Record<string, string> = {
  'performance-concern': 'Performance Concern',
  'attendance-issue': 'Attendance Issue',
  'accommodation-request': 'Accommodation Request',
  'mental-health-disclosure': 'Mental Health Disclosure',
  'return-to-work': 'Return to Work',
  'leave-request': 'Leave Request',
  'conflict-resolution': 'Workplace Conflict',
  'policy-reminder': 'Policy Reminder',
  'check-in': 'Wellness Check-In',
  'probation-review': 'Probation Review',
  'termination': 'Employment Ending',
  'difficult-timing': 'Difficult Timing',
  'follow-up': 'Follow-Up After Meeting',
  'declining-request': 'Declining a Request',
  'resetting-expectations': 'Resetting Expectations',
};

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [caseData, setCaseData] = useState<EmployeeCase | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) fetchCase();
  }, [user, id]);

  const fetchCase = async () => {
    setIsLoading(true);
    const [{ data: c, error: cErr }, { data: d }] = await Promise.all([
      supabase.from('employee_cases').select('*').eq('id', id).single(),
      supabase.from('saved_drafts').select('*').eq('case_id', id).order('created_at', { ascending: true }),
    ]);

    if (cErr) {
      toast({ title: 'Case not found', variant: 'destructive' });
      navigate('/library');
      return;
    }
    setCaseData(c);
    setDrafts(d || []);
    setIsLoading(false);
  };

  const copyDraft = async (draft: Draft) => {
    await navigator.clipboard.writeText(draft.draft_message);
    toast({ title: 'Copied!', description: 'Draft message copied to clipboard.' });
  };

  const highestRisk = drafts.some(d => d.risk_level === 'High')
    ? 'High'
    : drafts.some(d => d.risk_level === 'Moderate')
    ? 'Moderate'
    : drafts.length > 0 ? 'Low' : null;

  const avgConfidence = drafts.length > 0
    ? (drafts.reduce((sum, d) => sum + d.confidence_score, 0) / drafts.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/library')} className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Case Timeline</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">

          {/* Case Header */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-1">{caseData.employee_name}</h2>
                {caseData.department && (
                  <p className="text-sm text-muted-foreground mb-1">{caseData.department}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  First draft {new Date(caseData.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="accent" size="sm" onClick={() => navigate('/')} className="gap-2">
                <Plus className="w-4 h-4" />
                New Draft
              </Button>
            </div>

            {drafts.length > 0 && (
              <div className="flex gap-8 mt-5 pt-5 border-t border-border">
                <div>
                  <p className="text-2xl font-bold text-foreground">{drafts.length}</p>
                  <p className="text-xs text-muted-foreground">Total drafts</p>
                </div>
                {highestRisk && (
                  <div>
                    <p className={`text-2xl font-bold ${
                      highestRisk === 'High' ? 'text-red-600 dark:text-red-400'
                      : highestRisk === 'Moderate' ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                    }`}>{highestRisk}</p>
                    <p className="text-xs text-muted-foreground">Highest risk</p>
                  </div>
                )}
                {avgConfidence && (
                  <div>
                    <p className="text-2xl font-bold text-foreground">{avgConfidence}</p>
                    <p className="text-xs text-muted-foreground">Avg score</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Communication Timeline</h3>

          {drafts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">No drafts linked to this case yet.</p>
              <Button variant="accent" size="sm" onClick={() => navigate('/')} className="gap-2">
                <Plus className="w-4 h-4" />
                Generate first draft
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div key={draft.id} className="relative pl-14">
                    <div className="absolute left-[13px] top-5 w-4 h-4 rounded-full bg-card border-2 border-primary" />
                    <button
                      onClick={() => setSelectedDraft(draft)}
                      className="w-full bg-card border border-border rounded-xl p-5 shadow-card hover:border-muted-foreground/30 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-foreground mb-1.5">{draft.title}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {draft.scenarios.map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                {scenarioLabels[s] || s}
                              </span>
                            ))}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                              {draft.tone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            draft.risk_level === 'High'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : draft.risk_level === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {draft.risk_level} risk
                          </span>
                          <span className="text-xs text-muted-foreground">{draft.confidence_score.toFixed(1)}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {draft.draft_message.substring(0, 180)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.created_at).toLocaleDateString('en-CA', { dateStyle: 'medium' })}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Full Draft Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-2xl my-8">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">{selectedDraft.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedDraft.scenarios.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {scenarioLabels[s] || s}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{selectedDraft.tone}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    selectedDraft.risk_level === 'High'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : selectedDraft.risk_level === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>{selectedDraft.risk_level} risk</span>
                </div>
              </div>
              <button onClick={() => setSelectedDraft(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors shrink-0">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {[
                { icon: <MessageSquare className="w-4 h-4" />, title: 'Draft Message', content: selectedDraft.draft_message },
                { icon: <ClipboardList className="w-4 h-4" />, title: 'Key Talking Points', content: selectedDraft.talking_points },
                { icon: <FileText className="w-4 h-4" />, title: 'Documentation Note', content: selectedDraft.documentation_note },
                { icon: <ShieldAlert className="w-4 h-4" />, title: 'Risk Assessment', content: selectedDraft.risk_check },
              ].map(section => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    {section.icon}
                    <span className="text-xs font-semibold uppercase tracking-wide">{section.title}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 rounded-xl p-4">
                    {section.content}
                  </p>
                </div>
              ))}

              <div>
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Confidence Score</span>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-3xl font-bold ${
                      selectedDraft.confidence_score >= 8 ? 'text-green-600 dark:text-green-400'
                      : selectedDraft.confidence_score >= 6.5 ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>{selectedDraft.confidence_score.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">/ 10</span>
                  </div>
                  {selectedDraft.confidence_strengths?.map((s, i) => (
                    <p key={i} className="text-sm text-foreground/80 flex items-center gap-2 mb-1">
                      <span className="text-green-500">✓</span>{s}
                    </p>
                  ))}
                  {selectedDraft.confidence_suggestion && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 pt-2 border-t border-border">
                      → {selectedDraft.confidence_suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="default" className="gap-2 flex-1" onClick={() => copyDraft(selectedDraft)}>
                <Copy className="w-4 h-4" />Copy Draft
              </Button>
              <Button variant="outline" onClick={() => setSelectedDraft(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
