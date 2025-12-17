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

const generateDraft = (scenario: string, tone: string, context: string) => {
  const scenarioLabel = scenarioTypes.find(s => s.value === scenario)?.label || scenario;
  const toneLabel = tones.find(t => t.value === tone)?.label || tone;
  const contextNote = context ? `\nContext noted: ${context}` : "";

  const drafts: Record<string, { message: string; points: string; note: string }> = {
    "performance-concern": {
      message: `Dear [Employee Name],

I would like to schedule a meeting with you to discuss your work and how we can support your success going forward.${context ? ` ${context}` : ""}

This is an opportunity to clarify expectations, identify any barriers, and discuss resources that might help. I'm committed to working with you on a path forward.

Please let me know your availability over the next few days.

Regards,
[Manager Name]`,
      points: `• Clarify expectations: what success looks like in specific, measurable terms
• Identify gaps: describe the difference between current output and expectations
• Explore barriers: ask what's getting in the way and listen without judgment
• Discuss supports: training, resources, workload adjustments, clearer direction
• Agree on next steps: specific actions, timelines, and a follow-up date`,
      note: `Meeting with [Employee Name] re: performance discussion.
Tone: ${toneLabel}. Focus: Clarity, support, and next steps.${contextNote}
Expectations clarified. Barriers explored. Supports discussed.
Next steps agreed. Follow-up: [date].`,
    },
    "attendance-issue": {
      message: `Dear [Employee Name],

I wanted to schedule a time to meet with you to discuss attendance and how we can ensure coverage needs are met going forward.${context ? ` ${context}` : ""}

This conversation is an opportunity to review expectations and explore any supports that might help. Please let me know your availability.

Best regards,
[Manager Name]`,
      points: `• State the pattern observed: dates, frequency, or timing of absences
• Explain the operational impact: coverage gaps, rescheduling, effect on team or service
• Do not question legitimacy of absences or request medical details
• Review attendance expectations and notification procedures
• Discuss supports available and agree on expectations going forward`,
      note: `Meeting with [Employee Name] re: attendance pattern.
Tone: ${toneLabel}. Pattern: [dates/frequency observed].
Operational impact: [coverage, team workload, service].${contextNote}
Expectations reviewed. Supports discussed.
Follow-up: [date].`,
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
    "mental-health-disclosure": {
      message: `Dear [Employee Name],

Thank you for sharing this with me.${context ? ` I appreciate you letting me know about ${context.toLowerCase().trim()}.` : ""} I want you to know that this conversation will remain confidential.

My focus is on understanding how I can support you in meeting the expectations of your role. If there are adjustments to your work or schedule that might help, I'm open to discussing options.

Our Employee Assistance Program (EAP) is also available if you'd like additional support. There's no pressure to share more than you're comfortable with.

Would you like to schedule a time to talk further?

Best regards,
[Manager Name]`,
      points: `• Acknowledge the disclosure respectfully without probing for details
• Thank them for trusting you with this information
• Focus on work: what supports would help them meet expectations
• Offer available resources (EAP, flex options) without pressure
• Clarify that you don't need medical details—only functional needs`,
      note: `[Employee Name] disclosed mental health concern.
Tone: ${toneLabel}. Disclosure acknowledged respectfully.${contextNote}
Focus: Workplace supports and expectations.
Resources offered: EAP. No medical details requested or recorded.
Follow-up as agreed with employee.`,
    },
    "return-to-work": {
      message: `Dear [Employee Name],

Welcome back. I'm glad to have you returning to the team.${context ? ` ${context}` : ""}

I'd like to meet briefly to discuss your reintegration, review current priorities, and ensure you have what you need for a smooth transition. We can also discuss any documented restrictions and how they apply to your role.

Please let me know your availability.

Best regards,
[Manager Name]`,
      points: `• Welcome the employee and focus on reintegration
• Review current work priorities and what's changed during their absence
• Discuss any documented work restrictions and how they affect duties
• Clarify expectations for the transition period without overcommitting
• Do not promise specific accommodations—refer to HR if formal process needed`,
      note: `Return-to-work meeting for [Employee Name].
Tone: ${toneLabel}. Focus: Reintegration and expectations.${contextNote}
Documented restrictions reviewed. Expectations clarified.
Accommodations (if any) subject to formal process.
Check-in scheduled: [date].`,
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
    "difficult-timing": {
      message: `Dear [Employee Name],

I recognize this may not feel like an ideal time for this conversation.${context ? ` ${context}` : ""} I want to acknowledge that, and I wouldn't be reaching out if it weren't important.

There's a matter we need to discuss that affects your work, and addressing it now will help us move forward together. I'm committed to having this conversation with care and respect.

Could we find a time to meet this week?

Regards,
[Manager Name]`,
      points: `• Acknowledge the timing is sensitive without over-apologizing
• Explain briefly why the conversation is necessary now
• Emphasize that delaying would create larger issues or uncertainty
• Offer flexibility on scheduling while maintaining the need to meet
• Focus on moving forward constructively, not dwelling on the difficulty`,
      note: `Meeting scheduled with [Employee Name] during sensitive period.
Tone: ${toneLabel}. Timing acknowledged.${contextNote}
Reason for proceeding: [operational need/employee clarity/regulatory].
Conversation held with care. Outcome documented.`,
    },
    "follow-up": {
      message: `Dear [Employee Name],

Thank you for taking the time to meet with me today.${context ? ` ${context}` : ""} I wanted to follow up to summarize what we discussed and confirm our agreed next steps.

[Summary of key points discussed]

Going forward, the expectations are: [specific expectations]

Next steps:
• [Action item 1] – by [date]
• [Action item 2] – by [date]

We'll check in again on [date]. Please let me know if you have questions or concerns.

Best regards,
[Manager Name]`,
      points: `• Summarize key points from the meeting accurately and neutrally
• Restate expectations clearly so there's no ambiguity
• List specific next steps with owners and timelines
• Confirm the follow-up date
• Keep the tone consistent with the meeting—don't escalate or soften`,
      note: `Follow-up sent to [Employee Name] after [type of meeting].
Tone: ${toneLabel}. Meeting date: [date].${contextNote}
Summary: [key points]. Expectations restated.
Next steps: [actions and dates]. Follow-up: [date].`,
    },
    "declining-request": {
      message: `Dear [Employee Name],

Thank you for your request regarding [subject].${context ? ` ${context}` : ""} I've given it careful consideration.

Unfortunately, I'm not able to approve this request. [Brief rationale—e.g., operational needs, policy constraints, timing].

I understand this may be disappointing. If you'd like to discuss alternatives or have questions, I'm happy to talk further.

Regards,
[Manager Name]`,
      points: `• Acknowledge the request and thank them for raising it
• State the decision clearly and early—don't bury it
• Provide a brief, honest rationale without over-explaining or being defensive
• Avoid excessive apologies that undermine the decision
• Offer to discuss alternatives or answer questions if appropriate`,
      note: `Request from [Employee Name] declined.
Tone: ${toneLabel}. Request type: [subject].${contextNote}
Rationale: [brief reason]. Decision communicated respectfully.
Alternatives discussed: [yes/no]. Follow-up offered.`,
    },
    "resetting-expectations": {
      message: `Dear [Employee Name],

I'd like to meet with you to clarify expectations for your role going forward.${context ? ` ${context}` : ""}

This is an opportunity to ensure we're aligned on priorities, standards, and how success will be measured. My goal is to set you up for success with clear, consistent expectations.

Please let me know your availability this week.

Regards,
[Manager Name]`,
      points: `• Be specific about what expectations are being clarified or changed
• Explain why expectations are being reset (role evolution, prior ambiguity, performance gap)
• Focus on the future—what success looks like from this point forward
• Ensure expectations are measurable and consistently applied
• Avoid relitigating past issues; keep the focus forward-looking`,
      note: `Expectations reset with [Employee Name].
Tone: ${toneLabel}. Reason: [role change/clarity needed/performance gap].${contextNote}
Expectations clarified: [specific areas].
Focus: Forward-looking, measurable standards.
Follow-up: [date].`,
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
