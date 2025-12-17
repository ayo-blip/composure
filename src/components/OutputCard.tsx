import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OutputCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  delay?: number;
  isVisible: boolean;
  headerContent?: React.ReactNode;
}

export function OutputCard({ title, content, icon, delay = 0, isVisible, headerContent }: OutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "group bg-card rounded-xl border border-border shadow-card hover:shadow-hover transition-all duration-300",
        "opacity-0 animate-slide-up"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
          {headerContent && <div className="ml-2">{headerContent}</div>}
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-5">
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap font-body text-sm">
          {content}
        </p>
      </div>
    </div>
  );
}
