import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlanLimits } from '@/lib/planLimits';
import {
  FileEdit, ArrowLeft, Settings, Users, BarChart2,
  Shield, CheckCircle, XCircle, Loader2, Save, UserPlus, Zap, Activity, FolderOpen, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'settings' | 'team' | 'usage' | 'activity' | 'announcements';

interface OrgMember {
  id: string;
  full_name: string | null;
  role: string | null;
  active: boolean;
}

interface OrgSettings {
  id: string;
  name: string;
  jurisdiction: string;
  plan_tier: string;
}

interface UsageStat {
  total_all_time: number;
  total_this_month: number;
  document_count: number;
  member_count: number;
}

const JURISDICTIONS = [
  { value: 'on', label: 'Ontario (ON)' },
  { value: 'bc', label: 'British Columbia (BC)' },
  { value: 'ab', label: 'Alberta (AB)' },
  { value: 'qc', label: 'Quebec (QC)' },
  { value: 'mb', label: 'Manitoba (MB)' },
  { value: 'sk', label: 'Saskatchewan (SK)' },
  { value: 'ns', label: 'Nova Scotia (NS)' },
  { value: 'nb', label: 'New Brunswick (NB)' },
  { value: 'pe', label: 'Prince Edward Island (PE)' },
  { value: 'nl', label: 'Newfoundland & Labrador (NL)' },
  { value: 'nt', label: 'Northwest Territories (NT)' },
  { value: 'yt', label: 'Yukon (YT)' },
  { value: 'nu', label: 'Nunavut (NU)' },
  { value: 'federal', label: 'Federal (Canada)' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'other', label: 'Other / International' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  // Settings state
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [orgName, setOrgName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('other');
  const [savingSettings, setSavingSettings] = useState(false);

  // Team state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Usage state
  const [usage, setUsage] = useState<UsageStat | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Activity state
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [caseCount, setCaseCount] = useState<number>(0);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Announcements state
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [pastBroadcasts, setPastBroadcasts] = useState<any[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  const fetchOrg = useCallback(async () => {
    if (!profile?.organisation_id) return;
    const { data, error } = await supabase
      .from('organisations')
      .select('id, name, jurisdiction, plan_tier')
      .eq('id', profile.organisation_id)
      .single();
    if (error) {
      toast({ title: 'Could not load organisation settings', description: error.message, variant: 'destructive' });
    } else if (data) {
      setOrg(data as OrgSettings);
      setOrgName(data.name);
      setJurisdiction(data.jurisdiction ?? 'other');
    }
  }, [profile?.organisation_id, toast]);

  const fetchMembers = useCallback(async () => {
    if (!profile?.organisation_id) return;
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, active')
      .eq('organisation_id', profile.organisation_id)
      .order('full_name');
    if (error) {
      toast({ title: 'Could not load team members', description: error.message, variant: 'destructive' });
    } else {
      setMembers((data ?? []) as OrgMember[]);
    }
    setLoadingMembers(false);
  }, [profile?.organisation_id, toast]);

  const fetchUsage = useCallback(async () => {
    if (!profile?.organisation_id) return;
    setLoadingUsage(true);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [allTime, thisMonth, docCount, memberCount] = await Promise.all([
      supabase.from('usage_logs').select('id', { count: 'exact', head: true })
        .eq('organisation_id', profile.organisation_id),
      supabase.from('usage_logs').select('id', { count: 'exact', head: true })
        .eq('organisation_id', profile.organisation_id)
        .gte('created_at', monthStart),
      supabase.from('documents').select('id', { count: 'exact', head: true })
        .eq('organisation_id', profile.organisation_id)
        .eq('status', 'ready'),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('organisation_id', profile.organisation_id)
        .eq('active', true),
    ]);

    setUsage({
      total_all_time: allTime.count ?? 0,
      total_this_month: thisMonth.count ?? 0,
      document_count: docCount.count ?? 0,
      member_count: memberCount.count ?? 0,
    });
    setLoadingUsage(false);
  }, [profile?.organisation_id]);

  const fetchActivity = useCallback(async () => {
    if (!profile?.organisation_id) return;
    setLoadingActivity(true);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [draftsRes, usageRes, casesRes] = await Promise.all([
      supabase
        .from('saved_drafts')
        .select('id, title, scenarios, risk_level, created_at, user_id, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('usage_logs')
        .select('user_id, profiles(full_name)')
        .eq('organisation_id', profile.organisation_id)
        .gte('created_at', monthStart),
      supabase
        .from('employee_cases')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', profile.organisation_id)
        .eq('status', 'active'),
    ]);

    setRecentDrafts(draftsRes.data || []);

    // Aggregate usage per member
    const counts: Record<string, { name: string; count: number }> = {};
    for (const log of usageRes.data || []) {
      const uid = log.user_id;
      const name = (log.profiles as any)?.full_name ?? 'Unknown';
      if (!counts[uid]) counts[uid] = { name, count: 0 };
      counts[uid].count++;
    }
    setMemberStats(Object.values(counts).sort((a, b) => b.count - a.count));
    setCaseCount(casesRes.count ?? 0);
    setLoadingActivity(false);
  }, [profile?.organisation_id]);

  const fetchBroadcasts = useCallback(async () => {
    if (!profile?.organisation_id) return;
    setLoadingBroadcasts(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('organisation_id', profile.organisation_id)
      .eq('role', 'broadcast')
      .order('created_at', { ascending: false })
      .limit(20);
    setPastBroadcasts(data ?? []);
    setLoadingBroadcasts(false);
  }, [profile?.organisation_id]);

  const sendBroadcast = async () => {
    if (!broadcastContent.trim() || !profile?.organisation_id || !profile?.id) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/broadcast-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          content: broadcastContent.trim(),
          organisation_id: profile.organisation_id,
          sender_user_id: profile.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Broadcast failed');
      toast({
        title: 'Announcement sent',
        description: data.emailsSent > 0
          ? `Message delivered to ${data.emailsSent} team member${data.emailsSent !== 1 ? 's' : ''} by email.`
          : 'Message saved to all members\' HR chat.',
      });
      setBroadcastContent('');
      fetchBroadcasts();
    } catch (err) {
      toast({ title: 'Failed to send', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    }
    setIsBroadcasting(false);
  };

  useEffect(() => { fetchOrg(); }, [fetchOrg]);
  useEffect(() => { if (activeTab === 'team') fetchMembers(); }, [activeTab, fetchMembers]);
  useEffect(() => { if (activeTab === 'usage') fetchUsage(); }, [activeTab, fetchUsage]);
  useEffect(() => { if (activeTab === 'activity') fetchActivity(); }, [activeTab, fetchActivity]);
  useEffect(() => { if (activeTab === 'announcements') fetchBroadcasts(); }, [activeTab, fetchBroadcasts]);

  const saveSettings = async () => {
    if (!org) {
      toast({ title: 'Settings not loaded yet', description: 'Please wait and try again.', variant: 'destructive' });
      return;
    }
    setSavingSettings(true);
    const { error } = await supabase
      .from('organisations')
      .update({ name: orgName.trim(), jurisdiction })
      .eq('id', org.id);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved' });
      setOrg(prev => prev ? { ...prev, name: orgName.trim(), jurisdiction } : prev);
    }
    setSavingSettings(false);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !profile?.organisation_id) return;
    setSendingInvite(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), organisation_id: profile.organisation_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invite failed');
      toast({ title: 'Invite sent', description: `${inviteEmail.trim()} will receive an email to join.` });
      setInviteEmail('');
    } catch (err) {
      toast({ title: 'Invite failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
    setSendingInvite(false);
  };

  const toggleRole = async (member: OrgMember) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', member.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
    }
  };

  const toggleActive = async (member: OrgMember) => {
    if (member.id === profile?.id) {
      toast({ title: 'Cannot deactivate yourself', variant: 'destructive' });
      return;
    }
    const newActive = !member.active;
    const { error } = await supabase
      .from('profiles')
      .update({ active: newActive })
      .eq('id', member.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, active: newActive } : m));
    }
  };

  const scenarioLabels: Record<string, string> = {
    'performance-concern': 'Performance',
    'attendance-issue': 'Attendance',
    'accommodation-request': 'Accommodation',
    'mental-health-disclosure': 'Mental Health',
    'return-to-work': 'Return to Work',
    'leave-request': 'Leave',
    'conflict-resolution': 'Conflict',
    'policy-reminder': 'Policy',
    'check-in': 'Check-In',
    'probation-review': 'Probation',
    'termination': 'Termination',
    'difficult-timing': 'Difficult Timing',
    'follow-up': 'Follow-Up',
    'declining-request': 'Declining',
    'resetting-expectations': 'Expectations',
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'usage', label: 'Usage', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'activity', label: 'Team Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
  ];

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
              Compo<span className="text-accent">Sure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Admin Dashboard</h2>
              <p className="text-sm text-muted-foreground">{org?.name ?? 'Your organisation'}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
                <h3 className="font-heading text-lg font-semibold text-foreground">Organisation Settings</h3>

                {!org && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading settings…
                  </div>
                )}

                {org && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Organisation Name</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Jurisdiction</label>
                      <p className="text-xs text-muted-foreground">
                        Sets the employment law context for all AI-generated guidance in your organisation.
                      </p>
                      <select
                        value={jurisdiction}
                        onChange={e => setJurisdiction(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        {JURISDICTIONS.map(j => (
                          <option key={j.value} value={j.value}>{j.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        onClick={saveSettings}
                        disabled={savingSettings || !orgName.trim()}
                        className="gap-2"
                      >
                        {savingSettings ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </Button>

                      {org?.plan_tier !== 'enterprise' && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate('/pricing')}
                        >
                          <Zap className="w-4 h-4 text-accent" />
                          Upgrade Plan
                        </Button>
                      )}

                      {org?.plan_tier !== 'starter' && (
                        <Button
                          variant="ghost"
                          className="gap-2 text-muted-foreground"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                                },
                                body: JSON.stringify({ organisation_id: profile?.organisation_id, return_url: window.location.origin }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              window.location.href = data.url;
                            } catch (err) {
                              toast({ title: 'Could not open billing portal', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
                            }
                          }}
                        >
                          Manage / Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Invite form */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Invite a team member</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  They'll receive an email with a link to set up their account and join your organisation automatically.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button
                    onClick={sendInvite}
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className="gap-2 shrink-0"
                  >
                    {sendingInvite ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Send Invite
                  </Button>
                </div>
              </div>

              {/* Members list */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                  Team Members
                  {members.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">({members.length})</span>
                  )}
                </h3>

                {loadingMembers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No team members yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Invite someone above to get started.</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, i) => (
                          <tr
                            key={member.id}
                            className={`${i < members.length - 1 ? 'border-b border-border' : ''} ${
                              !member.active ? 'opacity-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">
                                {member.full_name ?? 'Unnamed'}
                              </span>
                              {member.id === profile?.id && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                member.role === 'admin'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-secondary text-muted-foreground'
                              }`}>
                                {member.role ?? 'member'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {member.active ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <XCircle className="w-3.5 h-3.5" /> Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {member.id !== profile?.id && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => toggleRole(member)}
                                  >
                                    Make {member.role === 'admin' ? 'Member' : 'Admin'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground"
                                    onClick={() => toggleActive(member)}
                                  >
                                    {member.active ? 'Deactivate' : 'Reactivate'}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              {loadingUsage ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : usage && org ? (() => {
                const limits = getPlanLimits(org.plan_tier);
                const draftPct = limits.draftsPerMonth === -1 ? 0 : Math.min((usage.total_this_month / limits.draftsPerMonth) * 100, 100);
                const memberPct = limits.maxMembers === -1 ? 0 : Math.min((usage.member_count / limits.maxMembers) * 100, 100);
                const draftNearLimit = limits.draftsPerMonth !== -1 && usage.total_this_month >= limits.draftsPerMonth * 0.8;
                const memberNearLimit = limits.maxMembers !== -1 && usage.member_count >= limits.maxMembers * 0.8;

                return (
                  <>
                    {/* Plan badge */}
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <p className="font-heading text-2xl font-semibold text-foreground mt-1">{limits.label}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        {org.plan_tier}
                      </span>
                    </div>

                    {/* Drafts this month */}
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">AI Drafts This Month</p>
                        <p className="text-sm text-muted-foreground">
                          {usage.total_this_month}
                          {limits.draftsPerMonth !== -1 && ` / ${limits.draftsPerMonth}`}
                        </p>
                      </div>
                      {limits.draftsPerMonth !== -1 && (
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${draftNearLimit ? 'bg-amber-500' : 'bg-accent'}`}
                            style={{ width: `${draftPct}%` }}
                          />
                        </div>
                      )}
                      {draftNearLimit && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Approaching monthly limit.
                          </p>
                          <button onClick={() => navigate('/pricing')} className="text-xs text-accent underline">
                            Upgrade plan
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {usage.total_all_time} total drafts generated all time
                      </p>
                    </div>

                    {/* Team members */}
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Active Team Members</p>
                        <p className="text-sm text-muted-foreground">
                          {usage.member_count}
                          {limits.maxMembers !== -1 && ` / ${limits.maxMembers}`}
                        </p>
                      </div>
                      {limits.maxMembers !== -1 && (
                        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${memberNearLimit ? 'bg-amber-500' : 'bg-accent'}`}
                            style={{ width: `${memberPct}%` }}
                          />
                        </div>
                      )}
                      {memberNearLimit && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Approaching member limit.
                          </p>
                          <button onClick={() => navigate('/pricing')} className="text-xs text-accent underline">
                            Upgrade plan
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Policy docs */}
                    <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                      <p className="text-sm font-medium text-foreground mb-1">Active Policy Documents</p>
                      <p className="font-heading text-3xl font-semibold text-foreground">{usage.document_count}</p>
                      <p className="text-xs text-muted-foreground mt-1">Documents processed and active in your knowledge base</p>
                    </div>
                  </>
                );
              })() : null}
            </div>
          )}
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Drafts This Month</span>
                      </div>
                      <p className="font-heading text-3xl font-bold text-foreground">
                        {memberStats.reduce((s, m) => s + m.count, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">across {memberStats.length} active {memberStats.length === 1 ? 'member' : 'members'}</p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Open Cases</span>
                      </div>
                      <p className="font-heading text-3xl font-bold text-foreground">{caseCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">active employee situations</p>
                    </div>
                  </div>

                  {/* Per-member activity */}
                  {memberStats.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                      <div className="px-5 py-4 border-b border-border">
                        <h3 className="font-heading font-semibold text-foreground">Member Activity — This Month</h3>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Member</th>
                            <th className="text-right px-5 py-3 font-medium text-muted-foreground">Drafts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberStats.map((m, i) => (
                            <tr key={i} className={i < memberStats.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-5 py-3 font-medium text-foreground">{m.name}</td>
                              <td className="px-5 py-3 text-right text-muted-foreground">{m.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recent drafts feed */}
                  <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-foreground">Recent Team Drafts</h3>
                      <span className="text-xs text-muted-foreground">Metadata only — draft content is private</span>
                    </div>
                    {recentDrafts.length === 0 ? (
                      <div className="text-center py-10 text-sm text-muted-foreground">No drafts yet.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Title</th>
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Scenario</th>
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Member</th>
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Risk</th>
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDrafts.map((d, i) => (
                            <tr key={d.id} className={i < recentDrafts.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-5 py-3 text-foreground max-w-[160px] truncate">{d.title}</td>
                              <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                                {scenarioLabels[d.scenarios?.[0]] ?? d.scenarios?.[0] ?? '—'}
                              </td>
                              <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                                {(d.profiles as any)?.full_name ?? 'Unknown'}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  d.risk_level === 'High'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : d.risk_level === 'Moderate'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>{d.risk_level}</span>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                                {new Date(d.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Compose */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">Send Announcement</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Push an HR notice or policy update to all team members. It appears in their HR chat and is sent by email.
                </p>
                <textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="e.g. Reminder: updated parental leave policy takes effect from 1 June. Please review the updated policy document in the knowledge base."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">
                    Sent to all active team members via in-app chat and email.
                  </p>
                  <Button
                    onClick={sendBroadcast}
                    disabled={!broadcastContent.trim() || isBroadcasting}
                    className="gap-2 shrink-0"
                  >
                    {isBroadcasting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                    ) : (
                      <><Megaphone className="w-4 h-4" />Send to Team</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Past broadcasts */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Past Announcements</h3>
                {loadingBroadcasts ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : pastBroadcasts.length === 0 ? (
                  <div className="text-center py-10 bg-card rounded-2xl border border-border border-dashed">
                    <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No announcements sent yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBroadcasts.map((b) => (
                      <div key={b.id} className="bg-card border border-border rounded-xl p-4 shadow-card">
                        <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{b.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString('en-CA', { dateStyle: 'medium' })} · {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
