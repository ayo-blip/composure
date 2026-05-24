import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAY3_SUBJECT = "Getting the most out of HRCompoSure";
const DAY7_SUBJECT = "How are your workplace conversations going?";

function day3Html(firstName: string) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:700">HR<span style="color:#f59e0b">CompoSure</span></span>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">A few tips, ${firstName}</h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
        You've had a couple of days to explore — here are three things that make HRCompoSure really shine.
      </p>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="font-weight:600;font-size:15px;color:#111827;margin-bottom:4px">1. Link drafts to employee cases</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0">Every draft you save to a case builds a documented timeline — audit-ready and defensible if a situation escalates.</p>
      </div>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="font-weight:600;font-size:15px;color:#111827;margin-bottom:4px">2. Upload your HR policies</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0">Add your employee handbook to the Knowledge Base and every future draft will reference your actual policies — not generic advice.</p>
      </div>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="font-weight:600;font-size:15px;color:#111827;margin-bottom:4px">3. Check the risk rating</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0">Every draft includes a plain-language risk assessment. Pay attention to amber and red ratings before you send anything.</p>
      </div>

      <a href="https://www.hrcomposure.com" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">Open HRCompoSure</a>

      <p style="color:#6b7280;font-size:14px;margin-top:24px">Any questions? Just reply to this email.</p>
      <p style="color:#6b7280;font-size:14px;margin-top:4px">— The HRCompoSure team</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">
        <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
        <a href="https://www.hrcomposure.com/terms" style="color:#9ca3af">Terms of Service</a>
      </p>
    </div>
  `;
}

function day7Html(firstName: string, draftCount: number) {
  const hasDrafts = draftCount > 0;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:700">HR<span style="color:#f59e0b">CompoSure</span></span>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">
        ${hasDrafts ? `You're off to a great start, ${firstName}` : `Still finding your feet, ${firstName}?`}
      </h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
        ${hasDrafts
          ? `You've already generated ${draftCount} draft${draftCount > 1 ? 's' : ''} — that's exactly what HRCompoSure is here for. If any of those situations are ongoing, make sure you've linked the drafts to an employee case so the record is building automatically.`
          : `It can be hard to know where to start — but the best time to use HRCompoSure is before a difficult conversation, not after. Next time you're preparing to address performance, attendance, or any sensitive situation, let us draft it for you.`
        }
      </p>

      ${!hasDrafts ? `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="font-weight:600;font-size:15px;color:#92400e;margin-bottom:4px">Your free plan includes 10 drafts/month</p>
        <p style="color:#92400e;font-size:14px;line-height:1.6;margin:0">No need to save them for something big — use them to prepare for any workplace conversation, however small.</p>
      </div>` : ''}

      <a href="https://www.hrcomposure.com" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
        ${hasDrafts ? 'Continue where you left off' : 'Generate your first draft'}
      </a>

      <p style="color:#6b7280;font-size:14px;margin-top:24px">Questions or feedback? Reply to this email — we read every one.</p>
      <p style="color:#6b7280;font-size:14px;margin-top:4px">— The HRCompoSure team</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">
        <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
        <a href="https://www.hrcomposure.com/terms" style="color:#9ca3af">Terms of Service</a>
      </p>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const brevoKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoKey) return new Response(JSON.stringify({ error: 'BREVO_API_KEY not set' }), { status: 500, headers: corsHeaders });

    const now = new Date();

    const targetDays = [3, 7];
    let sent = 0;

    for (const days of targetDays) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - days);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const targets = (users?.users ?? []).filter(u => {
        const created = new Date(u.created_at);
        return created >= dayStart && created <= dayEnd;
      });

      for (const user of targets) {
        const email = user.email;
        if (!email) continue;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

        let htmlContent: string;
        let subject: string;

        if (days === 3) {
          subject = DAY3_SUBJECT;
          htmlContent = day3Html(firstName);
        } else {
          const { count } = await supabaseAdmin
            .from('drafts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          subject = DAY7_SUBJECT;
          htmlContent = day7Html(firstName, count ?? 0);
        }

        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
          body: JSON.stringify({
            sender: { name: 'HRCompoSure', email: 'hello@hrcomposure.com' },
            to: [{ email, name: profile?.full_name ?? '' }],
            subject,
            htmlContent,
          }),
        });

        sent++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-nurture-emails error:', err);
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: corsHeaders });
  }
});
