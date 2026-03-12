import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };
export const revalidate = 300;

export default function PrivacyPage() {
  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl prose prose-invert prose-accent">
        <h1>Privacy Policy</h1>
        <p className="text-text-muted"><em>Last updated: March 2026</em></p>

        <h2>What We Collect</h2>
        <p>When you use our contact form, we collect your name, email address, company name (optional), project type (optional), and message. This information is stored securely in our database.</p>

        <h2>How We Use It</h2>
        <p>We use your information solely to respond to your inquiry and discuss potential collaboration. We do not sell, share, or distribute your personal information to third parties.</p>

        <h2>Third-Party Services</h2>
        <p>This site is hosted on a VPS and uses Supabase for data storage. These services may process data according to their own privacy policies.</p>

        <h2>Data Retention</h2>
        <p>We retain your contact information for as long as necessary to maintain our business relationship. You may request deletion at any time.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:hello@missingpiecesolutions.com">hello@missingpiecesolutions.com</a> to exercise these rights.</p>

        <h2>Cookies</h2>
        <p>We use essential cookies for authentication. We do not use tracking or advertising cookies.</p>

        <h2>Contact</h2>
        <p>For privacy-related questions, email <a href="mailto:hello@missingpiecesolutions.com">hello@missingpiecesolutions.com</a>.</p>
      </div>
    </article>
  );
}
