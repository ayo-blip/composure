import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  FileEdit, ArrowLeft, BarChart2, Building2, Users, Zap,
  TrendingUp, MessageSquare, FileText, Activity, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPER_ADMIN_EMAIL = 'leke365@gmail.com';

const PLAN_PRICE: Record<string, number> = {
  starter: 0,
  professional: 49,
  enterprise: 149,
};

interface OrgRow {
  id: string;
  name: string;
  plan_tier: string;
  created_at: string;
  member_count: number;
  draft_count: number;
  last_active: string | null;
}

interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalDraftsAllTime: number;
  totalDraftsThisMonth: number;
  totalChatMessages: number;
  totalDocuments: number;
  mrr: number;
  planBreakdown: Record<string, number>;
  newOrgsThisMonth: number;
  churnedThisMonth: number;
}

type Tab = 'overview' | 'orgs';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  // Gate: only allow super admin email
  useEffect(() => {
    if (loading) return;
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();

    const [
      orgsRes, usersRes, draftsAllRes, draftsMonthRes,
      chatRes, docsRes, planRes, newOrgsRes,
    ] = await Promise.all([
      supabase.from('organisations').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('usage_logs').select('id', { count: 'exact', head: true }),
      supabase.from('usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', monthStartISO),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase.from('organisations').select('plan_tier'),
      supabase.from('organisations').select('id', { count: 'exact', head: true }).gte('created_at', monthStartISO),
    ]);

    const planBreakdown: Record<string, number> = { starter: 0, professional: 0, enterprise: 0 };
    let mrr = 0;
    for (const org of planRes.data ?? []) {
      const tier = org.plan_tier ?? 'starter';
      planBreakdown[tier] = (planBreakdown[tier] ?? 0) + 1;
      mrr += PLAN_PRICE[tier] ?? 0;
    }

    setStats({
      totalOrgs: orgsRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      totalDraftsAllTime: draftsAllRes.count ?? 0,
      totalDraftsThisMonth: draftsMonthRes.count ?? 0,
      totalChatMessages: chatRes.count ?? 0,
      totalDocuments: docsRes.count ?? 0,
      mrr,
      planBreakdown,
      newOrgsThisMonth: newOrgsRes.count ?? 0,
      churnedThisMonth: 0,
    });
    setLoadingStats(false);
  }, []);

  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    const { data: orgData } = await supabase
      .from('organisations')
      .select('id, name, plan_tier, created_at')
      .order('created_at', { ascending: false });

    if (!orgData) { setLoadingOrgs(false); return; }

    const enriched = await Promise.all(orgData.map(async (org) => {
      const [members, drafts, lastDraft] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('organisation_id', org.id).eq('active', true),
        supabase.from('usage_logs').select('id', { count: 'exact', head: true })
          .eq('organisation_id', org.id),
        supabase.from('usage_logs').select('created_at')
          .eq('organisation_id', org.id).order('created_at', { ascending: false }).limit(1),
      ]);
      return {
        id: org.id,
        name: org.name,
        plan_tier: org.plan_tier ?? 'starter',
        created_at: org.created_at,
        member_count: members.count ?? 0,
        draft_count: drafts.count ?? 0,
        last_active: lastDraft.data?.[0]?.created_at ?? null,
      } as OrgRow;
    }));

    setOrgs(enriched);
    setLoadingOrgs(false);
  }, []);

  const updateOrgPlan = async (orgId: string, newPlan: string) => {
    setUpdatingPlan(orgId);
    await supabase.from('organisations').update({ plan_tier: newPlan }).eq('id', orgId);
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan_tier: newPlan } : o));
    await fetchStats();
    setUpdatingPlan(null);
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (activeTab === 'orgs') fetchOrgs(); }, [activeTab, fetchOrgs]);

  if (loading || !user || user.email !== SUPER_ADMIN_EMAIL) return null;

  const planColor: Record<string, string> = {
    starter: 'bg-secondary text-muted-foreground',
    professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    enterprise: 'bg-accent/10 text-accent',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { fetchStats(); if (activeTab === 'orgs') fetchOrgs(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-semibold text-foreground">Platform Overview</h2>
            <p className="text-sm text-muted-foreground">All organisations · Live data</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border">
            {([
              { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
              { id: 'orgs', label: 'Organisations', icon: <Building2 className="w-4 h-4" /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : stats && (
                <>
                  {/* MRR Banner */}
                  <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
                    <p className="text-sm font-medium opacity-80 mb-1">Monthly Recurring Revenue</p>
                    <p className="font-heading text-5xl font-bold">${stats.mrr.toLocaleString()}</p>
                    <p className="text-sm opacity-70 mt-2">{stats.newOrgsThisMonth} new org{stats.newOrgsThisMonth !== 1 ? 's' : ''} this month</p>
                  </div>

                  {/* Plan breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['starter', 'professional', 'enterprise'] as const).map(plan => (
                      <div key={plan} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                        <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-3 capitalize ${planColor[plan]}`}>{plan}</p>
                        <p className="font-heading text-3xl font-bold text-foreground">{stats.planBreakdown[plan] ?? 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan === 'starter' ? 'Free' : `$${PLAN_PRICE[plan]}/mo each`}
                          {plan !== 'starter' && ` · $${((stats.planBreakdown[plan] ?? 0) * PLAN_PRICE[plan]).toLocaleString()} MRR`}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Usage stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { icon: <Building2 className="w-5 h-5 text-primary" />, label: 'Total Orgs', value: stats.totalOrgs },
                      { icon: <Users className="w-5 h-5 text-primary" />, label: 'Active Users', value: stats.totalUsers },
                      { icon: <Activity className="w-5 h-5 text-primary" />, label: 'Drafts This Month', value: stats.totalDraftsThisMonth },
                      { icon: <TrendingUp className="w-5 h-5 text-primary" />, label: 'Drafts All Time', value: stats.totalDraftsAllTime },
                      { icon: <MessageSquare className="w-5 h-5 text-primary" />, label: 'Chat Messages', value: stats.totalChatMessages },
                      { icon: <FileText className="w-5 h-5 text-primary" />, label: 'Policy Documents', value: stats.totalDocuments },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
                        <div>
                          <p className="font-heading text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Orgs Tab */}
          {activeTab === 'orgs' && (
            <div>
              {loadingOrgs ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organisation</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Users</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Drafts</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {orgs.map((org, i) => (
                        <tr key={org.id} className={i < orgs.length - 1 ? 'border-b border-border' : ''}>
                          <td className="px-4 py-3 font-medium text-foreground">{org.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColor[org.plan_tier]}`}>
                              {org.plan_tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{org.member_count}</td>
                          <td className="px-4 py-3 text-muted-foreground">{org.draft_count}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {org.last_active ? new Date(org.last_active).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(org.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={org.plan_tier}
                              disabled={updatingPlan === org.id}
                              onChange={e => updateOrgPlan(org.id, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                            >
                              <option value="starter">Starter</option>
                              <option value="professional">Professional</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
