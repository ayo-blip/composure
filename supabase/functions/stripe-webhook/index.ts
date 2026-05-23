import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const PRICE_TO_PLAN: Record<string, string> = {
  'price_1Ta6YQLmjsM9yprvYjQQ2G2g': 'professional',
  'price_1Ta6Z7LmjsM9yprvDV51z9eX': 'enterprise',
};

serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const updateOrgPlan = async (organisationId: string, priceId: string | null, subscriptionId: string | null) => {
    const planTier = priceId ? (PRICE_TO_PLAN[priceId] ?? 'starter') : 'starter';
    await supabase
      .from('organisations')
      .update({
        plan_tier: planTier,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
      })
      .eq('id', organisationId);
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organisationId = session.metadata?.organisation_id;
        if (!organisationId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id ?? null;
        await updateOrgPlan(organisationId, priceId, subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organisationId = subscription.metadata?.organisation_id;
        if (!organisationId) break;

        const priceId = subscription.items.data[0]?.price.id ?? null;
        const active = ['active', 'trialing'].includes(subscription.status);
        await updateOrgPlan(organisationId, active ? priceId : null, active ? subscription.id : null);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organisationId = subscription.metadata?.organisation_id;
        if (!organisationId) break;
        await updateOrgPlan(organisationId, null, null);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
