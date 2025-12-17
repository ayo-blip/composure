import { useState } from "react";
import { FileText, MessageSquare, ClipboardList, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutputCard } from "./OutputCard";

const scenarioTypes = [
  { value: "complaint", label: "Customer Complaint" },
  { value: "inquiry", label: "General Inquiry" },
  { value: "feedback", label: "Feedback Response" },
  { value: "escalation", label: "Escalation" },
  { value: "follow-up", label: "Follow-up" },
  { value: "apology", label: "Apology" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "empathetic", label: "Empathetic" },
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "assertive", label: "Assertive" },
  { value: "neutral", label: "Neutral" },
];

// Mock generation function - in real app, this would call an API
const generateDraft = (scenario: string, tone: string, context: string) => {
  const scenarioLabel = scenarioTypes.find(s => s.value === scenario)?.label || scenario;
  const toneLabel = tones.find(t => t.value === tone)?.label || tone;

  return {
    draftMessage: `Dear Valued Customer,

Thank you for reaching out to us regarding your ${scenarioLabel.toLowerCase()}. We sincerely appreciate you taking the time to share your experience with us.

${context ? `We understand that ${context.toLowerCase().trim()}. ` : ""}We want to assure you that your concerns are our top priority, and we are committed to resolving this matter promptly.

Our team is currently reviewing your case and will provide you with a comprehensive response within 24-48 hours. In the meantime, please don't hesitate to reach out if you have any additional information to share.

We value your continued trust in our services.

Best regards,
Customer Success Team`,

    talkingPoints: `• Acknowledge the customer's ${scenarioLabel.toLowerCase()} with a ${toneLabel.toLowerCase()} approach
• Express genuine appreciation for their communication
• Clearly state commitment to resolution
• Provide realistic timeline expectations (24-48 hours)
• Maintain open lines of communication
• Reinforce company values and customer-first mentality
${context ? `• Address specific context: "${context}"` : ""}`,

    documentationNote: `Case Type: ${scenarioLabel}
Communication Tone: ${toneLabel}
${context ? `Additional Context: ${context}` : "No additional context provided"}

Action Items:
- Initial response sent to customer
- Case flagged for follow-up within 48 hours
- Escalation path identified if needed

Next Steps:
1. Review case details thoroughly
2. Coordinate with relevant department
3. Prepare comprehensive resolution
4. Schedule follow-up communication`,
  };
};

export function DraftGenerator() {
  const [scenarioType, setScenarioType] = useState("");
  const [tone, setTone] = useState("");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<{
    draftMessage: string;
    talkingPoints: string;
    documentationNote: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!scenarioType || !tone) return;

    setIsGenerating(true);
    setOutput(null);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = generateDraft(scenarioType, tone, context);
    setOutput(result);
    setIsGenerating(false);
  };

  const canGenerate = scenarioType && tone;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 mb-8">
        <div className="grid gap-6">
          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scenario" className="text-sm font-medium text-foreground">
                Scenario Type
              </Label>
              <Select value={scenarioType} onValueChange={setScenarioType}>
                <SelectTrigger 
                  id="scenario" 
                  className="h-12 bg-background border-border hover:border-muted-foreground/50 transition-colors"
                >
                  <SelectValue placeholder="Select scenario..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {scenarioTypes.map((scenario) => (
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

          {/* Context Textarea */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium text-foreground">
              Context <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="context"
              placeholder="Add any additional context or specific details about the situation..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px] bg-background border-border resize-none hover:border-muted-foreground/50 focus:border-ring transition-colors"
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
                Generating...
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
          />
          <OutputCard
            title="Talking Points"
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
          />
        </div>
      )}
    </div>
  );
}
