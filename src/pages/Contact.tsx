import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Open mailto as fallback — can be replaced with a Brevo API call later
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    const subjectEnc = encodeURIComponent(subject || 'HRCompoSure Enquiry');
    window.location.href = `mailto:hello@hrcomposure.com?subject=${subjectEnc}&body=${body}`;
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
            <p className="text-xs text-muted-foreground">Contact & Support</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-10">
          <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">Get in touch</h2>
          <p className="text-muted-foreground">We're here to help. Send us a message and we'll get back to you promptly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact options */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">General enquiries</h3>
              <a href="mailto:hello@hrcomposure.com" className="text-sm text-accent hover:underline">hello@hrcomposure.com</a>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Support</h3>
              <a href="mailto:hello@hrcomposure.com?subject=Support Request" className="text-sm text-accent hover:underline">hello@hrcomposure.com</a>
              <p className="text-xs text-muted-foreground mt-1">We aim to respond within 1 business day.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Custom plans</h3>
              <a href="mailto:hello@hrcomposure.com?subject=Custom Plan Enquiry" className="text-sm text-accent hover:underline">hello@hrcomposure.com</a>
              <p className="text-xs text-muted-foreground mt-1">Need more than 30 seats? Let's talk.</p>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2">
            {sent ? (
              <div className="bg-card border border-border rounded-2xl p-10 shadow-card flex flex-col items-center justify-center text-center h-full">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Message sent</h3>
                <p className="text-sm text-muted-foreground">Your email client should have opened. If not, email us directly at <a href="mailto:hello@hrcomposure.com" className="text-accent hover:underline">hello@hrcomposure.com</a>.</p>
                <button onClick={() => navigate('/')} className="mt-6 text-sm text-accent hover:underline">Back to home</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Question about the Enterprise plan"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="How can we help?"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
                </div>
                <Button type="submit" variant="accent" className="gap-2 w-full" disabled={isLoading}>
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">For guidance only. Always consult HR and legal advisors for specific situations.</p>
        </div>
      </footer>
    </div>
  );
}
