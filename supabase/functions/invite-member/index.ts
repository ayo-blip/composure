import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEMBER_LIMITS: Record<string, number> = { starter: 3, professional: 10, enterprise: 30 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organisation_id } = await req.json();

    if (!email || !organisation_id) {
      return new Response(JSON.stringify({ error: 'email and organisation_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoKey = Deno.env.get('BREVO_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check member limit
    const { data: orgData } = await supabase
      .from('organisations')
      .select('plan_tier, name')
      .eq('id', organisation_id)
      .single();

    const limit = MEMBER_LIMITS[orgData?.plan_tier ?? 'starter'] ?? 3;
    if (limit !== -1) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', organisation_id)
        .eq('active', true);

      if ((count ?? 0) >= limit) {
        return new Response(JSON.stringify({
          error: `Member limit of ${limit} reached for your plan. Please upgrade to add more members.`
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate invite link directly — bypasses SMTP entirely
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { organisation_id, role: 'member' } },
    });

    if (linkError) throw linkError;

    const inviteLink = linkData.properties?.action_link;
    if (!inviteLink) throw new Error('Failed to generate invite link');

    const orgName = orgData?.name ?? 'your organisation';

    // Send via Brevo directly
    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'HRCompoSure', email: 'hello@hrcomposure.com' },
          to: [{ email }],
          subject: `You've been invited to join ${orgName} on HRCompoSure`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:0;color:#111827">
              <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:28px 32px">
                <span style="font-size:22px;font-weight:700;color:#ffffff">HR<span style="color:#f59e0b">CompoSure</span></span>
              </div>
              <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <h1 style="font-size:22px;font-weight:700;margin:0 0 8px 0;color:#111827">You've been invited</h1>
                <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px 0">
                  You've been invited to join <strong style="color:#111827">${orgName}</strong> on HRCompoSure — the platform that helps managers handle difficult workplace conversations with confidence.
                </p>
                <a href="${inviteLink}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px">
                  Accept invitation →
                </a>
                <p style="color:#9ca3af;font-size:13px;margin:0 0 4px 0">This invitation link expires in 24 hours.</p>
                <p style="color:#9ca3af;font-size:13px;margin:0">If you weren't expecting this, you can safely ignore it.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
                <p style="color:#9ca3af;font-size:12px;margin:0">
                  <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
                  <a href="https://www.hrcomposure.com/security" style="color:#9ca3af">Security</a>
                </p>
              </div>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('invite-member error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Invite failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
