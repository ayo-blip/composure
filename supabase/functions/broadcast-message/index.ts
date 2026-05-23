import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { content, organisation_id, sender_user_id } = await req.json();
    if (!content?.trim() || !organisation_id || !sender_user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify sender is admin
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('role, organisation_id')
      .eq('id', sender_user_id)
      .single();

    if (senderProfile?.role !== 'admin' || senderProfile?.organisation_id !== organisation_id) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch org name
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', organisation_id)
      .single();

    const orgName = org?.name ?? 'Your organisation';

    // Save broadcast message to chat (visible to all org users)
    const { error: insertError } = await supabase.from('chat_messages').insert({
      organisation_id,
      user_id: null,
      role: 'broadcast',
      content: content.trim(),
    });

    if (insertError) throw insertError;

    // Fetch all active org member emails
    const { data: members } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('organisation_id', organisation_id)
      .eq('active', true)
      .neq('id', sender_user_id);

    const memberIds = (members ?? []).map((m: { id: string }) => m.id);

    let emailsSent = 0;
    if (resendKey && memberIds.length > 0) {
      // Fetch emails from auth.users via admin API
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const orgEmails = (usersData?.users ?? [])
        .filter((u) => memberIds.includes(u.id))
        .map((u) => ({ email: u.email!, name: (members ?? []).find((m: any) => m.id === u.id)?.full_name ?? '' }))
        .filter((u) => !!u.email);

      for (const { email, name } of orgEmails) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'CompoSure <noreply@composure.app>',
              to: [email],
              subject: `[${orgName}] HR Announcement`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <div style="margin-bottom:24px">
                    <span style="font-size:20px;font-weight:600">Compo<span style="color:#7c3aed">Sure</span></span>
                  </div>
                  <h2 style="font-size:18px;font-weight:600;margin-bottom:8px">HR Announcement from ${orgName}</h2>
                  ${name ? `<p style="color:#6b7280;font-size:14px;margin-bottom:16px">Hi ${name},</p>` : ''}
                  <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:15px;line-height:1.6;color:#111827">
                    ${content.trim().replace(/\n/g, '<br>')}
                  </div>
                  <p style="font-size:12px;color:#9ca3af;margin-top:24px">
                    You received this because you are a member of ${orgName} on CompoSure.
                  </p>
                </div>
              `,
            }),
          });
          emailsSent++;
        } catch {
          // Continue sending to others even if one fails
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('broadcast-message error:', err);
    return new Response(JSON.stringify({ error: 'Broadcast failed. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
