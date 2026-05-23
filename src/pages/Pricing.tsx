import { useNavigate } from 'react-router-dom';
import { FileEdit, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    priceId: null,
    description: 'For individuals getting started',
    badge: 'Limited offer — available for a limited time only',
    features: [
      '10 AI drafts per month',
      'Up to 3 team members',
      'Knowledge base (policies upload)',
      'Draft library',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$49',
    priceId: 'price_1Ta6YQLmjsM9yprvYjQQ2G2g',
    description: 'For growing HR teams',
    badge: null,
    features: [
      '150 AI drafts per month',
      'Up to 10 team members',
      'Knowledge base (policies upload)',
      'Draft library',
      'Jurisdiction-aware guidance',
      'Priority support',
    ],
    cta: 'Upgrade to Professional',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$149',
    priceId: 'price_1Ta6Z7LmjsM9yprvDV51z9eX',
    description: 'For larger organisations',
    badge: null,
    features: [
      'Unlimited AI drafts',
      'Up to 30 team members',
      'Knowledge base (policies upload)',
      'Draft library',
      'Jurisdiction-aware guidance',
      'HR Assistant (AI chat)',
      'Admin broadcast announcements',
      'Priority support',
      'Dedicated onboarding',
    ],
    cta: 'Upgrade to Enterprise',
    highlighted: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { profile, planTier } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async (priceId: string | null) => {
    if (!priceId) return;
    if (!profile?.organisation_id) {
      toast({ title: 'Sign in required', description: 'Please sign in to upgrade.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          organisation_id: profile.organisation_id,
          price_id: priceId,
          return_url: window.location.origin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: 'Upgrade failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl font-semibold text-foreground mb-3">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Choose the plan that fits your team. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-accent bg-accent/5 shadow-lg'
                  : 'border-border bg-card shadow-card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                {plan.badge && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 mb-3">
                    ⚠ {plan.badge}
                  </p>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.priceId && <span className="text-muted-foreground text-sm">/month</span>}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {(() => {
                const currentPlanKey = planTier ?? 'starter';
                const thisPlanKey = plan.name.toLowerCase();
                const isCurrent = currentPlanKey === thisPlanKey;
                return (
                  <Button
                    variant={plan.highlighted && !isCurrent ? 'accent' : 'outline'}
                    className="w-full"
                    disabled={!plan.priceId || isCurrent}
                    onClick={() => plan.priceId && !isCurrent && handleUpgrade(plan.priceId)}
                  >
                    {isCurrent ? '✓ Current Plan' : plan.cta}
                  </Button>
                );
              })()}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          No credit card required for Starter. Cancel anytime.
        </p>

        {/* Custom plan CTA */}
        <div className="mt-10 max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center shadow-card">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Need something larger?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If your organisation needs more than 30 users, a higher message allowance, or a tailored setup — we offer custom plans. Get in touch and we'll work something out.
          </p>
          <a
            href="mailto:hello@hrcomposure.com?subject=Custom Plan Enquiry"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Contact us about a custom plan
          </a>
        </div>
      </main>
    </div>
  );
}
