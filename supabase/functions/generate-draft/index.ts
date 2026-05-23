import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function retrievePolicyContext(
  situationText: string,
  organisationId: string,
  openAiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<{ chunks: string[]; used: boolean }> {
  try {
    // Embed the situation text
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: situationText.slice(0, 8000),
        model: 'text-embedding-3-small',
      }),
    });

    if (!embeddingRes.ok) return { chunks: [], used: false };

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data?.[0]?.embedding;
    if (!embedding) return { chunks: [], used: false };

    // Search for similar chunks in this org's knowledge base
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      org_id: organisationId,
      match_count: 5,
    });

    if (error || !data || data.length === 0) return { chunks: [], used: false };

    return {
      chunks: data.map((row: { content: string }) => row.content),
      used: true,
    };
  } catch (err) {
    console.error('RAG retrieval failed, continuing without policies:', err);
    return { chunks: [], used: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarios, tone, sector, context, organisation_id, user_id } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const PLAN_LIMITS: Record<string, number> = { starter: 10, professional: 150, enterprise: -1 };

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
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
      "private": "Private sector context — focus on business outcomes while being fair.",
      "public": "Public sector context — be more conservative, mindful of transparency requirements and public accountability.",
      "unionized": "Unionized environment — be mindful of collective agreements, avoid language that could be grieved, emphasize process.",
    };

    const primaryScenario = scenarios[0];
    const additionalScenarios = scenarios.slice(1);
    const situationText = context || scenarios.map((s: string) => scenarioDescriptions[s] || s).join(', ');

    // Run org check and RAG retrieval in parallel to reduce latency
    const orgCheckPromise = (async () => {
      if (!organisation_id || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { jurisdictionNote: '', blocked: false };
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

        const [orgRes, usageRes] = await Promise.all([
          sb.from('organisations').select('jurisdiction, plan_tier').eq('id', organisation_id).single(),
          sb.from('usage_logs').select('id', { count: 'exact', head: true })
            .eq('organisation_id', organisation_id).gte('created_at', monthStart.toISOString()),
        ]);

        const orgData = orgRes.data;
        const limit = PLAN_LIMITS[orgData?.plan_tier ?? 'starter'] ?? 10;
        if (limit !== -1 && (usageRes.count ?? 0) >= limit) {
          return { jurisdictionNote: '', blocked: true, limit };
        }
        const note = (orgData?.jurisdiction && orgData.jurisdiction !== 'other')
          ? `\nJURISDICTION: ${orgData.jurisdiction.toUpperCase()} — tailor guidance to employment law in this jurisdiction where relevant.`
          : '';
        return { jurisdictionNote: note, blocked: false };
      } catch (e) {
        console.error('Org check failed:', e);
        return { jurisdictionNote: '', blocked: false };
      }
    })();

    const ragPromise = (organisation_id && OPENAI_API_KEY && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
      ? retrievePolicyContext(situationText, organisation_id, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : Promise.resolve({ chunks: [], used: false });

    const [orgCheck, ragResult] = await Promise.all([orgCheckPromise, ragPromise]);

    if (orgCheck.blocked) {
      return new Response(JSON.stringify({ error: `Monthly draft limit of ${orgCheck.limit} reached. Please upgrade your plan.` }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jurisdictionNote = orgCheck.jurisdictionNote;
    let policiesUsed = false;
    let policyBlock = '';

    if (ragResult.used && ragResult.chunks.length > 0) {
      policiesUsed = true;
      policyBlock = `--- ORGANISATION POLICIES AND PROCEDURES ---
${ragResult.chunks.join('\n\n---\n\n')}
--- END OF POLICIES ---

Use the organisation's policies above where relevant when crafting your response. If a policy directly applies, reflect its language and approach.

`;
    }

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
6. Maintain confidentiality — don't reference specifics that could identify individuals

${sectorGuidance[sector]}${jurisdictionNote}`;

    const userPrompt = `${policyBlock}Generate workplace communication materials for the following situation:

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit reached. Please wait a moment and try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) throw new Error('No content in AI response');

    let parsed;
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\n?/g, '');
      }
      parsed = JSON.parse(cleanContent.trim());
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Log this generation for usage tracking
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient: createClientForLog } = await import('https://esm.sh/@supabase/supabase-js@2');
        const sbLog = createClientForLog(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await sbLog.from('usage_logs').insert({
          organisation_id: organisation_id ?? null,
          user_id: user_id ?? null,
        });
      } catch { /* non-critical */ }
    }

    return new Response(JSON.stringify({ ...parsed, policiesUsed }), {
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
