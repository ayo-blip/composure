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
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:0;color:#111827">

            <!-- Header -->
            <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:28px 32px;margin-bottom:0">
              <span style="font-size:22px;font-weight:700;color:#ffffff">HR<span style="color:#f59e0b">CompoSure</span></span>
            </div>

            <!-- Body -->
            <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">

              <h1 style="font-size:24px;font-weight:700;margin:0 0 8px 0;color:#111827">Welcome, ${firstName}!</h1>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px 0">
                You're now set up on HRCompoSure — the platform that helps managers and HR professionals handle difficult workplace conversations with confidence.
              </p>

              <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #f0f0f0">
                <h2 style="font-size:15px;font-weight:600;margin:0 0 16px 0;color:#111827">Here's what you can do:</h2>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="vertical-align:top;padding:0 10px 14px 0;width:20px">
                      <span style="color:#f59e0b;font-size:18px;line-height:1">✦</span>
                    </td>
                    <td style="padding-bottom:14px">
                      <strong style="color:#111827">Generate professional drafts</strong><br>
                      <span style="color:#6b7280;font-size:14px">A carefully worded message for any sensitive workplace situation — ready in under a minute.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;padding:0 10px 14px 0">
                      <span style="color:#f59e0b;font-size:18px;line-height:1">✦</span>
                    </td>
                    <td style="padding-bottom:14px">
                      <strong style="color:#111827">Assess risk before you act</strong><br>
                      <span style="color:#6b7280;font-size:14px">Every draft includes a plain-language risk rating so you're never caught off guard.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;padding:0 10px 14px 0">
                      <span style="color:#f59e0b;font-size:18px;line-height:1">✦</span>
                    </td>
                    <td style="padding-bottom:14px">
                      <strong style="color:#111827">Upload your HR policies</strong><br>
                      <span style="color:#6b7280;font-size:14px">Ground every draft in your organisation's own guidelines — not generic advice.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;padding:0 10px 0 0">
                      <span style="color:#f59e0b;font-size:18px;line-height:1">✦</span>
                    </td>
                    <td>
                      <strong style="color:#111827">Build an employee timeline</strong><br>
                      <span style="color:#6b7280;font-size:14px">Save drafts to employee cases and build a defensible paper trail over time.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <a href="https://www.hrcomposure.com" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:28px">
                Go to HRCompoSure →
              </a>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 4px 0">
                If you have any questions, just reply to this email — we're happy to help.
              </p>
              <p style="color:#6b7280;font-size:14px;margin:0">— The HRCompoSure team</p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;margin:0">
                For guidance only. Always consult HR and legal advisors for specific situations.<br>
                <a href="https://www.hrcomposure.com/privacy" style="color:#9ca3af">Privacy Policy</a> ·
                <a href="https://www.hrcomposure.com/terms" style="color:#9ca3af">Terms of Service</a> ·
                <a href="https://www.hrcomposure.com/security" style="color:#9ca3af">Security</a>
              </p>
            </div>
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
