import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileEdit, ArrowLeft, Search, Star, Trash2, Copy, Calendar, Filter, BookOpen, ChevronRight, MessageSquare, ClipboardList, FileText, ShieldAlert, ThumbsUp, X, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavedDraft {
  id: string;
  title: string;
  scenarios: string[];
  tone: string;
  sector: string;
  context: string | null;
  draft_message: string;
  talking_points: string;
  documentation_note: string;
  risk_check: string;
  risk_level: string;
  confidence_score: number;
  confidence_strengths: string[];
  confidence_suggestion: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  case_id: string | null;
  employee_cases: { employee_name: string } | null;
}

const scenarioLabels: Record<string, string> = {
  "performance-concern": "Performance Concern",
  "attendance-issue": "Attendance Issue",
  "accommodation-request": "Accommodation Request",
  "mental-health-disclosure": "Mental Health Disclosure",
  "return-to-work": "Return to Work",
  "leave-request": "Leave Request",
  "conflict-resolution": "Workplace Conflict",
  "policy-reminder": "Policy Reminder",
  "check-in": "Wellness Check-In",
  "probation-review": "Probation Review",
  "termination": "Employment Ending",
  "difficult-timing": "Difficult Timing",
  "follow-up": "Follow-Up After Meeting",
  "declining-request": "Declining a Request",
  "resetting-expectations": "Resetting Expectations",
};

