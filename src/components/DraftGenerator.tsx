import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, MessageSquare, ClipboardList, Sparkles, ShieldAlert, RefreshCw, ThumbsUp, Building2, Users, Landmark, Copy, RotateCcw, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutputCard } from "./OutputCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPlanLimits } from "@/lib/planLimits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const scenarioTypes = [
  { value: "performance-concern", label: "Performance Concern" },
  { value: "attendance-issue", label: "Attendance Issue" },
  { value: "accommodation-request", label: "Accommodation Request" },
  { value: "mental-health-disclosure", label: "Mental Health Disclosure" },
  { value: "return-to-work", label: "Return to Work" },
  { value: "leave-request", label: "Leave Request" },
  { value: "conflict-resolution", label: "Workplace Conflict" },
  { value: "policy-reminder", label: "Policy Reminder" },
  { value: "check-in", label: "Wellness Check-In" },
  { value: "probation-review", label: "Probation Review" },
  { value: "termination", label: "Employment Ending" },
  { value: "difficult-timing", label: "Difficult Timing" },
  { value: "follow-up", label: "Follow-Up After Meeting" },
  { value: "declining-request", label: "Declining a Request" },
  { value: "resetting-expectations", label: "Resetting Expectations" },
];

const tones = [
  { value: "supportive", label: "Supportive" },
  { value: "neutral", label: "Neutral" },
  { value: "collaborative", label: "Collaborative" },
  { value: "firm", label: "Firm but Fair" },
  { value: "compassionate", label: "Compassionate" },
  { value: "professional", label: "Formal Professional" },
];

type Sector = "private" | "public" | "unionized";
type RiskLevel = "Low" | "Moderate" | "High";

interface ConfidenceScore {
  score: number;
  strengths: string[];
  suggestion: string | null;
}

const sectors: { value: Sector; label: string; icon: typeof Building2 }[] = [
  { value: "private", label: "Private Sector", icon: Building2 },
  { value: "public", label: "Public Sector", icon: Landmark },
  { value: "unionized", label: "Unionized", icon: Users },
];

