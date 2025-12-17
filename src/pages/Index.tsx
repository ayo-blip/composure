import { Link } from "react-router-dom";
import { DraftGenerator } from "@/components/DraftGenerator";
import { FileEdit, Shield, BookOpen, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut, loading } = useAuth();

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
          <nav className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link to="/library">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Library</span>
                      </Button>
                    </Link>
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
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
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
