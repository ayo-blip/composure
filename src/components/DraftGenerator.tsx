import { useState } from "react";
import { FileText, MessageSquare, ClipboardList, Sparkles, ShieldAlert, RefreshCw, ThumbsUp } from "lucide-react";
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

type RiskLevel = "Low" | "Moderate" | "High";

const generateRiskCheck = (scenario: string, tone: string, context: string): { riskCheck: string; riskLevel: RiskLevel } => {
  // Determine risk level based on scenario characteristics
  const highRiskScenarios = ["termination", "mental-health-disclosure", "accommodation-request"];
  const moderateRiskScenarios = ["performance-concern", "attendance-issue", "probation-review", "conflict-resolution", "difficult-timing", "resetting-expectations"];
  
  let riskLevel: RiskLevel = "Low";
  
  // Check scenario type
  if (highRiskScenarios.includes(scenario)) {
    riskLevel = "High";
  } else if (moderateRiskScenarios.includes(scenario)) {
    riskLevel = "Moderate";
  }
  
  // Elevate risk if context contains sensitive keywords
  if (context) {
    const contextLower = context.toLowerCase();
    const sensitiveTerms = ["disability", "medical", "health", "discipline", "warning", "termination", "accommodation", "harassment", "discrimination"];
    if (sensitiveTerms.some(term => contextLower.includes(term))) {
      if (riskLevel === "Low") riskLevel = "Moderate";
      else if (riskLevel === "Moderate") riskLevel = "High";
    }
  }
  
  // Firm tone can elevate risk
  if (tone === "firm" && riskLevel !== "High") {
    riskLevel = riskLevel === "Low" ? "Moderate" : "High";
  }

  const riskChecks: Record<string, string[]> = {
    "performance-concern": [
      "Consider whether performance issues may relate to an undisclosed disability or medical condition requiring accommodation",
      "Ensure feedback is based on documented, objective criteria—not subjective impressions",
      "Avoid language that could be perceived as singling out or targeting the employee",
      "Confirm expectations have been clearly communicated before this conversation",
      "Document the discussion and agreed next steps promptly",
    ],
    "attendance-issue": [
      "Attendance issues may signal a need for accommodation—do not probe for medical details",
      "Avoid assumptions about reasons for absences; focus on operational impact only",
      "Ensure any attendance standards are applied consistently across the team",
      "Consider whether family status, disability, or other protected grounds may be relevant",
      "Document the pattern and conversation without speculating on causes",
    ],
    "accommodation-request": [
      "Engage in the interactive process in good faith—delays can create liability",
      "Focus on functional limitations, not diagnosis or medical details",
      "Document all options considered and reasons for decisions",
      "Avoid suggesting the employee is not suited for the role",
      "Ensure confidentiality of any medical information shared",
    ],
    "mental-health-disclosure": [
      "Do not document diagnosis or specific medical details—record functional needs only",
      "Avoid making assumptions about capability based on disclosure",
      "Ensure confidentiality is maintained; limit information to those with a need to know",
      "Do not pressure the employee to share more than they choose to",
      "Follow up appropriately without over-checking or signaling concern",
    ],
    "return-to-work": [
      "Do not request medical documentation beyond what is required for accommodation purposes",
      "Avoid discussing the reason for absence unless the employee raises it",
      "Ensure any restrictions are applied as documented—do not assume capability",
      "Consider privacy when reintegrating; avoid drawing attention to the absence",
      "Document any agreed modifications and follow-up dates",
    ],
    "leave-request": [
      "Ensure leave entitlements are applied consistently and in accordance with policy",
      "Do not ask for details beyond what is required to process the request",
      "Consider protected grounds (family status, disability) if leave relates to caregiving or health",
      "Avoid language that could discourage future legitimate requests",
      "Document the request and decision clearly",
    ],
    "conflict-resolution": [
      "Gather facts from all parties before drawing conclusions",
      "Avoid language that pre-judges the situation or assigns blame",
      "Consider whether the conflict may involve harassment or discrimination allegations",
      "Document the process and any actions taken consistently for all involved",
      "Ensure the employee has an opportunity to respond to concerns raised",
    ],
    "policy-reminder": [
      "Ensure the policy is applied consistently across all employees",
      "Avoid singling out individuals in group communications if the issue is specific",
      "Consider whether the policy may have disproportionate impact on protected groups",
      "Document the reminder and any individual follow-up separately",
    ],
    "check-in": [
      "Avoid probing into personal matters unless the employee volunteers information",
      "Do not make assumptions about the cause of observed changes",
      "Ensure offers of support are genuine and not used to build a performance file",
      "Document observations factually without speculation",
      "Consider whether observed changes may relate to a protected ground",
    ],
    "probation-review": [
      "Ensure evaluation criteria are documented and have been consistently applied",
      "Avoid feedback that could be seen as based on protected characteristics",
      "Consider whether any performance issues may require accommodation",
      "Document the outcome and rationale clearly",
      "Provide the employee an opportunity to respond to concerns",
    ],
    "termination": [
      "Confirm all documentation is in order and HR has approved the decision",
      "Avoid discussing reasons beyond what is documented and necessary",
      "Ensure the termination is not connected to recent protected activity (complaints, leave, accommodation requests)",
      "Maintain dignity and respect throughout the conversation",
      "Consider timing—avoid terminations immediately before holidays or during known personal crises if possible",
      "Document the meeting and provide written confirmation",
    ],
    "difficult-timing": [
      "Consider whether proceeding now could appear retaliatory or insensitive",
      "Document the business reason for the timing",
      "Ensure the employee's emotional state is considered in delivery approach",
      "Avoid proceeding if the employee is in crisis unless absolutely necessary",
      "Follow up to ensure the message was understood",
    ],
    "follow-up": [
      "Ensure the summary accurately reflects what was discussed—avoid adding new expectations",
      "Do not include information the employee did not agree to share",
      "Confirm the employee has an opportunity to correct any misunderstandings",
      "Document consistently; avoid language that differs from the tone of the meeting",
    ],
    "declining-request": [
      "Ensure the rationale is consistent with how similar requests have been handled",
      "Avoid language that could be perceived as dismissive or punitive",
      "Consider whether the request relates to a protected ground requiring accommodation",
      "Document the request, rationale, and decision",
      "Offer alternatives where appropriate to reduce perception of rigidity",
    ],
    "resetting-expectations": [
      "Ensure new expectations are documented and consistently applied",
      "Avoid framing that could be seen as retaliation or targeting",
      "Consider whether prior expectations were clearly communicated",
      "Focus forward; do not relitigate past issues in a way that escalates conflict",
      "Document the conversation and provide written confirmation of expectations",
    ],
  };

  const defaultRisks = [
    "Review message for tone that could escalate conflict or be perceived as threatening",
    "Ensure documentation captures key points without subjective commentary",
    "Consider timing and delivery method for the communication",
    "Confirm approach is consistent with how similar situations have been handled",
  ];

  const risks = riskChecks[scenario] || defaultRisks;
  
  // Add tone-specific considerations
  const toneRisks: string[] = [];
  if (tone === "firm") {
    toneRisks.push("Firm tone may be appropriate but ensure it does not cross into intimidation");
  }
  if (tone === "compassionate" || tone === "supportive") {
    toneRisks.push("Supportive tone is positive but avoid over-promising or creating implied commitments");
  }

  // Add context-specific consideration if context provided
  if (context && context.length > 0) {
    toneRisks.push("Custom context provided—ensure any specifics are appropriate to include in documentation");
  }

  const allRisks = [...risks.slice(0, 4), ...toneRisks].slice(0, 6);
  
  return {
    riskCheck: allRisks.map(risk => `• ${risk}`).join("\n"),
    riskLevel,
  };
};