const DEMO_PILLS: {
  id: string;
  label: string;
  emoji: string;
  scenario: string;
  tone: string;
  context: string;
  output: {
    draftMessage: string;
    talkingPoints: string;
    documentationNote: string;
    riskCheck: string;
    riskLevel: RiskLevel;
    confidence: ConfidenceScore;
  };
}[] = [
  {
    id: 'performance',
    label: 'Performance concern',
    emoji: '📉',
    scenario: 'performance-concern',
    tone: 'supportive',
    context: "An employee has been missing deadlines and their work quality has dropped noticeably over the past month. They haven't flagged any issues and I want to address this before it becomes a formal matter.",
    output: {
      draftMessage: `Dear [Employee Name],\n\nI'd like to set up some time for us to connect this week — I want to make sure you have everything you need and that we're aligned on priorities.\n\nOver the past few weeks, I've noticed that a few deadlines have been missed and that the output on [project/task] hasn't been at the standard we'd both expect. I want to understand if there's something getting in the way that I'm not aware of — whether that's workload, resources, or something else entirely.\n\nThis isn't a formal conversation — I'd like to approach it as a working session to figure out what support looks like and agree on a clear plan going forward.\n\nCould you let me know your availability for a 30-minute meeting this week?\n\nBest regards,\n[Your Name]`,
      talkingPoints: `• Start by acknowledging any external pressures that may have affected performance\n• Reference specific examples using factual, objective language — avoid generalisations\n• Ask open questions: "What's been getting in the way?" before offering solutions\n• Explore whether the issue is skills, workload, motivation, or something personal\n• Agree on a clear, time-bound improvement plan with measurable outcomes\n• Confirm a follow-up date and what "good" looks like going forward`,
      documentationNote: `Informal meeting held on [Date] with [Employee Name]. Manager outlined observations regarding missed deadlines on [project/task] and invited employee's perspective. Employee indicated [summary]. Agreed actions: [list]. Follow-up meeting scheduled for [date]. No formal action taken at this stage.`,
      riskCheck: `Ensure all examples cited are factual and documented before the conversation. Avoid language implying a final warning unless a formal process has already begun. If the employee discloses a health or personal issue during this meeting, pause and consider whether an accommodation process is more appropriate than a performance process. Review your organisation's performance management policy before proceeding.`,
      riskLevel: 'Low',
      confidence: {
        score: 8.7,
        strengths: [
          'Conversational tone reduces defensiveness',
          'Specific context provided — draft is grounded in the situation',
          'Invites dialogue before escalating to formal process',
        ],
        suggestion: 'Adding specific dates and documented examples would further strengthen the paper trail.',
      },
    },
  },
  {
    id: 'attendance',
    label: 'Attendance issue',
    emoji: '📅',
    scenario: 'attendance-issue',
    tone: 'neutral',
    context: "An employee has had 6 absences in the past 8 weeks, several falling on Mondays and Fridays. I haven't spoken to them formally yet and want to address the pattern while remaining fair.",
    output: {
      draftMessage: `Dear [Employee Name],\n\nI wanted to check in with you directly, as I've noticed a pattern in your absences over the past couple of months and want to make sure I understand what's going on.\n\nI've recorded [X] absences since [date], several of which have fallen on Mondays and Fridays. I want to be clear that this isn't an accusation — I'm raising it because it's a pattern I'm obliged to address, and because I'd rather have an open conversation now than let it become a more formal matter.\n\nIf there's something happening that's affecting your attendance, I'd like to know so we can look at what support or adjustments might be available. Whatever you share will be treated confidentially.\n\nCould we meet briefly this week to talk it through?\n\nKind regards,\n[Your Name]`,
      talkingPoints: `• Present the absence data factually — dates, frequency, pattern — without accusation\n• Make clear this is a supportive conversation, not a disciplinary one\n• Create space for the employee to disclose personal or health-related factors\n• If a health issue emerges, shift the conversation toward accommodation options\n• If no explanation is offered, outline what the next stage would look like under your attendance policy\n• Confirm agreed next steps and set a review date`,
      documentationNote: `Meeting held on [Date] with [Employee Name] to discuss attendance pattern. Manager presented absence data: [X] absences since [date], including [specific dates]. Employee responded: [summary]. No formal action taken at this stage. Agreed next steps: [list]. Review scheduled for [date].`,
      riskCheck: `Do not imply the employee is being deceptive before they have had the opportunity to explain. If they disclose a disability or health condition, you may have a duty to make reasonable adjustments — escalate to HR before proceeding with any disciplinary route. Ensure records are accurate and that all absences were properly certified where your policy requires it.`,
      riskLevel: 'Moderate',
      confidence: {
        score: 8.2,
        strengths: [
          'Factual framing reduces grievance risk',
          'Opens space for disclosure without pressure',
          'Appropriate tone for early-stage attendance conversation',
        ],
        suggestion: "Citing your organisation's attendance policy by name would add procedural weight.",
      },
    },
  },
  {
    id: 'mental-health',
    label: 'Mental health disclosure',
    emoji: '🤝',
    scenario: 'mental-health-disclosure',
    tone: 'compassionate',
    context: "An employee disclosed they're struggling with anxiety and finding it hard to focus. They haven't asked for anything specific but seemed relieved to share it. I want to respond with care and agree on next steps.",
    output: {
      draftMessage: `Dear [Employee Name],\n\nThank you for trusting me with what you shared. I want you to know I take it seriously, and I'm glad you felt able to tell me.\n\nI don't want to make any assumptions about what you need — everyone's experience is different. What I'd like to do is find a time for us to have a proper conversation, at your pace, about what support might look like for you right now. That could be adjustments to your workload or hours, a referral to our Employee Assistance Programme, or simply regular check-ins — whatever feels right.\n\nThere's no obligation to share more than you're comfortable with. My goal is to make sure you're supported and that work isn't adding to the pressure.\n\nWould you be open to meeting this week or next?\n\nWith care,\n[Your Name]`,
      talkingPoints: `• Thank the employee for disclosing — acknowledge how difficult it can be to share\n• Do not probe for clinical details or ask about diagnosis\n• Focus on impact at work and what practical support could help\n• Offer concrete options: EAP referral, workload review, flexible hours, regular check-ins\n• Reassure them that disclosing will not be used against them in any formal process\n• Agree a communication plan — how and how often to check in going forward`,
      documentationNote: `Informal check-in held on [Date] with [Employee Name] following disclosure of mental health difficulties. Manager acknowledged disclosure and discussed support options. Employee indicated [summary of preferences]. Agreed actions: [list]. Next check-in scheduled for [date]. Handled with confidentiality in line with company policy.`,
      riskCheck: `Mental health disclosures may trigger obligations under disability discrimination legislation — even where a formal diagnosis hasn't been made. Do not ask for medical details. Ensure any adjustments offered are genuinely considered. Involve HR at the earliest opportunity. Document carefully but with sensitivity — focus on agreed support, not the nature of the disclosure itself.`,
      riskLevel: 'Moderate',
      confidence: {
        score: 9.1,
        strengths: [
          'Compassionate framing reduces defensiveness',
          'Does not probe for clinical information',
          'Offers concrete next steps without pressure',
        ],
        suggestion: null,
      },
    },
  },
];

