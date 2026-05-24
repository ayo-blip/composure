import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CompleteProfileModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Only show for logged-in users with no name set
  if (!user || !profile || profile.full_name) return null;

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserRound className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-center mb-6">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Welcome — one quick step</h2>
          <p className="text-sm text-muted-foreground">Add your name so your team knows who you are.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Your full name</Label>
            <Input
              id="full-name"
              placeholder="e.g. Sarah Johnson"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!fullName.trim() || saving}
            onClick={handleSave}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
