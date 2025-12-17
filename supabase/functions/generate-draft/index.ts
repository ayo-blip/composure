import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarios, tone, sector, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const scenarioDescriptions: Record<string, string> = {
      "performance-concern": "addressing a performance concern with an employee",
      "attendance-issue": "discussing attendance patterns with an employee",
      "accommodation-request": "responding to a workplace accommodation request",
      "mental-health-disclosure": "responding to an employee's mental health disclosure",
      "return-to-work": "welcoming an employee back after a leave of absence",
      "leave-request": "acknowledging a leave request from an employee",
      "conflict-resolution": "addressing a workplace conflict or conduct issue",
      "policy-reminder": "reminding the team about policy expectations",
      "check-in": "conducting a wellness check-in with an employee showing changes",
      "probation-review": "conducting a probationary period review",
      "termination": "communicating an employment ending decision",
      "difficult-timing": "initiating a necessary but sensitive conversation during a difficult time",
      "follow-up": "following up after a difficult or important meeting",
      "declining-request": "declining an employee's request professionally",
      "resetting-expectations": "resetting performance or conduct expectations",
    };

    const toneDescriptions: Record<string, string> = {
      "supportive": "warm, encouraging, and focused on the employee's wellbeing",
      "neutral": "balanced, factual, and objective without emotional weight",
      "collaborative": "partnership-oriented, inviting input and joint problem-solving",
      "firm": "clear and direct while remaining respectful and fair",
      "compassionate": "deeply empathetic, acknowledging difficulty while maintaining professionalism",
      "professional": "formal, polished, and business-appropriate",
    };

    const sectorGuidance: Record<string, string> = {
      "private": "Private sector context - focus on business outcomes while being fair.",
      "public": "Public sector context - be more conservative, mindful of transparency requirements and public accountability.",
      "unionized": "Unionized environment - be mindful of collective agreements, avoid language that could be grieved, emphasize process.",
    };

    const primaryScenario = scenarios[0];
    const additionalScenarios = scenarios.slice(1);

    const systemPrompt = `You are an expert HR communications specialist helping managers draft thoughtful, professional workplace messages. 

Your role is to generate communications that are:
- Clear and actionable
- Empathetic without being overly soft
- Legally mindful (avoiding promises, medical inquiries, or discriminatory language)
- Appropriate for the workplace context

CRITICAL RULES:
1. NEVER provide legal or medical advice
2. NEVER assign blame or make judgments about the employee
3. Use plain, professional language
4. Include placeholders like [Employee Name], [Manager Name], [Date], [specific details] where appropriate
5. Focus on behavior and outcomes, not personality
6. Maintain confidentiality - don't reference specifics that could identify individuals

${sectorGuidance[sector]}`;

    const userPrompt = `Generate workplace communication materials for the following situation:

PRIMARY SCENARIO: ${scenarioDescriptions[primaryScenario] || primaryScenario}
${additionalScenarios.length > 0 ? `\nADDITIONAL CONSIDERATIONS: ${additionalScenarios.map((s: string) => scenarioDescriptions[s] || s).join(', ')}` : ''}

DESIRED TONE: ${toneDescriptions[tone] || tone}

${context ? `CONTEXT PROVIDED BY MANAGER: ${context}` : 'No additional context provided.'}

Please generate:

1. **DRAFT MESSAGE**: A professional email or message the manager can send. Should be complete and ready to customize. Address the employee directly (use "you" not "the employee").

2. **KEY TALKING POINTS**: 5-6 bullet points for an in-person conversation covering what to discuss, what to avoid, and how to handle reactions.

3. **DOCUMENTATION NOTE**: A brief, factual note suitable for HR records documenting this interaction. Use neutral, objective language.

4. **RISK ASSESSMENT**: Identify 3-4 specific risks or considerations for this situation given the scenario, tone, and sector. Rate overall risk as Low, Moderate, or High.

5. **CONFIDENCE SCORE**: Rate 1-10 how ready this draft is to send, with 2-3 strengths and 1 suggestion for improvement.

Format your response as JSON with this exact structure:
{
  "draftMessage": "...",
  "talkingPoints": "• Point 1\n• Point 2\n...",
  "documentationNote": "...",
  "riskCheck": "...",
  "riskLevel": "Low" | "Moderate" | "High",
  "confidence": {
    "score": 8.5,
    "strengths": ["strength 1", "strength 2"],
    "suggestion": "one improvement suggestion or null"
  }
}`;

    console.log('Calling Lovable AI for draft generation...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please check your workspace credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response - handle markdown code blocks
    let parsed;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\n?/g, '');
      }
      parsed = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-draft function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
