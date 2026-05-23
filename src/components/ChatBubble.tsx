import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Megaphone, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "broadcast";
  content: string;
  created_at: string;
}

const LAST_SEEN_KEY = "composure_chat_last_seen";

export function ChatBubble() {
  const { user, profile, planTier } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check push support on mount
  useEffect(() => {
    setPushSupported("Notification" in window && "serviceWorker" in navigator);
    setPushEnabled(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!user || !profile?.organisation_id || planTier !== "enterprise") return;

    fetchMessages();

    // Subscribe to new broadcasts in real time
    const channel = supabase
      .channel(`chat:${profile.organisation_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, profile?.organisation_id, planTier]);

  // Recalculate unread whenever messages or open state changes
  useEffect(() => {
    if (open) {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setUnreadCount(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } else {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      const count = messages.filter(
        (m) => m.role === "broadcast" && (!lastSeen || m.created_at > lastSeen)
      ).length;
      setUnreadCount(count);
    }
  }, [open, messages]);

  const fetchMessages = async () => {
    if (!user || !profile?.organisation_id) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`user_id.eq.${user.id},role.eq.broadcast`)
      .order("created_at", { ascending: true })
      .limit(60);
    if (data) setMessages(data as ChatMessage[]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !profile?.organisation_id || !user) return;
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-hr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            organisation_id: profile.organisation_id,
            user_id: user.id,
          }),
        }
      );
      await fetchMessages(); // Replace optimistic with real messages
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          { id: `err-${Date.now()}`, role: "assistant", content: err.error ?? "Sorry, something went wrong.", created_at: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: `err-${Date.now()}`, role: "assistant", content: "Connection error. Please try again.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPushPermission = async () => {
    if (!user || !profile?.organisation_id) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    setPushEnabled(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        organisation_id: profile.organisation_id,
        endpoint: json.endpoint!,
        p256dh: (json.keys as any)?.p256dh ?? "",
        auth: (json.keys as any)?.auth ?? "",
      }, { onConflict: "user_id,endpoint" });
    } catch {
      // Push subscription failed silently — notification permission still granted
    }
  };

  // Only render for enterprise users
  if (!user || planTier !== "enterprise") return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">HR Assistant</p>
              <p className="text-xs text-muted-foreground truncate">Jurisdiction-aware · Policy-grounded</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {pushSupported && (
                <button
                  onClick={pushEnabled ? undefined : requestPushPermission}
                  title={pushEnabled ? "Desktop notifications on" : "Enable desktop notifications"}
                  className={`p-1.5 rounded-lg transition-colors ${pushEnabled ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  {pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">HR Assistant</p>
                <p className="text-xs text-muted-foreground">
                  Ask anything — policies, workplace situations, leave entitlements, or how to handle a specific scenario.
                </p>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === "broadcast" ? (
                <div key={msg.id} className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-2.5">
                  <Megaphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">Admin Announcement</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : msg.role === "user" ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[80%] text-foreground whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask an HR question..."
                className="flex-1 text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={isLoading}
              />
              <Button size="icon" variant="accent" onClick={sendMessage} disabled={!input.trim() || isLoading} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Guidance only · Always consult qualified HR and legal advisors
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center justify-center"
        aria-label="Open HR Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
