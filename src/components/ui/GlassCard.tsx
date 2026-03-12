interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ hover = false, className = '', children, ...rest }: GlassCardProps) {
  const base = 'bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 shadow-lg p-6';
  const hoverStyles = hover
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] hover:ring-accent/30'
    : '';

  return <div className={`${base} ${hoverStyles} ${className}`} {...rest}>{children}</div>;
}
