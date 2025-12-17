import { DraftGenerator } from "@/components/DraftGenerator";
import { FileEdit } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">DraftCraft</h1>
            <p className="text-xs text-muted-foreground">Professional message drafting</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 animate-fade-in">
            Craft Perfect Messages,
            <br />
            <span className="text-accent">Every Time</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            Generate professional drafts, talking points, and documentation notes tailored to your scenario and tone preferences.
          </p>
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
            Crafted with precision for professional communication
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
