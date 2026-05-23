import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function OrgSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Invited users already have an org assigned via trigger — skip setup
  if (profile?.organisation_id) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !user) return;

    setIsLoading(true);

    try {
      // Generate ID client-side so we don't need to SELECT the org back
      // (SELECT would be blocked by RLS before profile has organisation_id)
      const orgId = crypto.randomUUID();

      const { error: orgError } = await supabase
        .from('organisations')
        .insert({ id: orgId, name: orgName.trim() });

      if (orgError) throw orgError;

      // Link user to org as admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organisation_id: orgId, role: 'admin' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();

      toast({
        title: 'Organisation created',
        description: `Welcome to ${orgName}. You're set up as the admin.`,
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating organisation:', error);
      toast({
        title: 'Setup failed',
        description: 'Could not create your organisation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Compo<span className="text-accent">Sure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Thoughtful workplace communications</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-card p-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
                Set up your organisation
              </h2>
              <p className="text-muted-foreground text-sm">
                Create your organisation to get started. You'll be set up as the admin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-medium">
                  Organisation name
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isLoading || !orgName.trim()}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : (
                  'Create Organisation'
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
