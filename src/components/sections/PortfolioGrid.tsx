import Link from 'next/link';
import Image from 'next/image';
import type { CaseStudy } from '@/types/database';

interface PortfolioGridProps {
  projects: CaseStudy[];
}

export function PortfolioGrid({ projects }: PortfolioGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/portfolio/${project.slug}`}
          className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-accent/30 transition-all"
        >
          <div className="aspect-[4/3] bg-surface flex items-center justify-center relative">
            {project.cover_image ? (
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <span className="text-4xl text-accent/30 font-bold">
                {project.title.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <div>
              <h3 className="font-bold text-text-primary">{project.title}</h3>
              <p className="text-sm text-text-muted">{project.client || project.industry}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
