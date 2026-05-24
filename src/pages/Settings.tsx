import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileEdit, UserRound, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!fullName.trim() || !user) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Failed to update name', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Name updated' });
    }
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Failed to update password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

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

      <main className="flex-1 container mx-auto px-4 py-10 max-w-lg">
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-8">Account Settings</h2>

        {/* Display name */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card mb-5">
          <div className="flex items-center gap-2 mb-5">
            <UserRound className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-foreground">Display Name</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                placeholder="Your full name"
              />
            </div>
            <Button
              variant="accent"
              disabled={!fullName.trim() || fullName.trim() === profile?.full_name || savingName}
              onClick={handleSaveName}
            >
              {savingName ? (
                <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : 'Save name'}
            </Button>
          </div>
        </div>

        {/* Email — read-only */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card mb-5">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-foreground">Email Address</h3>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">To change your email address, contact support.</p>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-foreground">Change Password</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                placeholder="Repeat new password"
              />
            </div>
            <Button
              variant="outline"
              disabled={!newPassword || !confirmPassword || savingPassword}
              onClick={handleChangePassword}
            >
              {savingPassword ? (
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : 'Update password'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
