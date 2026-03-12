import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactForm } from './ContactForm';
import type { ContactPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact');
  return { title: page?.title || 'Contact', description: page?.description || undefined };
}

export default async function ContactPage() {
  const page = await getPage('contact');
  const content = page?.content as unknown as ContactPageContent | undefined;

  return (
    <div className="pb-12">
      <section id="contact" className="px-6 pt-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <SectionHeading
            eyebrow="Contact"
            heading={content?.intro?.heading || 'Get in Touch'}
            subheading={content?.intro?.text}
          />
          <ContactForm
            fields={content?.form_fields || []}
            submitLabel={content?.form_submit_label || 'Send Message'}
            successMessage={content?.form_success_message || 'Thanks! We\'ll be in touch.'}
            errorMessage={content?.form_error_message || 'Something went wrong.'}
            privacyNote={content?.privacy_note || ''}
          />
        </div>
      </section>
    </div>
  );
}
