import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

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
            <p className="text-xs text-muted-foreground">Privacy Policy</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="font-heading text-3xl font-semibold text-foreground mb-2">Privacy Policy</h2>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">1. Who We Are</h3>
            <p className="text-muted-foreground leading-relaxed">
              HRCompoSure ("we", "us", or "our") provides a workplace communications platform that helps managers and HR professionals draft sensitive workplace communications, assess risk, and maintain employee case records. Our service is available at hrcomposure.com.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">2. Information We Collect</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account information:</strong> Your name, email address, and organisation details provided at sign-up.</li>
              <li><strong className="text-foreground">Content you create:</strong> Draft communications, employee case notes, and any documents you upload to the knowledge base (e.g. HR policies, handbooks).</li>
              <li><strong className="text-foreground">Usage data:</strong> Pages visited, features used, and session information collected automatically.</li>
              <li><strong className="text-foreground">Billing information:</strong> Handled directly by Stripe. We do not store card details.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">3. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>To provide and improve the HRCompoSure service.</li>
              <li>To generate AI-assisted draft communications using content you provide.</li>
              <li>To send transactional emails (e.g. billing receipts, admin announcements within your organisation).</li>
              <li>To respond to support requests.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">4. AI Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              HRCompoSure uses OpenAI and Anthropic APIs to generate draft content. Information you enter (scenario details, context notes, employee names) is sent to these APIs for processing. We do not use your content to train AI models. You should avoid entering personally identifiable health or medical information beyond what is necessary for the communication.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">5. Data Storage and Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using Supabase (hosted on AWS infrastructure). We implement row-level security so that users can only access data belonging to their own organisation. Data is encrypted in transit (TLS) and at rest.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">6. Data Sharing</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">We do not sell your data. We share data only with:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> — database and authentication infrastructure.</li>
              <li><strong className="text-foreground">OpenAI / Anthropic</strong> — AI processing of draft generation requests.</li>
              <li><strong className="text-foreground">Stripe</strong> — payment processing.</li>
              <li><strong className="text-foreground">Brevo</strong> — transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">7. Data Retention</h3>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. If you cancel your account, you may request deletion of your data by contacting us. Some data may be retained for up to 90 days in backups before being permanently deleted.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">8. Your Rights</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">Depending on your location, you may have rights including:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Access to the personal data we hold about you.</li>
              <li>Correction of inaccurate data.</li>
              <li>Deletion of your data.</li>
              <li>Data portability.</li>
              <li>Objection to processing.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">To exercise these rights, contact us at <strong className="text-foreground">privacy@hrcomposure.com</strong>.</p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">9. Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management only. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">10. Changes to This Policy</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify you of material changes by email or via an in-app notice. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h3 className="font-heading text-lg font-semibold mb-2">11. Contact</h3>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions or requests, contact us at <strong className="text-foreground">privacy@hrcomposure.com</strong>.
            </p>
          </section>

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
