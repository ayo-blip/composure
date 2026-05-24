import { useEffect, useState } from 'react';
import { X, FileEdit, FolderOpen, BookOpen, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  {
    icon: FileEdit,
    title: 'Generate your first draft',
    description: 'Describe the workplace situation above and get a professionally worded message in seconds.',
  },
  {
    icon: FolderOpen,
    title: 'Link it to a case',
    description: 'Save drafts to an employee case to build an audit-ready record over time.',
  },
  {
    icon: BookOpen,
    title: 'Review your library',
    description: 'All your saved drafts are stored in your Library — searchable and ready to reference.',
  },
];

export function OnboardingBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `onboarding_dismissed_${user.id}`;
    if (localStorage.getItem(key)) return;

    supabase
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if ((count ?? 0) === 0) setVisible(true);
      });
  }, [user]);

  const dismiss = () => {
    if (user) localStorage.setItem(`onboarding_dismissed_${user.id}`, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-8 bg-card border border-border rounded-2xl shadow-card p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
            <Zap className="w-3 h-3" />
            Getting started
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Welcome to HRCompoSure</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Here's how to get the most out of the platform.</p>
        </div>
        <button onClick={dismiss} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={dismiss} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
        Dismiss
      </button>
    </div>
  );
}
