import Link from 'next/link';

interface ButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'default' | 'sm';
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'default',
  href,
  className = '',
  children,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.98]';

  const variants = {
    primary:
      'bg-accent text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]',
    ghost:
      'bg-transparent text-accent ring-1 ring-accent/40 hover:ring-accent hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]',
  };

  const sizes = {
    default: 'px-6 py-3',
    sm: 'px-4 py-2 text-sm',
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
