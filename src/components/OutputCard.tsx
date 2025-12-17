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
  highlightPlaceholders?: boolean;
}

// Function to highlight placeholders like [Employee Name], [Manager Name], [Date], etc.
const renderContentWithPlaceholders = (content: string, highlight: boolean) => {
  if (!highlight) return content;
  
  const placeholderRegex = /\[([^\]]+)\]/g;
  const parts = content.split(placeholderRegex);
  
  return parts.map((part, index) => {
    // Every odd index is a captured group (the placeholder content)
    if (index % 2 === 1) {
      return (
        <span
          key={index}
          className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1 py-0.5 rounded font-medium"
        >
          [{part}]
        </span>
      );
    }
    return part;
  });
};

export function OutputCard({ title, content, icon, delay = 0, isVisible, headerContent, highlightPlaceholders = false }: OutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  const hasPlaceholders = highlightPlaceholders && /\[[^\]]+\]/.test(content);

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
          {renderContentWithPlaceholders(content, highlightPlaceholders)}
        </p>
        {hasPlaceholders && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            Replace highlighted placeholders with actual names before sending
          </p>
        )}
      </div>
    </div>
  );
}
