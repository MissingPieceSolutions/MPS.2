import { GlassCard } from '@/components/ui/GlassCard';

interface StatCalloutProps {
  value: string;
  label: string;
}

export function StatCallout({ value, label }: StatCalloutProps) {
  return (
    <GlassCard hover className="text-center">
      <p className="text-3xl font-bold text-accent">{value}</p>
      <p className="text-sm text-text-muted mt-2">{label}</p>
    </GlassCard>
  );
}