type ConfidenceScore = {
  score: number;
  strengths: string[];
  suggestion: string | null;
};

const generateConfidenceScore = (scenario: string, tone: string, riskLevel: RiskLevel): ConfidenceScore => {
  // Base score starts at 7.0
  let score = 7.0;
  const strengths: string[] = [];
  let suggestion: string | null = null;

  // Tone bonuses
  if (tone === "supportive" || tone === "compassionate") {
    score += 1.0;
    strengths.push("Empathetic and supportive tone");
  } else if (tone === "collaborative") {
    score += 0.8;
    strengths.push("Collaborative approach builds trust");
  } else if (tone === "neutral" || tone === "professional") {
    score += 0.5;
    strengths.push("Professional and balanced tone");
  } else if (tone === "firm") {
    score += 0.3;
    strengths.push("Clear and direct communication");
  }

  // Scenario-based adjustments
  const lowerRiskScenarios = ["check-in", "leave-request", "follow-up", "policy-reminder"];
  const higherRiskScenarios = ["termination", "mental-health-disclosure", "accommodation-request"];
  
  if (lowerRiskScenarios.includes(scenario)) {
    score += 0.5;
    strengths.push("Straightforward scenario with clear approach");
  } else if (higherRiskScenarios.includes(scenario)) {
    score -= 0.3;
    suggestion = "Consider having HR review before sending";
  }

  // Risk level adjustments
  if (riskLevel === "Low") {
    score += 0.5;
    strengths.push("Low risk of misinterpretation");
  } else if (riskLevel === "Moderate") {
    if (!suggestion) suggestion = "Minor wording adjustments may help";
  } else if (riskLevel === "High") {
    score -= 0.5;
    if (!suggestion) suggestion = "Review with HR before proceeding";
  }

  // Add default strengths if we don't have enough
  if (strengths.length < 2) {
    strengths.push("Clear intent and purpose");
  }
  if (strengths.length < 3) {
    strengths.push("Respectful and professional language");
  }

  // Clamp score between 5.0 and 9.5
  score = Math.max(5.0, Math.min(9.5, score));
  
  // Round to one decimal
  score = Math.round(score * 10) / 10;

  return { score, strengths: strengths.slice(0, 3), suggestion };
};

