import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, name } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: corsHeaders });

    const brevoKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoKey) return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

    const firstName = name?.split(' ')[0] ?? 'there';

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'HRCompoSure', email: 'hello@hrcomposure.com' },
        to: [{ email, name: name ?? '' }],
        subject: "You're on the HRCompoSure waitlist",
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827">
            <div style="margin-bottom:28px">
              <span style="font-size:22px;font-weight:700">HR<span style="color:#7c3aed">CompoSure</span></span>
            </div>

            <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">You're on the list, ${firstName}!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
              Thanks for joining the HRCompoSure waitlist. We'll email you as soon as your spot is ready — you'll be among the first to get access.
            </p>

            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="font-size:15px;font-weight:600;color:#111827;margin-bottom:8px">What to expect:</p>
              <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8">
                <li>A personal invite when your spot opens up</li>
                <li>Free Starter access — no credit card required</li>
                <li>Priority access to new features</li>
              </ul>
            </div>

            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              In the meantime, if you have any questions just reply to this email — we'd love to hear from you.
            </p>
            <p style="color:#6b7280;font-size:14px;margin-top:8px">— The HRCompoSure team</p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">
              <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
              <a href="https://www.hrcomposure.com/terms" style="color:#9ca3af">Terms of Service</a>
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-waitlist-email error:', err);
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: corsHeaders });
  }
});