export function DraftGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const STORAGE_KEY = 'composure_draft_v1';
  const EXPIRY_MS = 24 * 60 * 60 * 1000;

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - (data.savedAt ?? 0) > EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch { return null; }
  };

  const saveDraft = (patch: object) => {
    try {
      const existing = loadDraft() ?? {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...patch, savedAt: Date.now() }));
    } catch {}
  };

  const saved = loadDraft();

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(saved?.selectedScenarios ?? []);
  const [tone, setTone] = useState(saved?.tone ?? "");
  const [sector, setSector] = useState<Sector>(saved?.sector ?? "private");
  const [context, setContext] = useState(saved?.context ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSafer, setIsGeneratingSafer] = useState(false);
  const [saferVersion, setSaferVersion] = useState<string | null>(null);
  const [policiesUsed, setPoliciesUsed] = useState<boolean | null>(saved?.policiesUsed ?? null);
  const [output, setOutput] = useState<{
    draftMessage: string;
    talkingPoints: string;
    documentationNote: string;
    riskCheck: string;
    riskLevel: RiskLevel;
    confidence: ConfidenceScore;
  } | null>(saved?.output ?? null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [activePill, setActivePill] = useState<string | null>(null);

  const handlePillClick = (pill: typeof DEMO_PILLS[0]) => {
    setSelectedScenarios([pill.scenario]);
    setTone(pill.tone);
    setContext(pill.context);
    setActivePill(pill.id);
    setSaferVersion(null);
    setLimitReached(false);
    if (!user) {
      setOutput(pill.output);
      setIsPreview(true);
    } else {
      setOutput(null);
      setIsPreview(false);
    }
  };

  const clearPill = () => {
    setActivePill(null);
    setOutput(null);
    setIsPreview(false);
    setSelectedScenarios([]);
    setTone('');
    setContext('');
  };

  const PROGRESS_MESSAGES = [
    'Analysing your situation...',
    'Retrieving relevant policies...',
    'Drafting your communication...',
    'Reviewing for compliance...',
    'Finalising your draft...',
  ];

  useEffect(() => {
    if (!output) return;
    saveDraft({ output, selectedScenarios, tone, sector, context, policiesUsed });
  }, [output, policiesUsed]);

  useEffect(() => {
    if (!profile?.organisation_id) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', profile.organisation_id)
      .gte('created_at', monthStart.toISOString())
      .then(({ count }) => setUsageCount(count ?? 0));
  }, [profile?.organisation_id]);

  const toggleScenario = (scenarioValue: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioValue)) {
        return prev.filter(s => s !== scenarioValue);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), scenarioValue];
      }
      return [...prev, scenarioValue];
    });
  };

  useEffect(() => {
    if (!isGenerating) { setProgressMsg(''); return; }
    let i = 0;
    setProgressMsg(PROGRESS_MESSAGES[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, PROGRESS_MESSAGES.length - 1);
      setProgressMsg(PROGRESS_MESSAGES[i]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (selectedScenarios.length === 0 || !tone) return;

    // Unauthenticated: show blurred mock preview without using tokens
    if (!user) {
      setIsGenerating(true);
      setOutput(null);
      setIsPreview(false);
      await new Promise(res => setTimeout(res, 3200));
      setOutput(MOCK_OUTPUT);
      setIsPreview(true);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    setOutput(null);
    setSaferVersion(null);
    setPoliciesUsed(null);
    setCopiedDraft(false);
    setIsPreview(false);
    setLimitReached(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-draft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            scenarios: selectedScenarios,
            tone,
            sector,
            context,
            organisation_id: profile?.organisation_id ?? null,
            user_id: user?.id ?? null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const errData = await response.json().catch(() => ({}));
          if (errData.error?.includes('draft limit')) {
            setLimitReached(true);
          } else {
            toast({ title: "Rate limit reached", description: "Please wait a moment and try again.", variant: "destructive" });
          }
        } else if (response.status === 402) {
          toast({
            title: "Usage limit reached",
            description: "Please check your workspace credits.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Generation failed",
            description: errorData.error || "Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Generation failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setOutput({
        draftMessage: data.draftMessage,
        talkingPoints: data.talkingPoints,
        documentationNote: data.documentationNote,
        riskCheck: data.riskCheck,
        riskLevel: data.riskLevel as RiskLevel,
        confidence: data.confidence,
      });
      setPoliciesUsed(data.policiesUsed ?? false);
      setUsageCount(prev => (prev !== null ? prev + 1 : 1));
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Connection error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSafer = async () => {
    if (!output) return;

    setIsGeneratingSafer(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-safer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            originalMessage: output.draftMessage,
            scenario: scenarioTypes.find(s => s.value === selectedScenarios[0])?.label || selectedScenarios[0],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Generation failed",
          description: errorData.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Generation failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setSaferVersion(data.saferVersion);
    } catch (error) {
      console.error('Error generating safer version:', error);
      toast({
        title: "Connection error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSafer(false);
    }
  };

  const [isPreview, setIsPreview] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const MOCK_OUTPUT = {
    draftMessage: `Dear [Employee Name],\n\nI wanted to take a moment to connect with you regarding some observations I've made over the past few weeks. I value our working relationship and want to ensure we're aligned on expectations and support.\n\nI've noticed [specific situation], and I'd like to understand your perspective better. My goal is to work together to find a constructive path forward that works for both of us.\n\nI'd welcome the opportunity to meet at your earliest convenience to discuss this further. Please let me know your availability.\n\nWarm regards,\n[Your Name]`,
    talkingPoints: `• Open the conversation by acknowledging the employee's contributions\n• Describe the specific behaviour or situation using objective language\n• Ask open-ended questions to understand their perspective\n• Collaboratively discuss support options and next steps\n• Confirm agreed actions and follow-up timeline`,
    documentationNote: `Meeting held on [Date] with [Employee Name] to discuss [situation]. Manager outlined observations and invited employee response. Employee indicated [summary of response]. Agreed next steps: [actions]. Follow-up scheduled for [date].`,
    riskCheck: `This situation carries a moderate level of risk if not handled with care. Ensure all documentation is factual and free from subjective language. Consider whether an HR representative should be present. Review your organisation's progressive discipline policy before proceeding.`,
    riskLevel: "Moderate" as RiskLevel,
    confidence: {
      score: 8.4,
      strengths: [
        "Detailed situational context provided",
        "Tone aligned with a supportive approach",
        "Scenario type clearly identified",
      ],
      suggestion: "Adding specific dates or prior conversations would further strengthen the draft.",
    },
  };

  const handleCopyDraft = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output.draftMessage);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleOpenSaveDialog = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save drafts to your library.",
      });
      navigate("/auth");
      return;
    }
    const primaryScenario = scenarioTypes.find(s => s.value === selectedScenarios[0]);
    setSaveTitle(primaryScenario?.label || "Draft");
    setShowSaveDialog(true);
  };

  const handleSaveDraft = async () => {
    if (!output || !user) return;

    setIsSaving(true);

    try {
      // Auto-find or create employee file if a name was provided
      let caseId: string | null = null;
      if (employeeName.trim() && profile?.organisation_id) {
        const { data: existing } = await supabase
          .from('employee_cases')
          .select('id')
          .eq('organisation_id', profile.organisation_id)
          .ilike('employee_name', employeeName.trim())
          .maybeSingle();

        if (existing) {
          caseId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('employee_cases')
            .insert({ organisation_id: profile.organisation_id, created_by: user.id, employee_name: employeeName.trim() })
            .select('id')
            .single();
          caseId = created?.id ?? null;
        }

        if (caseId) {
          await supabase.from('employee_cases').update({ updated_at: new Date().toISOString() }).eq('id', caseId);
        }
      }

      const { error } = await supabase.from("saved_drafts").insert({
        user_id: user.id,
        title: saveTitle || "Untitled Draft",
        scenarios: selectedScenarios,
        tone,
        sector,
        context: context || null,
        draft_message: output.draftMessage,
        talking_points: output.talkingPoints,
        documentation_note: output.documentationNote,
        risk_check: output.riskCheck,
        risk_level: output.riskLevel,
        confidence_score: output.confidence.score,
        confidence_strengths: output.confidence.strengths,
        confidence_suggestion: output.confidence.suggestion,
        case_id: caseId,
      });

      if (error) throw error;

      toast({
        title: "Draft saved!",
        description: employeeName.trim()
          ? `Saved to ${employeeName.trim()}'s file.`
          : "Your draft has been added to your library.",
      });
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Save failed",
        description: "Could not save the draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canGenerate = selectedScenarios.length > 0 && tone;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 mb-8">
        <div className="grid gap-6">

          {/* Prefill pills — quick-start for visitors */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => activePill === pill.id ? clearPill() : handlePillClick(pill)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 ${
                    activePill === pill.id
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:border-accent/60 hover:text-foreground'
                  }`}
                >
                  <span>{pill.emoji}</span>
                  {pill.label}
                </button>
              ))}
              {activePill && (
                <button
                  type="button"
                  onClick={clearPill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Scenario Type {selectedScenarios.length > 0 && <span className="text-muted-foreground font-normal">({selectedScenarios.length}/3)</span>}
              </Label>
              
              {/* Selected scenarios as chips */}
              {selectedScenarios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedScenarios.map((scenarioValue, index) => {
                    const scenario = scenarioTypes.find(s => s.value === scenarioValue);
                    return (
                      <div
                        key={scenarioValue}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                      >
                        {index === 0 && <span className="text-xs opacity-75">Primary:</span>}
                        {scenario?.label}
                        <button
                          type="button"
                          onClick={() => toggleScenario(scenarioValue)}
                          className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Dropdown to add scenarios */}
              {selectedScenarios.length < 3 && (
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value && !selectedScenarios.includes(value)) {
                      toggleScenario(value);
                    }
                  }}
                >
                  <SelectTrigger className="h-12 bg-background border-border hover:border-muted-foreground/50 transition-colors">
                    <SelectValue placeholder={selectedScenarios.length === 0 ? "Select scenario..." : "Add another scenario..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-[300px]">
                    {scenarioTypes
                      .filter(scenario => !selectedScenarios.includes(scenario.value))
                      .map((scenario) => (
                        <SelectItem 
                          key={scenario.value} 
                          value={scenario.value}
                          className="cursor-pointer hover:bg-secondary"
                        >
                          {scenario.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedScenarios.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  All selected scenarios will be considered when crafting the draft
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="text-sm font-medium text-foreground">
                Tone
              </Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger 
                  id="tone" 
                  className="h-12 bg-background border-border hover:border-muted-foreground/50 transition-colors"
                >
                  <SelectValue placeholder="Select tone..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {tones.map((t) => (
                    <SelectItem 
                      key={t.value} 
                      value={t.value}
                      className="cursor-pointer hover:bg-secondary"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sector Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Workplace type
            </Label>
            <div className="flex flex-wrap gap-2">
              {sectors.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSector(s.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      sector === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
            {(sector === "public" || sector === "unionized") && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                More conservative guidance applies for {sector === "public" ? "public sector" : "unionized"} environments
              </p>
            )}
          </div>

          {/* Context Textarea */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium text-foreground">
              Describe the situation <span className="text-muted-foreground font-normal">(the more detail, the better the draft)</span>
            </Label>
            <Textarea
              id="context"
              placeholder="e.g., Employee has been consistently late for the past 3 weeks. They mentioned family issues but haven't been specific. I want to address this while being supportive. We've had a good working relationship until now."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[120px] bg-background border-border resize-none hover:border-muted-foreground/50 focus:border-ring transition-colors"
            />
          </div>

          {/* Who is this about */}
          {user && (
            <div className="space-y-2">
              <Label htmlFor="employee-name" className="text-sm font-medium text-foreground">
                Employee name <span className="text-muted-foreground font-normal">— links drafts to their case file</span>
              </Label>
              <Input
                id="employee-name"
                placeholder="e.g., J. Smith"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="bg-background border-border hover:border-muted-foreground/50 transition-colors"
              />
            </div>
          )}

          {/* Limit reached banner */}
          {limitReached && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Monthly draft limit reached</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Upgrade your plan to keep generating drafts this month.</p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          )}

          {/* Generate Button + Usage */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              variant="accent"
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating || limitReached}
              className="w-full sm:w-auto sm:ml-auto"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  <span className="animate-pulse">{progressMsg || 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Draft my message
                </>
              )}
            </Button>

            {user && usageCount !== null && (() => {
              const limits = getPlanLimits(null);
              const pct = limits.draftsPerMonth === -1 ? 0 : Math.min((usageCount / limits.draftsPerMonth) * 100, 100);
              const nearLimit = limits.draftsPerMonth !== -1 && usageCount >= limits.draftsPerMonth * 0.8;
              return (
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:order-first min-w-0">
                  <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all ${nearLimit ? 'bg-amber-500' : 'bg-accent'}`}
                      style={{ width: limits.draftsPerMonth === -1 ? '0%' : `${pct}%` }}
                    />
                  </div>
                  <span className="truncate">
                    {limits.draftsPerMonth === -1
                      ? `${usageCount} team drafts this month`
                      : `${usageCount} / ${limits.draftsPerMonth} team drafts this month`}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Output Section */}
      {output && (
        <div className="relative">
          {/* Blur overlay for unauthenticated preview */}
          {isPreview && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-16 px-4">
              <div className="bg-card border border-border rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Your draft is ready</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a free account to unlock the full draft, talking points, risk check, and confidence score.
                </p>
                <Button variant="accent" className="w-full mb-3" onClick={() => navigate('/auth')}>
                  Get my free account
                </Button>
                <Button variant="outline" className="w-full mb-3" onClick={() => navigate('/auth')}>
                  Sign in
                </Button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="text-xs text-accent hover:underline"
                >
                  View pricing plans →
                </button>
                <p className="text-xs text-muted-foreground mt-2">Free · 3 drafts/month · No credit card</p>
                {activePill && (
                  <button
                    onClick={clearPill}
                    className="text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors underline underline-offset-2 block"
                  >
                    ← Try a different scenario
                  </button>
                )}
              </div>
            </div>
          )}
        <div className={`grid gap-6 ${isPreview ? 'blur-[3px] pointer-events-none select-none opacity-80' : ''}`}>
          {/* Policy indicator */}
          {policiesUsed !== null && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
              policiesUsed
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-secondary border-border text-muted-foreground'
            }`}>
              <span>{policiesUsed ? '✓' : 'ℹ'}</span>
              <span>
                {policiesUsed
                  ? 'Response informed by your organisation\'s policies'
                  : 'General guidance applied — upload your policies for personalised responses'}
              </span>
            </div>
          )}

          <OutputCard
            title="Draft Message"
            content={output.draftMessage}
            icon={<MessageSquare className="w-4 h-4" />}
            delay={0}
            isVisible={!!output}
            highlightPlaceholders={true}
          />
          <OutputCard
            title="Key Talking Points"
            content={output.talkingPoints}
            icon={<ClipboardList className="w-4 h-4" />}
            delay={150}
            isVisible={!!output}
          />
          <OutputCard
            title="Documentation Note"
            content={output.documentationNote}
            icon={<FileText className="w-4 h-4" />}
            delay={300}
            isVisible={!!output}
            highlightPlaceholders={true}
          />
          <OutputCard
            title="Risk Assessment"
            content={output.riskCheck}
            icon={<ShieldAlert className="w-4 h-4" />}
            delay={450}
            isVisible={!!output}
            headerContent={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                output.riskLevel === "High" 
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                  : output.riskLevel === "Moderate"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                Risk Level: {output.riskLevel}
              </span>
            }
          />

          {/* Manager Confidence Score */}
          <div 
            className="bg-card rounded-xl border border-border shadow-card p-5 opacity-0 animate-slide-up"
            style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Confidence Score</h3>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl font-bold ${
                output.confidence.score >= 8 
                  ? "text-green-600 dark:text-green-400" 
                  : output.confidence.score >= 6.5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {output.confidence.score.toFixed(1)}
              </div>
              <div className="text-muted-foreground text-sm">/ 10</div>
              <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                output.confidence.score >= 8 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                  : output.confidence.score >= 6.5
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {output.confidence.score >= 8 ? "Ready to send" : output.confidence.score >= 6.5 ? "Review recommended" : "Needs attention"}
              </div>
            </div>

            <div className="space-y-2">
              {output.confidence.strengths.map((strength, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="text-green-500">✓</span>
                  {strength}
                </div>
              ))}
              {output.confidence.suggestion && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3 pt-3 border-t border-border">
                  <span>→</span>
                  {output.confidence.suggestion}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div 
            className="flex flex-wrap justify-center gap-3 opacity-0 animate-slide-up" 
            style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
          >
            <Button
              onClick={handleCopyDraft}
              variant="default"
              className="gap-2"
            >
              {copiedDraft ? (
                <>
                  <span className="text-green-500">✓</span>
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Draft
                </>
              )}
            </Button>

            <Button
              onClick={handleOpenSaveDialog}
              variant="accent"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save to Library
            </Button>

            {!saferVersion && (
              <Button
                onClick={handleGenerateSafer}
                disabled={isGeneratingSafer}
                variant="outline"
                className="gap-2"
              >
                {isGeneratingSafer ? (
                  <>
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Softer Version
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleRegenerate}
              disabled={isGenerating}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Regenerate
            </Button>

            {user && (
              <Button
                onClick={() => navigate("/library")}
                variant="ghost"
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                View Library
              </Button>
            )}
          </div>

          {/* Safer Version Output */}
          {saferVersion && (
            <OutputCard
              title="Softer Version"
              content={saferVersion}
              icon={<RefreshCw className="w-4 h-4" />}
              delay={0}
              isVisible={!!saferVersion}
              highlightPlaceholders={true}
              headerContent={
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  More empathetic tone
                </span>
              }
            />
          )}
        </div>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Library</DialogTitle>
            <DialogDescription>
              Give this draft a name so you can find it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="save-title" className="text-sm font-medium">Draft Title</Label>
              <Input
                id="save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Performance review discussion"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="save-employee" className="text-sm font-medium">
                Employee name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="save-employee"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g., J. Smith — links to their case file"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                If a case file already exists for this person, the draft will be added to it automatically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={isSaving} variant="accent">
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
