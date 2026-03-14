'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const ParticleExperience = dynamic(() => import('@/components/three/ParticleExperience'), { ssr: false });

const STAGES = [
  {
    number: '001',
    eyebrow: 'Raw Data',
    heading: 'WE FIND\nTHE PIECES',
    body: 'Every business has gaps between what they want to achieve and what their systems can do. We find them.',
    align: 'left' as const,
  },
  {
    number: '002',
    eyebrow: 'Connected',
    heading: 'WE\nCONNECT THEM',
    body: 'AI agents, automation workflows, and intelligent systems — custom-built to bridge the gap.',
    align: 'right' as const,
  },
  {
    number: '003',
    eyebrow: 'Intelligent',
    heading: 'ORBIT\nACHIEVED',
    body: 'Your operations run smoother, your team focuses on what matters, and your business scales.',
    align: 'left' as const,
  },
];

const FOOTER_NAV = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function ExperiencePage() {
  return (
    <div className="min-h-screen">
      <ParticleExperience />

      <div className="relative z-10">
        {STAGES.map((stage, i) => (
          <section
            key={stage.number}
            className="min-h-screen flex items-center px-6"
            data-reveal="fade"
            {...(i === STAGES.length - 1 ? { 'data-morph-end': '' } : {})}
          >
            <div className={`mx-auto max-w-4xl w-full ${stage.align === 'right' ? 'text-right' : ''}`}>
              <span className="text-xs font-mono text-accent/50">{stage.eyebrow}</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mt-2 whitespace-pre-line">
                {stage.heading}
              </h2>
              <p className={`text-text-muted mt-4 max-w-lg ${stage.align === 'right' ? 'ml-auto' : ''}`}>
                {stage.body}
              </p>
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
            {FOOTER_NAV.map((link) => (
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
