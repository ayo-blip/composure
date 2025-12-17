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

  const drafts: Record<string, { message: string; points: string; note: string }> = {
    "performance-concern": {
      message: `Dear [Employee Name],

I would like to schedule a meeting with you to discuss your current work and explore how we can best support your success in your role.

${context ? `I wanted to touch base regarding ${context.toLowerCase().trim()}. ` : ""}This conversation is an opportunity for us to talk openly about your work, identify any challenges you may be facing, and discuss resources or adjustments that might be helpful.

Please let me know your availability over the next few days. I am committed to working together to find solutions that support both you and our team's goals.

Thank you for your continued efforts.

Regards,
[Manager Name]`,
      points: `• Approach the conversation with curiosity, not criticism
• Focus on observable behaviours and outcomes, not personality
• Ask open-ended questions: "What's been going on?" "How can I help?"
• Listen actively and avoid interrupting
• Discuss specific examples without making it personal
• Explore supports: training, workload adjustments, resources
• Document agreed-upon next steps and timelines
${context ? `• Address specific context: "${context}"` : ""}`,
      note: `Meeting scheduled with [Employee Name] regarding performance.
Tone: ${toneLabel}
Purpose: To discuss current work performance and explore supports.
${context ? `Context provided: ${context}` : "No additional context."}
Approach: Collaborative problem-solving; no assumptions about cause.
Follow-up: Document outcomes and any agreed-upon supports or timelines.`,
    },
    "attendance-issue": {
      message: `Dear [Employee Name],

I hope you're doing well. I wanted to reach out to schedule a brief conversation about attendance patterns I've noticed recently.

${context ? `Specifically, I'd like to discuss ${context.toLowerCase().trim()}. ` : ""}My goal is to understand if there are any circumstances affecting your schedule and to explore how we might work together to address them.

Please let me know a time that works for you. This is meant to be a supportive conversation, and I'm here to help find solutions.

Best regards,
[Manager Name]`,
      points: `• Start by expressing care for the employee's wellbeing
• Present attendance observations factually without judgment
• Ask if there are circumstances you should be aware of
• Explore whether an accommodation might be needed
• Review applicable policies together, if appropriate
• Discuss practical solutions collaboratively
• Agree on next steps and a check-in date
${context ? `• Address specific context: "${context}"` : ""}`,
      note: `Meeting requested with [Employee Name] to discuss attendance.
Tone: ${toneLabel}
Approach: Supportive inquiry; exploring underlying factors.
${context ? `Context: ${context}` : "No specific incidents noted."}
Next steps: Document conversation outcomes and any supports offered.`,
    },
    "accommodation-request": {
      message: `Dear [Employee Name],

Thank you for bringing your accommodation request to my attention. I appreciate you sharing this information with me.

${context ? `Regarding ${context.toLowerCase().trim()}, ` : ""}I want to ensure we engage in a meaningful process to explore how we can best support your needs. Let's schedule a time to discuss your request in more detail and identify potential options.

Please know this conversation will remain confidential and focused on finding practical solutions that work for both you and the team.

I'll follow up shortly to arrange a meeting. In the meantime, please don't hesitate to reach out if you have questions.

Sincerely,
[Manager Name]`,
      points: `• Thank the employee for coming forward
• Affirm commitment to the accommodation process
• Do not ask for diagnosis or medical details—focus on functional limitations
• Discuss the essential duties of the role
• Explore options collaboratively
• Document the interactive process
• Involve HR or specialists as needed
• Follow up in writing with agreed-upon accommodations
${context ? `• Consider context: "${context}"` : ""}`,
      note: `Accommodation request received from [Employee Name].
Tone: ${toneLabel}
${context ? `Details: ${context}` : "Specific details to be discussed in meeting."}
Process: Interactive dialogue to identify suitable accommodations.
Privacy: Medical information kept confidential.
Next steps: Schedule meeting; document process and outcomes.`,
    },
    "return-to-work": {
      message: `Dear [Employee Name],

Welcome back. I hope your time away was restorative, and I'm pleased to have you returning to the team.

${context ? `I understand ${context.toLowerCase().trim()}. ` : ""}Before your return, I'd like to meet briefly to discuss how we can support your transition back to work. This may include reviewing your current workload, discussing any temporary adjustments, and ensuring you feel comfortable as you settle in.

Please let me know your availability for a short meeting. I'm committed to making this transition as smooth as possible.

Looking forward to seeing you,
[Manager Name]`,
      points: `• Welcome the employee warmly and genuinely
• Avoid questions about medical details or reasons for absence
• Focus on functional abilities and any work restrictions provided
• Discuss graduated return options if applicable
• Review workload and priorities together
• Identify supports: modified duties, check-ins, resources
• Establish a communication plan for ongoing support
${context ? `• Consider: "${context}"` : ""}`,
      note: `Return to work meeting scheduled for [Employee Name].
Tone: ${toneLabel}
${context ? `Context: ${context}` : "Standard return from leave."}
Approach: Supportive reintegration; focus on functional capacity.
Documentation: Record any accommodations or modified duties agreed upon.`,
    },
    "leave-request": {
      message: `Dear [Employee Name],

Thank you for submitting your leave request. I've received it and want to acknowledge that taking time away when needed is important.

${context ? `Regarding ${context.toLowerCase().trim()}, ` : ""}I will review the request and follow up with you shortly. If there are any details we need to discuss or if I require additional information to process the request, I'll be in touch.

In the meantime, please don't hesitate to reach out if you have any questions.

Best regards,
[Manager Name]`,
      points: `• Acknowledge the request promptly and professionally
• Do not ask intrusive questions about the reason for leave
• Review applicable leave entitlements and policies
• Communicate timelines for approval clearly
• Discuss coverage plans for the absence
• Provide information about any required documentation
• Maintain confidentiality about the nature of the leave
${context ? `• Consider: "${context}"` : ""}`,
      note: `Leave request received from [Employee Name].
Tone: ${toneLabel}
Type of leave: [To be confirmed]
${context ? `Context: ${context}` : ""}
Status: Under review.
Next steps: Confirm entitlements; communicate decision; arrange coverage.`,
    },
    "conflict-resolution": {
      message: `Dear [Employee Name],

I'd like to meet with you to discuss a workplace matter that has come to my attention. My goal is to understand different perspectives and work toward a resolution that supports a respectful and productive work environment for everyone.

${context ? `This relates to ${context.toLowerCase().trim()}. ` : ""}Please know this conversation is intended to be constructive. I'm approaching this with an open mind and want to hear your perspective.

Could you please let me know your availability for a private meeting this week?

Thank you,
[Manager Name]`,
      points: `• Remain neutral—avoid taking sides prematurely
• Meet with parties separately first to understand perspectives
• Focus on behaviours and impacts, not intentions or character
• Use "I" statements and encourage the same
• Explore interests behind positions
• Identify common ground and potential solutions
• Document the process and agreed-upon outcomes
• Consider mediation resources if needed
${context ? `• Address: "${context}"` : ""}`,
      note: `Workplace conflict matter involving [Employee Name].
Tone: ${toneLabel}
${context ? `Situation: ${context}` : "Details to be gathered during meetings."}
Approach: Impartial fact-finding; focus on resolution.
Confidentiality: Maintained as appropriate.
Next steps: Meet with all parties; document findings and outcomes.`,
    },
    "policy-reminder": {
      message: `Dear Team,

I wanted to take a moment to remind everyone of our workplace expectations regarding [policy area].

${context ? `${context} ` : ""}As a team, we share responsibility for maintaining a professional and respectful environment. If you have any questions about these expectations or need clarification, please don't hesitate to reach out to me or HR.

Thank you for your continued professionalism and cooperation.

Best regards,
[Manager Name]`,
      points: `• Keep the message general—avoid singling anyone out
• Reference the policy clearly but without being heavy-handed
• Frame as a helpful reminder, not a reprimand
• Offer to answer questions or provide resources
• Follow up individually if specific concerns exist
• Document that a reminder was issued
${context ? `• Specific focus: "${context}"` : ""}`,
      note: `Policy reminder issued to team.
Tone: ${toneLabel}
Topic: [Policy area]
${context ? `Context: ${context}` : "General reminder."}
Distribution: Team-wide communication.
Follow-up: Individual discussions if warranted.`,
    },
    "check-in": {
      message: `Dear [Employee Name],

I wanted to check in and see how you're doing. I've noticed [observation], and I want to make sure you know I'm here to support you.

${context ? `${context} ` : ""}There's no pressure to share anything you're not comfortable with, but if there's anything affecting your work or wellbeing that you'd like to discuss, I'm happy to listen.

Would you have time for a brief, informal conversation this week? I'm available at your convenience.

Take care,
[Manager Name]`,
      points: `• Approach with genuine care and no hidden agenda
• Make clear the conversation is voluntary
• Do not diagnose or assume what's happening
• Listen more than you speak
• Ask how you can help, rather than prescribing solutions
• Share available resources (EAP, HR supports) without pressure
• Respect their privacy if they choose not to share
• Follow up as appropriate
${context ? `• Observation: "${context}"` : ""}`,
      note: `Wellness check-in initiated with [Employee Name].
Tone: ${toneLabel}
${context ? `Observation: ${context}` : "General wellness inquiry."}
Approach: Supportive, non-intrusive.
Resources mentioned: [EAP, other supports as appropriate]
Follow-up: As agreed with employee.`,
    },
    "probation-review": {
      message: `Dear [Employee Name],

As you approach the end of your probationary period, I'd like to schedule a meeting to discuss your progress and review your performance over these initial months.

${context ? `I'd particularly like to discuss ${context.toLowerCase().trim()}. ` : ""}This is an opportunity for us to reflect on your accomplishments, discuss any areas for growth, and talk about your future with the team.

Please let me know your availability for a meeting this week. I look forward to our conversation.

Best regards,
[Manager Name]`,
      points: `• Prepare specific examples of both strengths and development areas
• Be honest and clear about whether probation will be confirmed
• Provide feedback that is actionable and forward-looking
• Allow the employee to share their perspective
• Discuss goals and expectations for the continued role
• Document the conversation and outcomes formally
• If probation is not being confirmed, follow proper process and involve HR
${context ? `• Address: "${context}"` : ""}`,
      note: `Probationary review meeting for [Employee Name].
Tone: ${toneLabel}
Probation end date: [Date]
${context ? `Key discussion points: ${context}` : "Standard review."}
Outcome: [To be documented after meeting]
Next steps: Formal documentation of probation decision.`,
    },
    "termination": {
      message: `Dear [Employee Name],

I am writing to confirm our conversation regarding the end of your employment with [Organization], effective [Date].

${context ? `As discussed, ${context.toLowerCase().trim()}. ` : ""}Please find attached information regarding your final pay, benefits continuation, and any other relevant matters.

If you have questions about the logistics of your departure or require any documentation, please contact HR at [contact info].

We appreciate your contributions during your time with us and wish you well in your future endeavours.

Sincerely,
[Manager Name]`,
      points: `• Ensure HR is involved before any termination conversation
• Be direct but compassionate—do not prolong uncertainty
• Have documentation prepared: termination letter, ROE timeline, benefits info
• Allow the employee to respond and ask questions
• Explain logistics: final pay, return of property, references
• Treat the person with dignity throughout
• Do not discuss reasons beyond what is documented and approved
• Follow all organizational and legal requirements
${context ? `• Specific circumstances: "${context}"` : ""}`,
      note: `Employment ending for [Employee Name].
Tone: ${toneLabel}
Effective date: [Date]
${context ? `Context: ${context}` : "Reason documented separately."}
HR involvement: Confirmed.
Documentation provided: Termination letter, benefits information.
Follow-up: Final pay processing, ROE issuance.`,
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
              Context <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="context"
              placeholder="Add situational details, observations, or specific circumstances..."
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