export default function Library() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();
  
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorites, setFilterFavorites] = useState<string>("all");
  const [selectedDraft, setSelectedDraft] = useState<SavedDraft | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ draftId: string } | null>(null);
  const [linkName, setLinkName] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("saved_drafts")
      .select("*, employee_cases(employee_name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading drafts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDrafts(data || []);
    }
    setIsLoading(false);
  };

  const toggleFavorite = async (draft: SavedDraft) => {
    const { error } = await supabase
      .from("saved_drafts")
      .update({ is_favorite: !draft.is_favorite })
      .eq("id", draft.id);

    if (error) {
      toast({
        title: "Error updating draft",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDrafts(drafts.map(d => 
        d.id === draft.id ? { ...d, is_favorite: !d.is_favorite } : d
      ));
    }
  };

  const deleteDraft = async (id: string) => {
    const { error } = await supabase
      .from("saved_drafts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting draft",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDrafts(drafts.filter(d => d.id !== id));
      toast({
        title: "Draft deleted",
        description: "The draft has been removed from your library.",
      });
    }
  };

  const copyDraft = async (draft: SavedDraft) => {
    await navigator.clipboard.writeText(draft.draft_message);
    toast({
      title: "Copied!",
      description: "Draft message copied to clipboard.",
    });
  };

  const handleLinkEmployee = async () => {
    if (!linkDialog || !linkName.trim() || !profile?.organisation_id || !user) return;
    setIsLinking(true);
    try {
      const { data: existing } = await supabase
        .from('employee_cases')
        .select('id')
        .eq('organisation_id', profile.organisation_id)
        .ilike('employee_name', linkName.trim())
        .maybeSingle();

      let caseId = existing?.id;
      if (!caseId) {
        const { data: created } = await supabase
          .from('employee_cases')
          .insert({ organisation_id: profile.organisation_id, created_by: user.id, employee_name: linkName.trim() })
          .select('id')
          .single();
        caseId = created?.id;
      }

      if (!caseId) return;

      const { error } = await supabase
        .from('saved_drafts')
        .update({ case_id: caseId })
        .eq('id', linkDialog.draftId);

      if (!error) {
        await supabase.from('employee_cases').update({ updated_at: new Date().toISOString() }).eq('id', caseId);
        const name = linkName.trim();
        setDrafts(prev => prev.map(d =>
          d.id === linkDialog.draftId ? { ...d, case_id: caseId, employee_cases: { employee_name: name } } : d
        ));
        if (selectedDraft?.id === linkDialog.draftId) {
          setSelectedDraft(prev => prev ? { ...prev, case_id: caseId, employee_cases: { employee_name: name } } : null);
        }
        toast({ title: `Linked to ${name}'s file` });
        setLinkDialog(null);
        setLinkName('');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = 
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.draft_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.scenarios.some(s => scenarioLabels[s]?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorite = 
      filterFavorites === "all" || 
      (filterFavorites === "favorites" && draft.is_favorite);
    
    return matchesSearch && matchesFavorite;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Your saved drafts</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">
              Draft Library
            </h2>
            <p className="text-muted-foreground">
              {drafts.length} saved {drafts.length === 1 ? "draft" : "drafts"}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterFavorites} onValueChange={setFilterFavorites}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drafts</SelectItem>
                <SelectItem value="favorites">Favorites only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drafts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              {searchQuery || filterFavorites !== "all" ? (
                <>
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">No drafts match your filters</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Your library is empty</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Generate a draft and click Save to build your library of reusable workplace communications.
                  </p>
                  <Button onClick={() => navigate("/")} variant="accent">
                    Generate your first draft
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
            <div className="space-y-4">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-card rounded-xl border border-border shadow-card p-5 hover:border-muted-foreground/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    {/* Clickable content area */}
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setSelectedDraft(draft)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-semibold text-foreground truncate">{draft.title}</h3>
                        {draft.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {draft.scenarios.map((scenario) => (
                          <span key={scenario} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                            {scenarioLabels[scenario] || scenario}
                          </span>
                        ))}
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{draft.tone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.created_at).toLocaleDateString()}
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          draft.risk_level === "High"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : draft.risk_level === "Moderate"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`}>{draft.risk_level} risk</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleFavorite(draft)} className="h-8 w-8">
                        <Star className={`w-4 h-4 ${draft.is_favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyDraft(draft)} className="h-8 w-8">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{draft.title}" from your library. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDraft(draft.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedDraft(draft)} className="h-8 w-8">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 cursor-pointer" onClick={() => setSelectedDraft(draft)}>
                    {draft.draft_message.substring(0, 200)}...
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    {draft.employee_cases ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserRound className="w-3 h-3" />
                        <span>{draft.employee_cases.employee_name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setLinkDialog({ draftId: draft.id }); setLinkName(''); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <UserRound className="w-3 h-3" />
                        Add to employee file
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Full Draft Modal */}
            {selectedDraft && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
                <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-2xl my-8">
                  {/* Modal Header */}
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
                          selectedDraft.risk_level === "High"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : selectedDraft.risk_level === "Moderate"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`}>{selectedDraft.risk_level} risk</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDraft(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors shrink-0">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    {[
                      { icon: <MessageSquare className="w-4 h-4" />, title: "Draft Message", content: selectedDraft.draft_message },
                      { icon: <ClipboardList className="w-4 h-4" />, title: "Key Talking Points", content: selectedDraft.talking_points },
                      { icon: <FileText className="w-4 h-4" />, title: "Documentation Note", content: selectedDraft.documentation_note },
                      { icon: <ShieldAlert className="w-4 h-4" />, title: "Risk Assessment", content: selectedDraft.risk_check },
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

                    {/* Confidence Score */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Confidence Score</span>
                      </div>
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-3xl font-bold ${
                            selectedDraft.confidence_score >= 8 ? "text-green-600 dark:text-green-400"
                            : selectedDraft.confidence_score >= 6.5 ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
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

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-border space-y-3">
                    <div>
                      {selectedDraft.employee_cases ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserRound className="w-3 h-3" />
                          <span>Filed under <strong>{selectedDraft.employee_cases.employee_name}</strong></span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setLinkDialog({ draftId: selectedDraft.id }); setLinkName(''); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <UserRound className="w-3 h-3" />
                          Add to employee file
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="default" className="gap-2 flex-1" onClick={() => copyDraft(selectedDraft)}>
                        <Copy className="w-4 h-4" />Copy Draft
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedDraft(null)}>Close</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </main>

      {/* Link to employee file dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => { if (!open) { setLinkDialog(null); setLinkName(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to employee file</DialogTitle>
            <DialogDescription>
              Type the employee's name. If a file already exists for them, the draft will be added to it automatically.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="e.g., J. Smith"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleLinkEmployee()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkDialog(null); setLinkName(''); }}>Cancel</Button>
            <Button variant="accent" onClick={handleLinkEmployee} disabled={!linkName.trim() || isLinking}>
              {isLinking ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
