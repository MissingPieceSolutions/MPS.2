interface SectionHeadingProps {
  eyebrow: string;
  heading: string;
  subheading?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'items-start';

  return (
    <div className={`flex flex-col gap-3 ${alignment} ${className}`}>
      <span className="text-xs uppercase tracking-widest text-accent font-mono">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">{heading}</h2>
      {subheading && (
        <p className="text-lg text-text-muted max-w-2xl">{subheading}</p>
      )}
    </div>
  );
}
