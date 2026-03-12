import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import type { ExperiencePageContent } from '@/types/content';
import Link from 'next/link';

export const revalidate = 60; // Phase 3: remove revalidate when page becomes fully client-rendered with Three.js
export const metadata: Metadata = { title: 'Experience', description: 'Interactive scroll-driven experience.' };

export default async function ExperiencePage() {
  const page = await getPage('experience');
  const content = page?.content as unknown as ExperiencePageContent | undefined;
  const sections = content?.sections || [];
  const footerNav = content?.footerNav || [];

  return (
    <div className="min-h-screen">
      {/* Phase 3 will add particle canvas background */}
      <div className="relative z-10">
        {sections.map((section, i) => (
          <section
            key={section.label || i}
            className="min-h-screen flex items-center px-6"
            data-reveal="fade-up"
          >
            <div className={`mx-auto max-w-4xl w-full ${i % 2 === 1 ? 'text-right' : ''}`}>
              <span className="text-xs font-mono text-accent/50">{section.label}</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mt-2">
                {section.content.heading}
              </h2>
              <p className="text-text-muted mt-4 max-w-lg">{section.content.body}</p>
            </div>
          </section>
        ))}

        {/* Brand section */}
        <section className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl sm:text-8xl font-bold text-text-primary leading-none">
              MISSING<br />
              <span className="text-accent">PIECE</span><br />
              SOLUTIONS
            </h2>
          </div>
        </section>

        {/* Footer nav */}
        <footer className="py-12 px-6 text-center space-y-6">
          <p className="text-sm text-text-muted">AI systems that close the gap between ambition and outcome.</p>
          <div className="flex justify-center gap-6">
            {footerNav.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-text-muted hover:text-accent transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
