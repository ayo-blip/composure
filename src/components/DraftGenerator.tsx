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

I would like to schedule a meeting with you to discuss current work outputs and expectations for your role.${context ? ` I wanted to touch base regarding ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to review priorities, clarify what's needed going forward, and discuss any supports that might help.

Please let me know your availability over the next few days.

Regards,
[Manager Name]`,
      points: `• Describe specific conduct: missed deadlines, incomplete deliverables, or process gaps
• Explain the impact: effect on team workload, project timelines, or client service
• Clarify expectations: what success looks like going forward
• Ask about barriers and explore supports
• Agree on measurable actions and a follow-up date`,
      note: `Meeting with [Employee Name] re: performance expectations.
Tone: ${toneLabel}. Conduct discussed: [specific items].
Impact: [effect on team/work]. Expectations clarified.${contextNote}
Next steps agreed. Follow-up scheduled: [date].`,
    },
    "attendance-issue": {
      message: `Dear [Employee Name],

I hope you're doing well. I wanted to schedule a brief conversation about attendance patterns observed in recent weeks.${context ? ` Specifically, ${context.toLowerCase().trim()}.` : ""}

My goal is to understand the situation and discuss how we can work together to meet scheduling expectations.

Please let me know a time that works for you.

Best regards,
[Manager Name]`,
      points: `• State the conduct: specific dates, late arrivals, or unplanned absences
• Explain the impact: coverage gaps, workload shifts for colleagues, service delays
• Clarify expectations: attendance standards and notification requirements
• Ask about circumstances and explore accommodations if needed
• Agree on expectations going forward and a check-in date`,
      note: `Meeting with [Employee Name] re: attendance.
Tone: ${toneLabel}. Conduct: [dates/pattern observed].
Impact: [coverage/team effect]. Expectations reviewed.${contextNote}
Next steps agreed. Follow-up: [date].`,
    },
    "accommodation-request": {
      message: `Dear [Employee Name],

Thank you for bringing your accommodation request to my attention.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I want to ensure we explore options that support your ability to meet the requirements of your role.

Let's schedule a time to discuss functional needs and potential adjustments. This conversation will remain confidential.

I'll follow up shortly to arrange a meeting.

Sincerely,
[Manager Name]`,
      points: `• Focus on functional requirements, not diagnosis
• Review essential job duties and performance expectations
• Explore adjustments: schedule, tasks, equipment, environment
• Discuss how changes would support meeting expectations
• Document options considered and decisions made`,
      note: `Accommodation request from [Employee Name].
Tone: ${toneLabel}. Interactive process initiated.${contextNote}
Focus: Functional needs and job requirements.
Options explored. Outcome to be documented.`,
    },
    "return-to-work": {
      message: `Dear [Employee Name],

Welcome back. I'm pleased to have you returning to the team.${context ? ` I understand ${context.toLowerCase().trim()}.` : ""}

Before your return, I'd like to meet briefly to review current priorities and discuss expectations for your transition period.

Please let me know your availability.

Looking forward to seeing you,
[Manager Name]`,
      points: `• Review current work priorities and team needs
• Clarify any documented restrictions and their impact on duties
• Discuss expectations for the transition period
• Identify key deliverables and timelines
• Establish check-in points to assess progress`,
      note: `Return-to-work meeting for [Employee Name].
Tone: ${toneLabel}. Priorities reviewed.${contextNote}
Expectations for transition clarified.
Modified duties (if any) documented. Check-in scheduled.`,
    },
    "leave-request": {
      message: `Dear [Employee Name],

Thank you for submitting your leave request.${context ? ` Regarding ${context.toLowerCase().trim()}, ` : " "}I've received it and will review it promptly.

If I need any additional information, I'll be in touch. Please let me know if you have questions.

Best regards,
[Manager Name]`,
      points: `• Confirm dates and duration requested
• Discuss impact on current projects or deadlines
• Clarify handover expectations and coverage plan
• Communicate approval timeline
• Document the request and decision`,
      note: `Leave request from [Employee Name].
Tone: ${toneLabel}. Dates: [requested].${contextNote}
Coverage plan: [to be arranged].
Decision communicated: [date].`,
    },
    "conflict-resolution": {
      message: `Dear [Employee Name],

I'd like to meet with you to discuss a workplace matter that has been brought to my attention.${context ? ` This relates to ${context.toLowerCase().trim()}.` : ""}

My goal is to understand the situation, discuss the impact on the work environment, and clarify expectations going forward.

Could you please let me know your availability this week?

Thank you,
[Manager Name]`,
      points: `• Describe the specific conduct or incident reported
• Explain the impact: effect on colleagues, team dynamics, or work environment
• Gather the employee's perspective on what occurred
• Clarify expectations for respectful conduct going forward
• Document the conversation and any agreed actions`,
      note: `Workplace matter discussed with [Employee Name].
Tone: ${toneLabel}. Conduct: [specific incident].
Impact: [effect on team/environment].${contextNote}
Expectations clarified. Actions agreed and documented.`,
    },
    "policy-reminder": {
      message: `Dear Team,

I wanted to remind everyone of expectations regarding [policy area].${context ? ` ${context}` : ""}

These standards help maintain a productive and respectful work environment for the entire team. If you have questions about what's expected, please reach out.

Thank you,
[Manager Name]`,
      points: `• State the specific expectation or standard clearly
• Explain why it matters: impact on team, clients, or operations
• Clarify what compliance looks like in practice
• Offer to answer questions
• Follow up individually if specific conduct has been observed`,
      note: `Policy reminder issued re: [topic].
Tone: ${toneLabel}. Expectation: [specific standard].${contextNote}
Impact of compliance/non-compliance noted.
Individual follow-up if warranted.`,
    },
    "check-in": {
      message: `Dear [Employee Name],

I wanted to check in with you.${context ? ` ${context}` : " I've noticed some changes in work patterns recently and"} want to see if there's anything affecting your ability to meet expectations.

There's no obligation to share personal details. If there's something impacting your work that you'd like to discuss, I'm available.

Would you have time for a brief conversation this week?

Take care,
[Manager Name]`,
      points: `• Reference specific changes in conduct or output observed
• Ask open-ended questions without making assumptions
• Discuss any impact on deadlines or team responsibilities
• Clarify expectations if there's been a gap
• Offer available supports without pressure`,
      note: `Check-in with [Employee Name].
Tone: ${toneLabel}. Conduct observed: [pattern/change].${contextNote}
Impact discussed. Expectations reviewed if needed.
Supports offered. Follow-up as agreed.`,
    },
    "probation-review": {
      message: `Dear [Employee Name],

As you approach the end of your probationary period, I'd like to schedule a meeting to review your progress against the expectations for your role.${context ? ` I'd particularly like to discuss ${context.toLowerCase().trim()}.` : ""}

This is an opportunity to review what's been accomplished, discuss any gaps, and confirm next steps.

Please let me know your availability this week.

Best regards,
[Manager Name]`,
      points: `• Review conduct against documented expectations for the role
• Cite specific examples: deliverables met, processes followed, gaps observed
• Explain impact of performance on team or operations
• Clarify expectations if probation is confirmed or extended
• Document the discussion and outcome`,
      note: `Probationary review for [Employee Name].
Tone: ${toneLabel}. Probation end: [date].${contextNote}
Conduct reviewed against expectations.
Outcome: [confirmed/extended/not confirmed]. Documented.`,
    },
    "termination": {
      message: `Dear [Employee Name],

I am writing to confirm our conversation regarding the end of your employment with [Organization], effective [Date].${context ? ` As discussed, ${context.toLowerCase().trim()}.` : ""}

Attached is information regarding your final pay, benefits, and other relevant matters. For questions, please contact HR at [contact info].

We wish you well.

Sincerely,
[Manager Name]`,
      points: `• Confirm the decision is final and has HR approval
• State the effective date and general reason (conduct, performance, restructuring)
• Explain impact on final pay, benefits, and next steps
• Allow questions about logistics, not the decision itself
• Maintain professional and respectful tone throughout`,
      note: `Employment ended for [Employee Name]. Effective: [date].
Tone: ${toneLabel}. Reason: [documented separately].${contextNote}
HR involved: Yes. Documentation provided.
Final pay and ROE processed.`,
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
