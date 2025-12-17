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

I would like to schedule a meeting with you to discuss your current work and explore how we can best support your success.${context ? ` I wanted to touch base regarding ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to talk openly, identify any challenges, and discuss resources or adjustments that might help.

Please let me know your availability over the next few days.

Regards,
[Manager Name]`,
      points: `• Approach with curiosity, not criticism
• Focus on observable behaviours and outcomes
• Ask open-ended questions: "What's been going on?" "How can I help?"
• Discuss specific examples without making it personal
• Agree on next steps and a timeline for follow-up`,
      note: `Meeting scheduled with [Employee Name] re: performance discussion.
Tone: ${toneLabel}. Purpose: Review current work, explore supports.${contextNote}
Follow-up required within [timeframe].`,
    },
    "attendance-issue": {
      message: `Dear [Employee Name],

I hope you're doing well. I wanted to reach out to schedule a brief conversation about attendance patterns I've noticed recently.${context ? ` Specifically, ${context.toLowerCase().trim()}.` : ""}

My goal is to understand if there are any circumstances affecting your schedule and explore how we might address them together.

Please let me know a time that works for you.

Best regards,
[Manager Name]`,
      points: `• Express care for the employee's wellbeing first
• Present observations factually, without judgment
• Ask if there are circumstances you should be aware of
• Explore whether an accommodation may be needed
• Agree on next steps and a check-in date`,
      note: `Meeting requested with [Employee Name] re: attendance.
Tone: ${toneLabel}. Approach: Supportive inquiry.${contextNote}
Outcome and supports offered to be documented after meeting.`,
    },
    "accommodation-request": {
      message: `Dear [Employee Name],

Thank you for bringing your accommodation request to my attention.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I want to ensure we engage in a meaningful process to explore how we can support your needs.

Let's schedule a time to discuss your request and identify potential options. This conversation will remain confidential and focused on practical solutions.

I'll follow up shortly to arrange a meeting.

Sincerely,
[Manager Name]`,
      points: `• Thank the employee for coming forward
• Focus on functional limitations, not diagnosis
• Discuss essential duties of the role
• Explore options collaboratively
• Document the interactive process`,
      note: `Accommodation request received from [Employee Name].
Tone: ${toneLabel}. Interactive process initiated.${contextNote}
Medical details confidential. Next: schedule meeting, document outcomes.`,
    },
    "return-to-work": {
      message: `Dear [Employee Name],

Welcome back. I'm pleased to have you returning to the team.${context ? ` I understand ${context.toLowerCase().trim()}.` : ""}

Before your return, I'd like to meet briefly to discuss how we can support your transition. This may include reviewing workload, discussing any temporary adjustments, and ensuring you feel comfortable.

Please let me know your availability.

Looking forward to seeing you,
[Manager Name]`,
      points: `• Welcome the employee warmly and genuinely
• Avoid questions about medical details
• Focus on functional abilities and any work restrictions
• Discuss graduated return options if applicable
• Establish a communication plan for ongoing support`,
      note: `Return-to-work meeting scheduled for [Employee Name].
Tone: ${toneLabel}. Focus: Supportive reintegration.${contextNote}
Accommodations/modified duties to be documented after meeting.`,
    },
    "leave-request": {
      message: `Dear [Employee Name],

Thank you for submitting your leave request.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I've received it and will review it promptly.

If I need any additional information, I'll be in touch. In the meantime, please don't hesitate to reach out with questions.

Best regards,
[Manager Name]`,
      points: `• Acknowledge the request promptly
• Do not ask intrusive questions about the reason
• Review applicable leave entitlements
• Communicate approval timeline clearly
• Maintain confidentiality about the nature of leave`,
      note: `Leave request received from [Employee Name].
Tone: ${toneLabel}. Status: Under review.${contextNote}
Next: Confirm entitlements, communicate decision, arrange coverage.`,
    },
    "conflict-resolution": {
      message: `Dear [Employee Name],

I'd like to meet with you to discuss a workplace matter that has come to my attention.${context ? ` This relates to ${context.toLowerCase().trim()}.` : ""}

My goal is to understand different perspectives and work toward a respectful resolution. This conversation is intended to be constructive, and I'm approaching it with an open mind.

Could you please let me know your availability this week?

Thank you,
[Manager Name]`,
      points: `• Remain neutral—avoid taking sides
• Meet with parties separately first
• Focus on behaviours and impacts, not character
• Identify common ground and potential solutions
• Consider mediation resources if needed`,
      note: `Workplace matter involving [Employee Name].
Tone: ${toneLabel}. Approach: Impartial inquiry.${contextNote}
Confidentiality maintained. Findings and outcomes to be documented.`,
    },
    "policy-reminder": {
      message: `Dear Team,

I wanted to remind everyone of our workplace expectations regarding [policy area].${context ? ` ${context}` : ""}

As a team, we share responsibility for maintaining a professional environment. If you have questions or need clarification, please reach out to me or HR.

Thank you for your continued professionalism.

Best regards,
[Manager Name]`,
      points: `• Keep the message general—don't single anyone out
• Reference the policy clearly but not punitively
• Frame as a helpful reminder
• Offer to answer questions
• Follow up individually if specific concerns exist`,
      note: `Policy reminder issued to team re: [topic].
Tone: ${toneLabel}. Distribution: Team-wide.${contextNote}
Individual follow-up if warranted.`,
    },
    "check-in": {
      message: `Dear [Employee Name],

I wanted to check in and see how you're doing.${context ? ` ${context}` : " I've noticed some changes recently and"} want to make sure you know I'm here to support you.

There's no pressure to share anything you're not comfortable with. If there's anything affecting your work or wellbeing you'd like to discuss, I'm happy to listen.

Would you have time for a brief conversation this week?

Take care,
[Manager Name]`,
      points: `• Approach with genuine care, no hidden agenda
• Make clear the conversation is voluntary
• Listen more than you speak
• Share available resources (EAP) without pressure
• Respect their privacy if they decline`,
      note: `Wellness check-in initiated with [Employee Name].
Tone: ${toneLabel}. Approach: Supportive, non-intrusive.${contextNote}
Resources offered: [EAP/other]. Follow-up as agreed.`,
    },
    "probation-review": {
      message: `Dear [Employee Name],

As you approach the end of your probationary period, I'd like to schedule a meeting to discuss your progress.${context ? ` I'd particularly like to discuss ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to reflect on your accomplishments, discuss areas for growth, and talk about your future with the team.

Please let me know your availability this week.

Best regards,
[Manager Name]`,
      points: `• Prepare specific examples of strengths and development areas
• Be clear about whether probation will be confirmed
• Provide actionable, forward-looking feedback
• Allow the employee to share their perspective
• Document the conversation formally`,
      note: `Probationary review for [Employee Name].
Tone: ${toneLabel}. Probation end date: [Date].${contextNote}
Outcome to be documented. HR notified if probation not confirmed.`,
    },
    "termination": {
      message: `Dear [Employee Name],

I am writing to confirm our conversation regarding the end of your employment with [Organization], effective [Date].${context ? ` As discussed, ${context.toLowerCase().trim()}.` : ""}

Please find attached information regarding your final pay, benefits continuation, and other relevant matters. For questions about logistics, please contact HR at [contact info].

We appreciate your contributions and wish you well in your future endeavours.

Sincerely,
[Manager Name]`,
      points: `• Ensure HR is involved before the conversation
• Be direct but compassionate—don't prolong uncertainty
• Have all documentation prepared
• Allow the employee to ask questions
• Treat the person with dignity throughout`,
      note: `Employment ended for [Employee Name]. Effective: [Date].
Tone: ${toneLabel}. HR involved: Yes.${contextNote}
Documentation provided. Final pay and ROE to be processed.`,
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
