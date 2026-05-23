import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function Waitlist() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), organisation: organisation.trim() || null });

    if (dbError) {
      if (dbError.code === '23505') {
        setError("You're already on the waitlist — we'll be in touch!");
      } else {
        setError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    // Fire-and-forget confirmation email
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-waitlist-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    }).catch(() => {});

    setIsLoading(false);
    setJoined(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {joined ? (
            <div className="bg-card border border-border rounded-2xl shadow-card p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">You're on the list!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We'll email you at <strong>{email}</strong> as soon as your spot is ready. You'll be among the first to access HRCompoSure.
              </p>
              <button onClick={() => navigate('/')} className="text-sm text-accent hover:underline">Back to home</button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-card p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
                  <Zap className="w-3.5 h-3.5" />
                  Limited free access ending soon
                </div>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">Join the waitlist</h2>
                <p className="text-sm text-muted-foreground">
                  The free Starter plan is a limited offer. Join the waitlist to lock in early access before it closes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Work email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Organisation <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input type="text" value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Company or organisation name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>

                {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

                <Button type="submit" variant="accent" size="lg" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : (
                    <><Zap className="w-4 h-4" />Join the waitlist</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">No spam. No credit card. We'll only email you when your spot is ready.</p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
