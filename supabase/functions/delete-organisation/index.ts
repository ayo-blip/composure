import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_ADMIN_EMAIL = 'leke365@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller || caller.email !== SUPER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { org_id } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all user IDs in this org before deleting
    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .eq('organisation_id', org_id);

    const userIds = (profiles ?? []).map((p: { id: string }) => p.id);

    // Delete all org data in dependency order
    await admin.from('saved_drafts').delete().eq('organisation_id', org_id);
    await admin.from('usage_logs').delete().eq('organisation_id', org_id);
    await admin.from('documents').delete().eq('organisation_id', org_id);
    await admin.from('cases').delete().eq('organisation_id', org_id);

    if (userIds.length > 0) {
      await admin.from('push_subscriptions').delete().in('user_id', userIds);
      await admin.from('chat_messages').delete().in('user_id', userIds);
      await admin.from('profiles').delete().eq('organisation_id', org_id);

      // Delete auth users
      for (const uid of userIds) {
        await admin.auth.admin.deleteUser(uid);
      }
    }

    await admin.from('organisations').delete().eq('id', org_id);

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