const generateSaferVersion = (originalMessage: string, scenario: string): string => {
  // Safer version templates that preserve intent, soften tone, remove assumptions, add empathy
  // Guardrail: Never imply discipline, termination, or legal compliance
  
  const saferTemplates: Record<string, string> = {
    "performance-concern": `Dear [Employee Name],

I hope this message finds you well. I wanted to reach out to schedule a conversation with you.

My goal is to check in on how things are going and to understand if there's anything I can do to better support you in your role. This is meant to be a two-way conversation where we can discuss your experience, any challenges you might be facing, and how we can work together going forward.

Please let me know what times work best for you over the next few days.

Warm regards,
[Manager Name]`,
    "attendance-issue": `Dear [Employee Name],

I wanted to reach out to schedule a brief conversation with you.

I'd like to understand your perspective on recent scheduling and to discuss how we can work together to meet operational needs while supporting your situation. This is not about assigning blame—it's about finding a path forward that works for everyone.

Please let me know your availability.

Warm regards,
[Manager Name]`,
    "accommodation-request": `Dear [Employee Name],

Thank you for reaching out. I want you to know that I take your request seriously and am committed to exploring options that work for both you and the team.

Let's schedule a time to have a confidential conversation about how we can best support you. There's no need to share more than you're comfortable with—we can focus on practical solutions.

I'll follow up shortly to arrange a time that works for you.

Warm regards,
[Manager Name]`,
    "mental-health-disclosure": `Dear [Employee Name],

Thank you for trusting me with this. I want you to know that your wellbeing matters, and this conversation will remain confidential.

I'm here to listen and to explore any adjustments that might help you feel more supported at work. There's no pressure to share anything beyond what you choose to.

If and when you're ready, I'm available to talk. In the meantime, please know that our Employee Assistance Program is available if you'd find it helpful.

Take care,
[Manager Name]`,
    "return-to-work": `Dear [Employee Name],

Welcome back—it's good to have you returning. I hope you're feeling ready, and I want to make sure your transition back is as smooth as possible.

Let's find a time to connect so I can catch you up on what's been happening and learn about any support you might need. There's no rush, and we can take things at whatever pace works for you.

Looking forward to seeing you.

Warm regards,
[Manager Name]`,
    "termination": `Dear [Employee Name],

I'm writing to follow up on our conversation regarding the changes to your employment.

I recognize this is a significant transition, and I want to ensure you have the information you need. Please find attached the relevant details. If you have any questions, HR is available to assist.

I wish you the very best going forward.

Sincerely,
[Manager Name]`,
    "difficult-timing": `Dear [Employee Name],

I recognize this might not feel like the ideal time, and I want to acknowledge that. I wouldn't be reaching out if it weren't important.

There's a matter I'd like to discuss with you—not urgently, but soon. My goal is to have a thoughtful conversation, and I'm happy to work around your schedule.

Would you be open to finding a time this week or early next?

Warm regards,
[Manager Name]`,
    "conflict-resolution": `Dear [Employee Name],

I'd like to schedule a conversation with you about a workplace matter. My goal is simply to understand different perspectives and to find a constructive path forward.

This is not about assigning fault—it's about ensuring everyone feels heard and that we can work well together as a team.

Could you let me know when you'd be available for a confidential conversation?

Thank you,
[Manager Name]`,
    "probation-review": `Dear [Employee Name],

As we approach the end of your initial period with us, I'd like to schedule a conversation to reflect on how things have been going from your perspective and mine.

This is an opportunity for us to discuss your experience, what's been working well, and any areas where additional support might be helpful. My goal is for us both to leave the conversation with clarity about next steps.

Please let me know your availability.

Warm regards,
[Manager Name]`,
  };

  // Return safer version if available, otherwise apply general softening
  if (saferTemplates[scenario]) {
    return saferTemplates[scenario];
  }

  // Generic safer transformation for scenarios without specific templates
  return originalMessage
    .replace(/I need to/gi, "I'd like to")
    .replace(/You must/gi, "It would be helpful if you could")
    .replace(/required/gi, "requested")
    .replace(/immediately/gi, "when you're able")
    .replace(/failure to/gi, "if we're unable to")
    .replace(/consequences/gi, "next steps")
    .replace(/Regards,/g, "Warm regards,");
};

