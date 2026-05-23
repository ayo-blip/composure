import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JURISDICTION_LABELS: Record<string, string> = {
  on: 'Ontario, Canada', bc: 'British Columbia, Canada', ab: 'Alberta, Canada',
  qc: 'Quebec, Canada', mb: 'Manitoba, Canada', sk: 'Saskatchewan, Canada',
  ns: 'Nova Scotia, Canada', nb: 'New Brunswick, Canada', pe: 'Prince Edward Island, Canada',
  nl: 'Newfoundland & Labrador, Canada', nt: 'Northwest Territories, Canada',
  yt: 'Yukon, Canada', nu: 'Nunavut, Canada', federal: 'Federal Canada',
  us: 'United States', uk: 'United Kingdom', au: 'Australia', other: 'International',
};

async function retrievePolicyContext(
  query: string,
  organisationId: string,
  openAiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<string> {
  try {
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query.slice(0, 8000), model: 'text-embedding-3-small' }),
    });
    if (!embeddingRes.ok) return '';
    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data?.[0]?.embedding;
    if (!embedding) return '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      org_id: organisationId,
      match_count: 4,
    });
    if (!data || data.length === 0) return '';
    return data.map((r: { content: string }) => r.content).join('\n\n');
  } catch {
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { message, organisation_id, user_id } = await req.json();
    if (!message || !organisation_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const openAiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch org settings for jurisdiction
    const { data: org } = await supabase
      .from('organisations')
      .select('name, jurisdiction, plan_tier')
      .eq('id', organisation_id)
      .single();

    // Verify enterprise tier
    if (org?.plan_tier !== 'enterprise') {
      return new Response(JSON.stringify({ error: 'HR Assistant is available on the Enterprise plan.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch last 10 messages for conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('organisation_id', organisation_id)
      .eq('user_id', user_id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = (history ?? []).reverse();

    // Save user message
    await supabase.from('chat_messages').insert({
      organisation_id,
      user_id,
      role: 'user',
      content: message,
    });

    // Retrieve policy context
    const policyContext = openAiKey
      ? await retrievePolicyContext(message, organisation_id, openAiKey, supabaseUrl, supabaseServiceKey)
      : '';

    const jurisdictionLabel = JURISDICTION_LABELS[org?.jurisdiction ?? 'other'] ?? 'the applicable jurisdiction';

    const systemPrompt = `You are an expert HR advisor integrated into CompoSure, a workplace communications platform used by people leaders and HR professionals.

Jurisdiction: ${jurisdictionLabel}. Apply employment law principles relevant to this jurisdiction.

${policyContext ? `Organisation Policies (reference these when relevant):\n\n${policyContext}\n\n` : ''}Guidelines:
- Give practical, actionable guidance — managers need to act on this
- Reference the organisation's own policies when they apply
- Be concise and clear, not verbose or overly formal
- Flag when something needs qualified HR or legal consultation
- Never make definitive legal rulings — frame as guidance, not legal advice
- If asked about sensitive situations (performance, termination, accommodation), remind the manager to document carefully`;

    // Build messages array for Claude
    const claudeMessages = [
      ...conversationHistory.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      throw new Error(err.error?.message ?? 'Claude API error');
    }

    const claudeData = await claudeRes.json();
    const response = claudeData.content?.[0]?.text ?? '';

    // Save assistant response
    await supabase.from('chat_messages').insert({
      organisation_id,
      user_id,
      role: 'assistant',
      content: response,
    });

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('chat-hr error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
