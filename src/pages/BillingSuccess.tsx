import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // Refresh profile so plan_tier updates immediately
    refreshProfile();
  }, [refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant mb-8">
        <FileEdit className="w-5 h-5 text-primary-foreground" />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">You're all set!</h1>
        <p className="text-muted-foreground mb-8">
          Your plan has been upgraded. Your new limits are active immediately.
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="accent" onClick={() => navigate('/')}>
            Start Generating Drafts
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            View Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
