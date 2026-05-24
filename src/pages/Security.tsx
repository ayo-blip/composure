import { Link } from 'react-router-dom';
import { FileEdit, Lock, Shield, Server, Eye, Trash2, FileCheck, Users, ArrowLeft } from 'lucide-react';

const PILLARS = [
  {
    icon: Lock,
    title: 'Encrypted at rest and in transit',
    body: 'All data is encrypted using AES-256 at rest and TLS 1.2+ in transit. Your documents, case notes, and draft communications are never stored in plain text.',
  },
  {
    icon: Eye,
    title: 'We never train on your data',
    body: 'Your uploaded HR policies, employee case notes, and generated drafts are never used to train any AI model — by us or our AI provider. Your data is used solely to generate your responses, then discarded from the model context.',
  },
  {
    icon: Users,
    title: 'Strict data isolation',
    body: 'Every organisation\'s data is isolated using row-level security. No member of another organisation can ever access your cases, documents, or drafts — by design, not just policy.',
  },
  {
    icon: Server,
    title: 'Hosted on enterprise-grade infrastructure',
    body: 'HRCompoSure is built on Supabase (SOC 2 Type II certified) and hosted on AWS infrastructure. We inherit their security controls, audit trails, and uptime guarantees.',
  },
  {
    icon: Shield,
    title: 'GDPR compliant by design',
    body: 'We operate under UK GDPR and EU GDPR. You remain the data controller for your employees\' information at all times. We act only as a data processor, on your instruction.',
  },
  {
    icon: Trash2,
    title: 'Your right to deletion',
    body: 'You can delete individual drafts, case notes, and uploaded documents at any time. To request full data deletion for your organisation, contact us at hello@hrcomposure.com.',
  },
  {
    icon: FileCheck,
    title: 'Data Processing Agreement (DPA)',
    body: 'Enterprise customers receive a signed Data Processing Agreement (DPA) as required under GDPR Article 28. Contact us to request your DPA before going live.',
  },
  {
    icon: Lock,
    title: 'Minimum data collection',
    body: 'We only collect what is necessary to operate the service. We do not sell, share, or monetise your data in any form. See our Privacy Policy for the full breakdown.',
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="mr-2 p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <FileEdit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              HR<span className="text-accent">CompoSure</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Your data is private, protected, and yours.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              We understand that HR data is among the most sensitive information your organisation holds. Here is exactly how we handle it — and what we will never do with it.
            </p>
          </div>

          {/* Key commitment banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-10 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">We never train on your data — ever.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your employee case notes, HR policy documents, and generated drafts are never used to improve or train any AI model. They exist solely to generate your response in the moment, and are not retained by the model after your session.
              </p>
            </div>
          </div>

          {/* Pillars grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>

          {/* DPA CTA */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card mb-8">
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Need a Data Processing Agreement?</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
              Enterprise customers can request a signed DPA before going live. Required under GDPR Article 28 for any controller–processor relationship.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Request a DPA
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Questions about data handling?{' '}
            <a href="mailto:hello@hrcomposure.com" className="underline hover:text-foreground transition-colors">hello@hrcomposure.com</a>
            {' '}·{' '}
            <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
