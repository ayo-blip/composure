import { Link } from "react-router-dom";
import { DraftGenerator } from "@/components/DraftGenerator";
import { FileEdit, Shield, BookOpen, LogIn, LogOut, Database, LayoutDashboard, Zap, Moon, Sun, MessageSquare, ShieldAlert, ThumbsUp, FileText, ClipboardList, Users, Star, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Professionally Worded Drafts",
    description: "Get a carefully worded message for any sensitive workplace situation — performance, attendance, mental health, and more.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Assessment",
    description: "Every draft comes with a plain-language risk rating so you know what to watch out for before the conversation happens.",
  },
  {
    icon: FolderOpen,
    title: "Employee Case Timeline",
    description: "Link every draft to an employee case and build a documented record over time — organised, audit-ready, and defensible.",
  },
  {
    icon: Database,
    title: "Your Policies, Built In",
    description: "Upload your HR handbook, policies, and collective agreements. Every draft is grounded in your organisation's own guidelines — not generic advice.",
  },
  {
    icon: FileText,
    title: "Ready-to-File Documentation",
    description: "A factual, professionally worded record of the conversation — ready to go straight into your HR file.",
  },
  {
    icon: ClipboardList,
    title: "Talking Points for the Room",
    description: "Walk into every conversation prepared. Get a structured list of points that keep things on track and professional.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "HR Manager, Healthcare",
    quote: "HRCompoSure saved me hours every week. I used to agonise over wording for difficult conversations — now I have a professional draft in under a minute.",
  },
  {
    name: "James T.",
    role: "Operations Director, Manufacturing",
    quote: "The risk assessment feature alone is worth it. It flagged language in my draft that could have caused a grievance. Invaluable for our unionized environment.",
  },
  {
    name: "Priya K.",
    role: "People & Culture Lead, Tech",
    quote: "We uploaded our entire employee handbook and now every draft references our actual policies. It feels like having an HR advisor on call 24/7.",
  },
];

const Index = () => {
  const { user, profile, planTier, signOut, loading } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();

  const firstName = profile?.full_name?.split(' ')[0] ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
              <FileEdit className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold text-foreground">HR<span className="text-accent">CompoSure</span></h1>
              <p className="text-xs text-muted-foreground">Thoughtful workplace communications</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!loading && (
              <>
                {user ? (
                  <>
                    {profile?.role === 'admin' && (
                      <>
                        <Link to="/knowledge-base">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Database className="w-4 h-4" />
                            <span className="hidden sm:inline">Knowledge Base</span>
                          </Button>
                        </Link>
                        <Link to="/admin">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Admin</span>
                          </Button>
                        </Link>
                      </>
                    )}
                    <Link to="/library">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Library</span>
                      </Button>
                    </Link>
                    <Link to="/pricing">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Pricing</span>
                      </Button>
                    </Link>
                    {planTier && planTier !== 'starter' && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">
                        {planTier}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/pricing">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Pricing</span>
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="default" size="sm" className="gap-2">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Welcome greeting */}
          {user && firstName && (
            <p className="text-sm text-muted-foreground mb-6 animate-fade-in">
              Welcome back, <span className="font-semibold text-foreground">{firstName}</span>
            </p>
          )}

          {/* Hero */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 animate-fade-in">
              Every Difficult Conversation,
              <br />
              <span className="text-accent">Handled Right — and Documented</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-in mb-6" style={{ animationDelay: "100ms" }}>
              Draft professional workplace communications, assess risk, and build a defensible paper trail for every employee situation. Built for managers and people leaders.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "150ms" }}>
              <Shield className="w-4 h-4" />
              <span>No legal/medical opinions • No blame or judgment • Plain language</span>
            </div>
          </div>

          {/* Generator */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <DraftGenerator />
          </div>
        </div>

        {/* Features + Testimonials — logged-out visitors only */}
        {!loading && !user && (
          <div className="border-t border-border bg-secondary/30 mt-16">
            <div className="container mx-auto px-4 py-16 max-w-6xl">

              {/* Features */}
              <div className="text-center mb-10">
                <h3 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-3">Everything you need in one place</h3>
                <p className="text-muted-foreground max-w-xl mx-auto text-sm">Every draft comes with a full set of tools to help you communicate with confidence.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Testimonials */}
              <div className="mt-20">
                <div className="text-center mb-10">
                  <h3 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-3">Trusted by people leaders</h3>
                  <p className="text-muted-foreground text-sm">Managers and HR teams using HRCompoSure every week.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {TESTIMONIALS.map((t) => (
                    <div key={t.name} className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">"{t.quote}"</p>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-14">
                <Link to="/auth">
                  <Button variant="accent" size="lg" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Get started free — 10 drafts/month
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            For guidance only. Always consult HR and legal advisors for specific situations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
