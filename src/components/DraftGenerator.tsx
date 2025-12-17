import { useState } from "react";
import { FileText, MessageSquare, ClipboardList, Sparkles } from "lucide-react";
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
  { value: "performance-concern", label: "Performance Concern" },
  { value: "attendance-issue", label: "Attendance Issue" },
  { value: "accommodation-request", label: "Accommodation Request" },
  { value: "return-to-work", label: "Return to Work" },
  { value: "leave-request", label: "Leave Request" },
  { value: "conflict-resolution", label: "Workplace Conflict" },
  { value: "policy-reminder", label: "Policy Reminder" },
  { value: "check-in", label: "Wellness Check-In" },
  { value: "probation-review", label: "Probation Review" },
  { value: "termination", label: "Employment Ending" },
];

const tones = [
  { value: "supportive", label: "Supportive" },
  { value: "neutral", label: "Neutral" },
  { value: "collaborative", label: "Collaborative" },
  { value: "firm", label: "Firm but Fair" },
  { value: "compassionate", label: "Compassionate" },
  { value: "professional", label: "Formal Professional" },
];

const generateDraft = (scenario: string, tone: string, context: string) => {
  const scenarioLabel = scenarioTypes.find(s => s.value === scenario)?.label || scenario;
  const toneLabel = tones.find(t => t.value === tone)?.label || tone;
  const contextNote = context ? `\nContext noted: ${context}` : "";

  const drafts: Record<string, { message: string; points: string; note: string }> = {
    "performance-concern": {
      message: `Dear [Employee Name],

I would like to schedule a meeting with you to discuss current work outputs and explore how we can best support your success.${context ? ` I wanted to touch base regarding ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to review expectations, identify any barriers, and discuss resources or adjustments that might help.

Please let me know your availability over the next few days.

Regards,
[Manager Name]`,
      points: `• Reference specific work outputs, deadlines, or deliverables
• Describe observable gaps between expectations and results
• Ask about barriers: workload, resources, clarity of expectations
• Focus on what needs to change, not why it happened
• Agree on measurable next steps and a follow-up date`,
      note: `Meeting scheduled with [Employee Name] re: work output review.
Tone: ${toneLabel}. Focus: Gap between expectations and deliverables.${contextNote}
Specific examples to be discussed. Follow-up date to be set.`,
    },
    "attendance-issue": {
      message: `Dear [Employee Name],

I hope you're doing well. I wanted to reach out to schedule a brief conversation about attendance patterns I've observed in the records.${context ? ` Specifically, ${context.toLowerCase().trim()}.` : ""}

My goal is to understand if there are circumstances affecting your schedule and explore how we might address them together.

Please let me know a time that works for you.

Best regards,
[Manager Name]`,
      points: `• State the observable pattern: dates, frequency, impact on coverage
• Avoid assumptions about the cause
• Ask if there are circumstances affecting attendance
• Review expectations and any flexibility available
• Agree on next steps and a check-in date`,
      note: `Meeting requested with [Employee Name] re: attendance pattern.
Tone: ${toneLabel}. Observable pattern: [dates/frequency].${contextNote}
Outcome and any supports to be documented after meeting.`,
    },
    "accommodation-request": {
      message: `Dear [Employee Name],

Thank you for bringing your accommodation request to my attention.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I want to ensure we engage in a meaningful process to explore how we can support your needs.

Let's schedule a time to discuss functional requirements and identify potential options. This conversation will remain confidential.

I'll follow up shortly to arrange a meeting.

Sincerely,
[Manager Name]`,
      points: `• Focus on functional limitations and job requirements
• Review essential duties and performance standards
• Explore practical modifications to tasks, schedule, or environment
• Document options considered and rationale
• Involve HR or specialists as appropriate`,
      note: `Accommodation request received from [Employee Name].
Tone: ${toneLabel}. Interactive process initiated.${contextNote}
Focus: Functional requirements. Next: schedule meeting, document process.`,
    },
    "return-to-work": {
      message: `Dear [Employee Name],

Welcome back. I'm pleased to have you returning to the team.${context ? ` I understand ${context.toLowerCase().trim()}.` : ""}

Before your return, I'd like to meet briefly to review current priorities and discuss any temporary adjustments to duties or schedule that may support your transition.

Please let me know your availability.

Looking forward to seeing you,
[Manager Name]`,
      points: `• Review current work priorities and deadlines
• Discuss any documented work restrictions
• Clarify expectations for the transition period
• Identify deliverables and check-in points
• Establish a communication plan for questions`,
      note: `Return-to-work meeting scheduled for [Employee Name].
Tone: ${toneLabel}. Focus: Work priorities and transition plan.${contextNote}
Modified duties/schedule to be documented after meeting.`,
    },
    "leave-request": {
      message: `Dear [Employee Name],

Thank you for submitting your leave request.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I've received it and will review it promptly.

If I need any additional information to process the request, I'll be in touch. In the meantime, please don't hesitate to reach out with questions.

Best regards,
[Manager Name]`,
      points: `• Confirm dates and type of leave requested
• Review coverage plan for duties during absence
• Clarify any handover requirements
• Communicate approval timeline
• Document the request and decision`,
      note: `Leave request received from [Employee Name].
Tone: ${toneLabel}. Dates: [requested dates].${contextNote}
Next: Review entitlements, arrange coverage, communicate decision.`,
    },
    "conflict-resolution": {
      message: `Dear [Employee Name],

I'd like to meet with you to discuss a workplace matter that has come to my attention.${context ? ` This relates to ${context.toLowerCase().trim()}.` : ""}

My goal is to understand the situation and work toward maintaining a productive work environment. I'm approaching this to gather information and hear your perspective.

Could you please let me know your availability this week?

Thank you,
[Manager Name]`,
      points: `• Describe the specific incident or behaviour observed
• Focus on impact to work, team, or environment
• Gather facts before forming conclusions
• Identify what needs to change going forward
• Document observations and agreed actions`,
      note: `Workplace matter discussed with [Employee Name].
Tone: ${toneLabel}. Focus: Specific incident/behaviour and work impact.${contextNote}
Confidentiality maintained. Actions and expectations documented.`,
    },
    "policy-reminder": {
      message: `Dear Team,

I wanted to remind everyone of our workplace expectations regarding [policy area].${context ? ` ${context}` : ""}

These expectations help us maintain consistent standards across the team. If you have questions or need clarification on requirements, please reach out to me or HR.

Thank you for your attention to this.

Best regards,
[Manager Name]`,
      points: `• State the specific expectation or standard
• Reference the relevant policy if appropriate
• Clarify what compliance looks like in practice
• Offer to answer questions
• Follow up individually if specific patterns observed`,
      note: `Policy reminder issued to team re: [topic].
Tone: ${toneLabel}. Expectation clarified: [specific standard].${contextNote}
Individual follow-up if warranted.`,
    },
    "check-in": {
      message: `Dear [Employee Name],

I wanted to check in with you.${context ? ` ${context}` : " I've noticed some changes in your work patterns recently and"} want to see if there's anything I can do to support you.

There's no obligation to share details. If there's anything affecting your work that you'd like to discuss, I'm available to listen and explore options.

Would you have time for a brief conversation this week?

Take care,
[Manager Name]`,
      points: `• Reference observable changes in work output or engagement
• Ask open-ended questions without assumptions
• Listen and let them share what they're comfortable with
• Offer available resources (EAP, flex options) without pressure
• Clarify any work expectations if needed`,
      note: `Check-in initiated with [Employee Name].
Tone: ${toneLabel}. Observable change: [work pattern/output].${contextNote}
Resources offered: [EAP/other]. Follow-up as agreed.`,
    },
    "probation-review": {
      message: `Dear [Employee Name],

As you approach the end of your probationary period, I'd like to schedule a meeting to review your progress against the expectations for your role.${context ? ` I'd particularly like to discuss ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to review accomplishments, discuss any gaps, and confirm next steps.

Please let me know your availability this week.

Best regards,
[Manager Name]`,
      points: `• Review performance against documented expectations
• Cite specific deliverables, behaviours, and outcomes
• Identify strengths demonstrated and gaps observed
• Be clear about probation decision and rationale
• Document the discussion and outcome formally`,
      note: `Probationary review for [Employee Name].
Tone: ${toneLabel}. Probation end date: [Date].${contextNote}
Performance against expectations reviewed. Outcome documented.`,
    },
    "termination": {
      message: `Dear [Employee Name],

I am writing to confirm our conversation regarding the end of your employment with [Organization], effective [Date].${context ? ` As discussed, ${context.toLowerCase().trim()}.` : ""}

Please find attached information regarding your final pay, benefits continuation, and other relevant matters. For questions, please contact HR at [contact info].

We wish you well in your future endeavours.

Sincerely,
[Manager Name]`,
      points: `• Ensure decision is documented and reviewed by HR
• State the effective date and reason clearly
• Explain logistics: final pay, benefits, return of property
• Allow questions about process, not about reversing decision
• Maintain a respectful, professional tone throughout`,
      note: `Employment ended for [Employee Name]. Effective: [Date].
Tone: ${toneLabel}. HR involved: Yes. Reason documented separately.${contextNote}
Final pay and ROE to be processed. Exit logistics confirmed.`,
    },
  };

  const template = drafts[scenario] || drafts["performance-concern"];

  return {
    draftMessage: template.message,
    talkingPoints: template.points,
    documentationNote: template.note,
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

    await new Promise((resolve) => setTimeout(resolve, 800));

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
              Optional context <span className="text-muted-foreground font-normal">(1–3 sentences, no names)</span>
            </Label>
            <Textarea
              id="context"
              placeholder="e.g., employee shared personal issues, timing is sensitive, conversation already partially started"
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
          />
        </div>
      )}
    </div>
  );
}
