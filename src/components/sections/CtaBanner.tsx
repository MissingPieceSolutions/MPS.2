import { Button } from '@/components/ui/Button';

interface CtaBannerProps {
  heading: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CtaBanner({ heading, subtext, ctaLabel, ctaHref }: CtaBannerProps) {
  return (
    <section className="py-20 px-6" data-reveal="scale">
      <div className="mx-auto max-w-3xl text-center space-y-6 bg-accent/5 rounded-2xl p-12 ring-1 ring-accent/10">
        <h2 className="text-3xl font-bold text-text-primary">{heading}</h2>
        <p className="text-text-muted">{subtext}</p>
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
    </section>
  );
}
