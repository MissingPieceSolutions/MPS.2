import Image from 'next/image';
import { GlassCard } from '@/components/ui/GlassCard';

interface FounderCardProps {
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  initials: string;
  photo?: string | null;
}

export function FounderCard({ name, role, bio, linkedin, initials, photo }: FounderCardProps) {
  return (
    <GlassCard hover className="flex flex-col items-center text-center gap-4">
      {photo ? (
        <Image src={photo} alt={name} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold">
          {initials}
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold text-text-primary">{name}</h3>
        <p className="text-sm text-accent">{role}</p>
      </div>
      <p className="text-sm text-text-muted">{bio}</p>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-accent hover:underline"
      >
        LinkedIn &rarr;
      </a>
    </GlassCard>
  );
}
