import { useState } from "react";
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

export function DraftGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [tone, setTone] = useState("");
  const [sector, setSector] = useState<Sector>("private");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSafer, setIsGeneratingSafer] = useState(false);
  const [saferVersion, setSaferVersion] = useState<string | null>(null);
  const [output, setOutput] = useState<{
    draftMessage: string;
    talkingPoints: string;
    documentationNote: string;
    riskCheck: string;
    riskLevel: RiskLevel;
    confidence: ConfidenceScore;
  } | null>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleGenerate = async () => {
    if (selectedScenarios.length === 0 || !tone) return;

    setIsGenerating(true);
    setOutput(null);
    setSaferVersion(null);
    setCopiedDraft(false);

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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast({
            title: "Rate limit reached",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
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

  const [copiedDraft, setCopiedDraft] = useState(false);

  const handleCopyDraft = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output.draftMessage);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleOpenSaveDialog = () => {
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
      });

      if (error) throw error;

      toast({
        title: "Draft saved!",
        description: "Your draft has been added to your library.",
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
                  AI will consider all selected scenarios when crafting the draft
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
              Sector
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
                AI applies more conservative guidance for {sector === "public" ? "public sector" : "unionized"} environments
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

          {/* Generate Button */}
          <Button
            variant="accent"
            size="lg"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full md:w-auto md:ml-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Draft
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      {output && (
        <div className="grid gap-6">
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
              <h3 className="font-heading text-lg font-semibold text-foreground">AI Confidence Score</h3>
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
          <div className="py-4">
            <Label htmlFor="save-title" className="text-sm font-medium">
              Draft Title
            </Label>
            <Input
              id="save-title"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="e.g., Performance review discussion"
              className="mt-2"
            />
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
