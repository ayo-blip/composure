import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, full_name } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const brevoKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = full_name?.split(' ')[0] ?? 'there';

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'HRCompoSure', email: 'hello@hrcomposure.com' },
        to: [{ email, name: full_name ?? '' }],
        subject: 'Welcome to HRCompoSure',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111827">
            <div style="margin-bottom:28px">
              <span style="font-size:22px;font-weight:700">HR<span style="color:#7c3aed">CompoSure</span></span>
            </div>

            <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Welcome, ${firstName}!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
              You're now set up on HRCompoSure — the platform that helps managers and HR professionals handle difficult workplace conversations with confidence.
            </p>

            <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:24px">
              <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;color:#111827">Here's what you can do:</h2>
              <ul style="margin:0;padding:0;list-style:none;space-y:12px">
                <li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
                  <span style="color:#7c3aed;font-size:18px;line-height:1">✦</span>
                  <div>
                    <strong>Generate professional drafts</strong><br>
                    <span style="color:#6b7280;font-size:14px">Get a carefully worded message for any sensitive workplace situation in under a minute.</span>
                  </div>
                </li>
                <li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
                  <span style="color:#7c3aed;font-size:18px;line-height:1">✦</span>
                  <div>
                    <strong>Assess risk before you act</strong><br>
                    <span style="color:#6b7280;font-size:14px">Every draft includes a plain-language risk rating so you're never caught off guard.</span>
                  </div>
                </li>
                <li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
                  <span style="color:#7c3aed;font-size:18px;line-height:1">✦</span>
                  <div>
                    <strong>Upload your HR policies</strong><br>
                    <span style="color:#6b7280;font-size:14px">Ground every draft in your organisation's own guidelines — not generic advice.</span>
                  </div>
                </li>
                <li style="display:flex;align-items:flex-start;gap:10px">
                  <span style="color:#7c3aed;font-size:18px;line-height:1">✦</span>
                  <div>
                    <strong>Build an employee timeline</strong><br>
                    <span style="color:#6b7280;font-size:14px">Save drafts to employee files and build a defensible paper trail over time.</span>
                  </div>
                </li>
              </ul>
            </div>

            <a href="https://www.hrcomposure.com" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px">
              Go to HRCompoSure →
            </a>

            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:4px">
              If you have any questions, just reply to this email — we're happy to help.
            </p>
            <p style="color:#6b7280;font-size:14px">— The HRCompoSure team</p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">
              For guidance only. Always consult HR and legal advisors for specific situations.<br>
              <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
              <a href="https://www.hrcomposure.com/terms" style="color:#9ca3af">Terms of Service</a>
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-welcome-email error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send welcome email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
