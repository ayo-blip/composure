import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEMBER_LIMITS: Record<string, number> = { starter: 3, professional: 15, enterprise: -1 };

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check member limit for org's plan
    const { data: orgData } = await supabase
      .from('organisations')
      .select('plan_tier')
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

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { organisation_id, role: 'member' },
    });

    if (error) throw error;

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
