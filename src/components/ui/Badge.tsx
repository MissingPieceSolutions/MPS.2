interface BadgeProps {
  variant?: 'accent' | 'muted';
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'accent', className = '', children }: BadgeProps) {
  const variants = {
    accent: 'bg-accent/10 text-accent border-accent/20',
    muted: 'bg-surface-elevated text-text-muted border-white/5',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-mono ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
