import { Link } from "react-router-dom";
import { DraftGenerator } from "@/components/DraftGenerator";
import { FileEdit, Shield, BookOpen, LogIn, LogOut, Database, LayoutDashboard, Zap, Moon, Sun, MessageSquare, ShieldAlert, ThumbsUp, FileText, ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI-Drafted Messages",
    description: "Get a professionally worded message for any sensitive workplace situation — performance, attendance, mental health, and more.",
  },
  {
    icon: ClipboardList,
    title: "Key Talking Points",
    description: "Know exactly what to say in the room. Get a structured list of points to guide your conversation confidently.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Assessment",
    description: "Every draft includes a risk rating — Low, Moderate, or High — so you know what to watch out for before you send.",
  },
  {
    icon: ThumbsUp,
    title: "AI Confidence Score",
    description: "See how strong your draft is rated out of 10, with specific strengths and suggestions to improve it.",
  },
  {
    icon: FileText,
    title: "Documentation Note",
    description: "A ready-to-use record of the conversation for your HR file — factual, professional, and legally mindful.",
  },
  {
    icon: Users,
    title: "Sector-Aware Guidance",
    description: "Tailored for private, public sector, and unionized environments — including collective agreement awareness.",
  },
];

const Index = () => {
  const { user, profile, planTier, signOut, loading } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();

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
              <h1 className="font-heading text-xl font-semibold text-foreground">Compo<span className="text-accent">Sure</span></h1>
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
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 animate-fade-in">
            Professional Workplace Communications,
            <br />
            <span className="text-accent">Crafted with Care</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-in mb-6" style={{ animationDelay: "100ms" }}>
            Generate thoughtful, professional messages for sensitive workplace conversations. Built for managers and people leaders.
          </p>

          {/* Guidelines Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "150ms" }}>
            <Shield className="w-4 h-4" />
            <span>No legal/medical opinions • No blame or judgment • Plain language</span>
          </div>
        </div>

        {/* Feature Cards — shown to logged-out visitors only */}
        {!loading && !user && (
          <div className="max-w-4xl mx-auto mb-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-card border border-border rounded-2xl p-5 shadow-card animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link to="/auth">
                <Button variant="accent" size="lg" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Get started free — 10 drafts/month
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
            </div>
          </div>
        )}

        {/* Generator */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <DraftGenerator />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            For guidance only. Always consult HR and legal advisors for specific situations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