export function DraftGenerator() {
  const [scenarioType, setScenarioType] = useState("");
  const [tone, setTone] = useState("");
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

  const handleGenerate = async () => {
    if (!scenarioType || !tone) return;

    setIsGenerating(true);
    setOutput(null);
    setSaferVersion(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = generateDraft(scenarioType, tone, context);
    const { riskCheck, riskLevel } = generateRiskCheck(scenarioType, tone, context);
    const confidence = generateConfidenceScore(scenarioType, tone, riskLevel);
    setOutput({ ...result, riskCheck, riskLevel, confidence });
    setIsGenerating(false);
  };

  const handleGenerateSafer = async () => {
    if (!output) return;

    setIsGeneratingSafer(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const safer = generateSaferVersion(output.draftMessage, scenarioType);
    setSaferVersion(safer);
    setIsGeneratingSafer(false);
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
          <OutputCard
            title="Risk Check"
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
              <h3 className="font-heading text-lg font-semibold text-foreground">Manager Confidence Score</h3>
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

          {/* Generate Safer Version Button */}
          {!saferVersion && (
            <div className="flex justify-center opacity-0 animate-slide-up" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
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
                    Generate Safer Version
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Safer Version Output */}
          {saferVersion && (
            <OutputCard
              title="Safer Version"
              content={saferVersion}
              icon={<RefreshCw className="w-4 h-4" />}
              delay={0}
              isVisible={!!saferVersion}
              headerContent={
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Softened Tone
                </span>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
