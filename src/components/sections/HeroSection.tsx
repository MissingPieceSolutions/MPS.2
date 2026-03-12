import { Button } from '@/components/ui/Button';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

export function HeroSection({ headline, subheadline, ctaPrimary, ctaSecondary }: HeroSectionProps) {
  return (
    <section id="hero" className="relative py-24 sm:py-32 px-6">
      <div className="mx-auto max-w-4xl text-center space-y-8" data-reveal="fade-up">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
          {headline}
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
          {subheadline}
        </p>
        {(ctaPrimary || ctaSecondary) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ctaPrimary && (
              <Button href={ctaPrimary.href}>{ctaPrimary.label}</Button>
            )}
            {ctaSecondary && (
              <Button href={ctaSecondary.href} variant="ghost">
                {ctaSecondary.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
